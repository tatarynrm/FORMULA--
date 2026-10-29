import { randomUUID } from 'node:crypto';

import { type FilePurpose, UPLOADS, type UploadedFile } from '@formula/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AccessService } from '../access/access.service.js';
import { type FileRecord, FilesRepository } from './files.repository.js';
import { StorageService } from './storage.service.js';
import { buildStorageKey } from './upload.interceptor.js';

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  bytes.every((byte, index) => buffer[offset + index] === byte);
const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/** The first bytes of a file must match its declared type, so a renamed .exe cannot pass as a PDF. */
const SIGNATURES: Record<string, (head: Buffer) => boolean> = {
  'image/png': (head) => startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/jpeg': (head) => startsWith(head, [0xff, 0xd8, 0xff]),
  'image/gif': (head) => startsWith(head, ascii('GIF8')),
  'image/webp': (head) => startsWith(head, ascii('RIFF')) && startsWith(head, ascii('WEBP'), 8),
  'application/pdf': (head) => startsWith(head, ascii('%PDF')),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (head) =>
    startsWith(head, [0x50, 0x4b, 0x03, 0x04]),
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (head) =>
    startsWith(head, [0x50, 0x4b, 0x03, 0x04]),
  'application/msword': (head) =>
    startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'application/vnd.ms-excel': (head) =>
    startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  'video/mp4': (head) => startsWith(head, ascii('ftyp'), 4),
  'video/quicktime': (head) =>
    startsWith(head, ascii('ftyp'), 4) || startsWith(head, ascii('moov'), 4),
  'video/webm': (head) => startsWith(head, [0x1a, 0x45, 0xdf, 0xa3]),
};

export type { FileRecord };

@Injectable()
export class FilesService {
  constructor(
    private readonly repository: FilesRepository,
    private readonly storage: StorageService,
    private readonly access: AccessService,
  ) {}

  /**
   * Stores an uploaded temp file. Avatars and chat pictures may be uploaded by anyone signed in;
   * everything else (images in questions, videos, documents) only by admins.
   */
  async saveUpload(
    userId: string,
    purpose: FilePurpose,
    file: Express.Multer.File | undefined,
  ): Promise<UploadedFile> {
    if (!file) throw new BadRequestException('No file was sent (use the "file" field)');

    try {
      if (purpose !== 'avatar' && purpose !== 'chat') {
        const context = await this.access.getContext(userId);
        if (context?.role !== 'admin') throw new ForbiddenException();
      }

      const verify = SIGNATURES[file.mimetype];
      const head = await this.storage.readHead(file.path);
      if (
        !(UPLOADS[purpose].mimeTypes as readonly string[]).includes(file.mimetype) ||
        !verify?.(head)
      ) {
        throw new BadRequestException('The file content does not match its type');
      }

      const id = randomUUID();
      const storageKey = buildStorageKey(id, file.originalname);
      await this.storage.commit(file.path, storageKey);

      // Browsers send file names as latin1 bytes of UTF-8 in multipart; restore Cyrillic names.
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 200);

      const record = await this.repository.create({
        id,
        ownerId: userId,
        purpose,
        originalName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
      });

      if (purpose === 'avatar') {
        for (const key of await this.repository.deleteUnusedAvatars(userId, record.id)) {
          await this.storage.remove(key);
        }
      }

      return {
        id: record.id,
        name: record.originalName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
      };
    } catch (error) {
      await this.storage.removeTemp(file.path);
      throw error;
    }
  }

  /** Removes a file (record and bytes) once nothing refers to it. Best effort: a leftover is harmless. */
  async deleteIfUnused(fileId: string): Promise<void> {
    const storageKey = await this.repository.deleteIfUnused(fileId);
    if (storageKey) await this.storage.remove(storageKey);
  }

  /** An avatar must be an avatar-purpose file that this very user uploaded. */
  isOwnAvatar(userId: string, fileId: string): Promise<boolean> {
    return this.repository.isAvatarOwnedBy(fileId, userId);
  }

  /** Removes a replaced avatar (record and bytes). Best effort: a leftover file is harmless. */
  async deleteOwnAvatar(userId: string, fileId: string): Promise<void> {
    const storageKey = await this.repository.deleteOwnedAvatar(fileId, userId);
    if (storageKey) await this.storage.remove(storageKey);
  }

  /** The record of an avatar file (for pictures shown publicly next to a published testimonial). */
  async findAvatarRecord(fileId: string): Promise<FileRecord | null> {
    const file = await this.repository.findById(fileId);
    return file?.purpose === 'avatar' ? file : null;
  }

  /** A chat picture this user uploaded and has not sent yet (so a file id cannot be reused or borrowed). */
  isUnusedChatImageOf(userId: string, fileId: string): Promise<boolean> {
    return this.repository.isUnusedChatImageOf(fileId, userId);
  }

  /** Finds a file the user may open, or throws 404 (never 403, so ids cannot be probed). */
  async getReadable(userId: string, fileId: string): Promise<FileRecord> {
    const file = await this.repository.findById(fileId);
    if (!file) throw new NotFoundException();

    // Pictures are not secret: question images and avatars are shown to every signed-in user.
    if (file.purpose === 'avatar' || file.purpose === 'image') return file;

    // A chat picture is private to the two sides: the uploader, the support team, and the
    // student whose conversation it was sent in.
    if (file.purpose === 'chat') {
      if (file.ownerId === userId) return file;
      const context = await this.access.getContext(userId);
      if (this.access.canUseSection(context, 'support')) return file;
      if (await this.repository.chatImageInConversationOf(fileId, userId)) return file;
      throw new NotFoundException();
    }

    const context = await this.access.getContext(userId);
    if (context?.role === 'admin') return file;
    if (await this.repository.studentCanReadMaterial(fileId, userId)) return file;

    throw new NotFoundException();
  }
}
