import type { FilePurpose } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

export interface FileRecord {
  id: string;
  ownerId: string | null;
  purpose: FilePurpose;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}

interface FileRow {
  id: string;
  owner_id: string | null;
  purpose: FilePurpose;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  storage_key: string;
}

function toRecord(row: FileRow): FileRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    purpose: row.purpose,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storageKey: row.storage_key,
  };
}

@Injectable()
export class FilesRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(input: Omit<FileRecord, 'id'> & { id: string }): Promise<FileRecord> {
    const row = await this.database.queryOne<FileRow>(
      `INSERT INTO files (id, owner_id, purpose, original_name, mime_type, size_bytes, storage_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.id,
        input.ownerId,
        input.purpose,
        input.originalName,
        input.mimeType,
        input.sizeBytes,
        input.storageKey,
      ],
    );
    if (!row) throw new Error('INSERT INTO files returned no row');
    return toRecord(row);
  }

  async findById(id: string): Promise<FileRecord | null> {
    const row = await this.database.queryOne<FileRow>('SELECT * FROM files WHERE id = $1', [id]);
    return row ? toRecord(row) : null;
  }

  /** True when `fileId` is an avatar uploaded by `ownerId` (so nobody can borrow someone else's file). */
  async isAvatarOwnedBy(fileId: string, ownerId: string): Promise<boolean> {
    const row = await this.database.queryOne<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM files WHERE id = $1 AND owner_id = $2 AND purpose = 'avatar') AS ok`,
      [fileId, ownerId],
    );
    return row?.ok ?? false;
  }

  /**
   * Deletes the avatars this user uploaded but never used (an upload that was not saved to the
   * profile), so abandoned pictures cannot pile up. Returns the storage keys of the removed files.
   */
  async deleteUnusedAvatars(ownerId: string, exceptFileId: string): Promise<string[]> {
    const rows = await this.database.query<{ storage_key: string }>(
      `DELETE FROM files f
       WHERE f.owner_id = $1 AND f.purpose = 'avatar' AND f.id <> $2
         AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.avatar_file_id = f.id)
       RETURNING f.storage_key`,
      [ownerId, exceptFileId],
    );
    return rows.map((row) => row.storage_key);
  }

  /**
   * Deletes a file that nothing refers to any more (not a material, a question or option image, an
   * avatar, nor mentioned in a rich text) and returns its storage key. Returns `null` when the file is
   * still in use or does not exist.
   */
  async deleteIfUnused(fileId: string): Promise<string | null> {
    const row = await this.database.queryOne<{ storage_key: string }>(
      `DELETE FROM files f
       WHERE f.id = $1
         AND NOT EXISTS (SELECT 1 FROM materials m WHERE m.file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.image_file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM question_options o WHERE o.image_file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.avatar_file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.image_file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM subtopics s WHERE position(f.id::text in s.description_html) > 0)
         AND NOT EXISTS (SELECT 1 FROM menu_pages mp WHERE position(f.id::text in mp.body_html) > 0)
       RETURNING f.storage_key`,
      [fileId],
    );
    return row?.storage_key ?? null;
  }

  /** A chat picture uploaded by `ownerId` that no message uses yet. */
  async isUnusedChatImageOf(fileId: string, ownerId: string): Promise<boolean> {
    const row = await this.database.queryOne<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM files f
         WHERE f.id = $1 AND f.owner_id = $2 AND f.purpose = 'chat'
           AND NOT EXISTS (SELECT 1 FROM chat_messages m WHERE m.image_file_id = f.id)
       ) AS ok`,
      [fileId, ownerId],
    );
    return row?.ok ?? false;
  }

  /** Whether the picture was sent in the conversation of this student. */
  async chatImageInConversationOf(fileId: string, studentId: string): Promise<boolean> {
    const row = await this.database.queryOne<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM chat_messages m
         JOIN chat_conversations c ON c.id = m.conversation_id
         WHERE m.image_file_id = $1 AND c.student_id = $2
       ) AS ok`,
      [fileId, studentId],
    );
    return row?.ok ?? false;
  }

  /** Deletes an avatar record of this owner and returns its storage key (for removing the bytes). */
  async deleteOwnedAvatar(fileId: string, ownerId: string): Promise<string | null> {
    const row = await this.database.queryOne<{ storage_key: string }>(
      `DELETE FROM files WHERE id = $1 AND owner_id = $2 AND purpose = 'avatar' RETURNING storage_key`,
      [fileId, ownerId],
    );
    return row?.storage_key ?? null;
  }

  /**
   * Can this student open the video or document? Only through a published subtopic that is free
   * or that the student was granted (and the grant has not expired).
   */
  async studentCanReadMaterial(fileId: string, userId: string): Promise<boolean> {
    const row = await this.database.queryOne<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM materials m
         JOIN subtopics s ON s.id = m.subtopic_id AND s.status = 'published'
         JOIN topics t ON t.id = s.topic_id AND t.status = 'published'
         JOIN subjects sj ON sj.id = t.subject_id AND sj.status = 'published'
         WHERE m.file_id = $1
           AND (
             has_subtopic_access($2, s.id)
           )
       ) AS ok`,
      [fileId, userId],
    );
    return row?.ok ?? false;
  }
}
