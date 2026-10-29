import { ERROR_CODES, type ApiErrorDetail } from '@formula/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function flattenErrors(errors: ValidationError[], parent = ''): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenErrors(error.children ?? [], field)];
  });
}

/** Global pipe: strips unknown fields, rejects extras and reports errors in the shared format. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Validation failed',
        details: flattenErrors(errors),
      }),
  });
}
