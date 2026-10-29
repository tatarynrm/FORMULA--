import { AUTH_COOKIES, type UploadedFile } from '@formula/shared';
import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile as UploadedFileParam,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FilesService } from './files.service.js';
import { StorageService } from './storage.service.js';
import { UploadInterceptor, parsePurpose } from './upload.interceptor.js';

/** Parses `Range: bytes=start-end`. Returns `null` for a missing or malformed header, `'invalid'` if unsatisfiable. */
function parseRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | 'invalid' | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start = rawStart ? Number(rawStart) : NaN;
  let end = rawEnd ? Number(rawEnd) : NaN;

  if (Number.isNaN(start)) {
    // "bytes=-500": the last 500 bytes.
    if (Number.isNaN(end) || end === 0) return 'invalid';
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (Number.isNaN(end) || end >= size) {
    end = size - 1;
  }

  return start > end || start >= size ? 'invalid' : { start, end };
}

@ApiTags('files')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller()
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly storage: StorageService,
  ) {}

  @Post('uploads')
  @UseInterceptors(UploadInterceptor)
  @ApiOperation({
    summary:
      'Upload one file. Avatars and chat pictures: any user. Images, videos, documents: admins.',
  })
  @ApiQuery({ name: 'purpose', enum: ['avatar', 'image', 'video', 'document', 'chat'] })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  upload(
    @CurrentUser() user: RequestUser,
    @Query('purpose') purpose: string,
    @UploadedFileParam() file: Express.Multer.File | undefined,
  ): Promise<UploadedFile> {
    // `UploadInterceptor` already rejected an unknown purpose.
    return this.files.saveUpload(user.userId, parsePurpose(purpose) ?? 'image', file);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Download or stream a file (supports Range for video)' })
  async download(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('range') rangeHeader: string | undefined,
    @Req() _request: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.files.getReadable(user.userId, id);
    const size = await this.storage.size(file.storageKey);
    const range = parseRange(rangeHeader, size);

    if (range === 'invalid') {
      response.status(416).setHeader('Content-Range', `bytes */${size}`).end();
      return;
    }

    const isMedia = file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/');
    const encodedName = encodeURIComponent(file.originalName);

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader(
      'Content-Disposition',
      `${isMedia ? 'inline' : 'attachment'}; filename*=UTF-8''${encodedName}`,
    );
    // The web app is on another port (same site) in development; helmet's default would block embedding.
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader('Cache-Control', 'private, max-age=3600');

    if (range) {
      response.status(206);
      response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
      response.setHeader('Content-Length', String(range.end - range.start + 1));
    } else {
      response.setHeader('Content-Length', String(size));
    }

    const stream = this.storage.read(file.storageKey, range ?? undefined);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  }
}
