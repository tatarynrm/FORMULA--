import { createReadStream, type ReadStream } from 'node:fs';
import { mkdir, open, rename, stat, unlink } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';

/**
 * Where files physically live. Everything goes through this class, so moving to S3 later means
 * swapping this implementation, not touching controllers or services.
 */
@Injectable()
export class StorageService {
  private readonly root: string;

  constructor(config: ConfigService<Env, true>) {
    this.root = resolve(config.get('STORAGE_DIR', { infer: true }));
  }

  /** Directory for files that are still being uploaded. */
  get tempDir(): string {
    return resolve(this.root, '.tmp');
  }

  async ensureTempDir(): Promise<string> {
    await mkdir(this.tempDir, { recursive: true });
    return this.tempDir;
  }

  /** Moves an uploaded temp file to its final place under `storageKey`. */
  async commit(tempPath: string, storageKey: string): Promise<void> {
    const target = this.resolveKey(storageKey);
    await mkdir(dirname(target), { recursive: true });
    await rename(tempPath, target);
  }

  async size(storageKey: string): Promise<number> {
    return (await stat(this.resolveKey(storageKey))).size;
  }

  read(storageKey: string, range?: { start: number; end: number }): ReadStream {
    return createReadStream(this.resolveKey(storageKey), range);
  }

  /** Reads the first bytes of a stored or temp file (used for magic-number checks). */
  async readHead(path: string, length = 16): Promise<Buffer> {
    const handle = await open(path, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  async removeTemp(tempPath: string): Promise<void> {
    await unlink(tempPath).catch(() => undefined);
  }

  async remove(storageKey: string): Promise<void> {
    await unlink(this.resolveKey(storageKey)).catch(() => undefined);
  }

  /** Keys come from the database, but a path that escapes the root is refused anyway. */
  private resolveKey(storageKey: string): string {
    const target = resolve(this.root, storageKey);
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new Error('Invalid storage key');
    }
    return target;
  }
}
