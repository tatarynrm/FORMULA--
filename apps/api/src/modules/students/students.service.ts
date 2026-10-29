import {
  PRESENCE,
  type StudentAttemptItem,
  type StudentDetail,
  type StudentListItem,
  type StudentPresenceHistory,
} from '@formula/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AttemptsService } from '../attempts/attempts.service.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { FilesService } from '../files/files.service.js';
import { PresenceService } from '../presence/presence.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { UsersService } from '../users/users.service.js';
import type { StudentListQueryDto, UpdateStudentDto } from './dto/students.dto.js';
import { type OnlineFilter, type StudentBase, StudentsRepository } from './students.repository.js';

/** Student management for the admin panel: the list, one student in full, edits and removal. */
@Injectable()
export class StudentsService {
  constructor(
    private readonly repository: StudentsRepository,
    private readonly users: UsersService,
    private readonly presence: PresenceService,
    private readonly progress: ProgressService,
    private readonly catalog: CatalogService,
    private readonly attempts: AttemptsService,
    private readonly files: FilesService,
  ) {}

  async list(query: StudentListQueryDto): Promise<PaginatedResult<StudentListItem>> {
    const online = query.online ? await this.onlineFilter() : null;
    const { items, total } = await this.repository.findPage(
      { page: query.page, limit: query.limit, sort: query.sort, q: query.q || null },
      online,
    );
    const presence = await this.presence.getMany(items.map((item) => item.id));
    return new PaginatedResult(
      items.map((item) => this.withPresence(item, presence.get(item.id))),
      total,
      query.page,
      query.limit,
    );
  }

  async get(id: string): Promise<StudentDetail> {
    const base = await this.requireStudent(id);
    const [history, progress, subjectGrants, subtopicGrants] = await Promise.all([
      this.presence.getHistory(id),
      this.progress.getSummary(id),
      this.catalog.listSubjectGrants(id),
      this.catalog.listGrants(id),
    ]);

    return {
      ...this.withPresence(base, history),
      progress,
      subjectGrants,
      subtopicGrants,
      sessions: history.sessions,
      activeDaysLast30: history.activeDaysLast30,
    };
  }

  async getPresence(id: string): Promise<StudentPresenceHistory> {
    await this.requireStudent(id);
    return this.presence.getHistory(id);
  }

  async listAttempts(id: string, limit: number): Promise<StudentAttemptItem[]> {
    await this.requireStudent(id);
    return this.attempts.listForAdmin(id, Math.min(Math.max(limit, 1), 200));
  }

  async update(id: string, dto: UpdateStudentDto): Promise<StudentDetail> {
    const base = await this.requireStudent(id);
    if (dto.name !== undefined || dto.surname !== undefined) {
      await this.users.updateNames(id, dto.name ?? base.name, dto.surname ?? base.surname);
    }
    return this.get(id);
  }

  /** Removes the account with everything it owns; the avatar file goes once nothing uses it. */
  async remove(id: string): Promise<void> {
    const base = await this.requireStudent(id);
    if (!(await this.repository.delete(id))) throw new NotFoundException('Student not found');
    if (base.avatarFileId) await this.files.deleteIfUnused(base.avatarFileId);
  }

  private async requireStudent(id: string): Promise<StudentBase> {
    const student = await this.repository.findOne(id);
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  private withPresence(
    base: StudentBase,
    presence: { online: boolean; lastSeenAt: string | null } | undefined,
  ): StudentListItem {
    const { lastSeenAt, ...rest } = base;
    return {
      ...rest,
      presence: presence ?? { online: false, lastSeenAt: lastSeenAt?.toISOString() ?? null },
    };
  }

  /** The "online only" filter: the ids Redis holds, or the stored time when Redis is away. */
  private async onlineFilter(): Promise<OnlineFilter> {
    const ids = await this.presence.listOnlineIds();
    if (ids) return { ids };
    return { since: new Date(Date.now() - PRESENCE.ONLINE_WINDOW_SECONDS * 1000) };
  }
}
