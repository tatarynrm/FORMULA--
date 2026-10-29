import { FILE_PURPOSES, type FilePurpose, UPLOADS } from '@formula/shared';
import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Request } from 'express';
import multer, { MulterError } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import type { Observable } from 'rxjs';

import { StorageService } from './storage.service.js';

export function parsePurpose(value: unknown): FilePurpose | null {
  return FILE_PURPOSES.find((purpose) => purpose === value) ?? null;
}

/**
 * Receives one multipart file (field `file`) into a temp directory. The upload purpose comes from
 * the `purpose` query parameter, so the size and type limits are known before the file is read.
 */
@Injectable()
export class UploadInterceptor implements NestInterceptor {
  constructor(private readonly storage: StorageService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<never>();

    const purpose = parsePurpose(request.query['purpose']);
    if (!purpose) {
      throw new BadRequestException(`purpose must be one of: ${FILE_PURPOSES.join(', ')}`);
    }

    const rules = UPLOADS[purpose];
    const tempDir = await this.storage.ensureTempDir();

    const upload = multer({
      storage: multer.diskStorage({
        destination: tempDir,
        // Random name, and no extension from the client beyond a short safe one.
        filename: (_req, file, callback) =>
          callback(
            null,
            `${randomUUID()}${extname(file.originalname)
              .slice(0, 10)
              .replace(/[^.\w]/g, '')}`,
          ),
      }),
      limits: { fileSize: rules.maxBytes, files: 1, fields: 5 },
      fileFilter: (_req, file, callback) => {
        if ((rules.mimeTypes as readonly string[]).includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('This file type is not allowed here'));
        }
      },
    }).single('file');

    await new Promise<void>((resolve, reject) => {
      upload(request, response, (error: unknown) => {
        if (!error) return resolve();
        if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
          return reject(
            new PayloadTooLargeException(
              `File is larger than ${Math.round(rules.maxBytes / 1024 / 1024)} MB`,
            ),
          );
        }
        reject(error instanceof Error ? error : new BadRequestException('Upload failed'));
      });
    });

    return next.handle();
  }
}

/** Where a committed file is stored, spread over month folders so no directory grows huge. */
export function buildStorageKey(fileId: string, originalName: string): string {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const extension = extname(originalName)
    .slice(0, 10)
    .replace(/[^.\w]/g, '')
    .toLowerCase();
  return join(month, `${fileId}${extension}`).replaceAll('\\', '/');
}
