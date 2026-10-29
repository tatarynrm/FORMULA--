import {
  ERROR_CODES,
  type ApiErrorBody,
  type ApiErrorDetail,
  type ApiErrorResponse,
  type ErrorCode,
} from '@formula/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const POSTGRES_UNIQUE_VIOLATION = '23505';

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODES.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.TOO_MANY_REQUESTS,
  [HttpStatus.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVICE_UNAVAILABLE,
};

interface NormalizedError {
  statusCode: number;
  error: ApiErrorBody;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDetails(value: unknown): value is ApiErrorDetail[] {
  return Array.isArray(value);
}

/** Converts every thrown value into the shared `ApiErrorResponse` format. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { statusCode, error } = this.normalize(exception);

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      error,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const code = STATUS_TO_CODE[statusCode] ?? ERROR_CODES.INTERNAL;

      if (isRecord(payload)) {
        const message = payload['message'];
        return {
          statusCode,
          error: {
            code: typeof payload['code'] === 'string' ? (payload['code'] as ErrorCode) : code,
            message: typeof message === 'string' ? message : exception.message,
            ...(isDetails(payload['details']) ? { details: payload['details'] } : {}),
          },
        };
      }

      return { statusCode, error: { code, message: String(payload) } };
    }

    if (isRecord(exception) && exception['code'] === POSTGRES_UNIQUE_VIOLATION) {
      return {
        statusCode: HttpStatus.CONFLICT,
        error: { code: ERROR_CODES.CONFLICT, message: 'Resource already exists' },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: { code: ERROR_CODES.INTERNAL, message: 'Internal server error' },
    };
  }
}
