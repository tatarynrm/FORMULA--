import { createHash, randomUUID } from 'node:crypto';

import {
  type AdminTestimonial,
  ERROR_CODES,
  type MyTestimonial,
  type PublicTestimonial,
  TESTIMONIALS,
  type TestimonialCounts,
  type TestimonialStatus,
  type SubmitTestimonialResult,
} from '@formula/shared';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaginatedResult } from '../../common/paginated-result.js';
import type { Env } from '../../config/env.js';
import { type FileRecord, FilesService } from '../files/files.service.js';
import { NOTIFICATION_TEXTS, previewOf } from '../notifications/notification-texts.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { UsersService } from '../users/users.service.js';
import type {
  SubmitTestimonialDto,
  TestimonialsAdminQueryDto,
  UpdateTestimonialDto,
} from './dto/testimonials.dto.js';
import { TestimonialsRepository } from './testimonials.repository.js';

/** Admins with this section moderate the testimonials. */
const SECTION = 'testimonials';

/** Many spaces and line breaks in a row would only make a testimonial ugly. */
function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Testimonials for the landing page. Anyone may write one (a guest types a name, a signed-in
 * author gets the name of the account); it stays hidden until an admin publishes it.
 */
@Injectable()
export class TestimonialsService {
  constructor(
    private readonly repository: TestimonialsRepository,
    private readonly users: UsersService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ---- Public ----

  listPublic(limit: number): Promise<PublicTestimonial[]> {
    return this.repository.listPublic(limit);
  }

  listMine(userId: string): Promise<MyTestimonial[]> {
    return this.repository.listMine(userId);
  }

  async submit(
    userId: string | null,
    dto: SubmitTestimonialDto,
    ip: string | undefined,
  ): Promise<SubmitTestimonialResult> {
    // A bot filled the hidden field: pretend it worked, store nothing.
    if (dto.website && dto.website.trim() !== '') {
      return { id: randomUUID(), status: 'pending' };
    }

    let name: string;
    let surname: string;
    let email: string;
    let ipHash: string | null = null;

    if (userId) {
      const user = await this.users.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      // The name always comes from the account; anything the client sent is ignored.
      name = user.name;
      surname = user.surname;
      email = user.email;
      if ((await this.repository.countPendingOfUser(userId)) > 0) {
        throw new ConflictException({
          code: ERROR_CODES.CONFLICT,
          message: 'You already have a testimonial waiting for moderation',
        });
      }
    } else {
      if (!dto.name || !dto.surname || !dto.email) {
        throw new BadRequestException({
          code: ERROR_CODES.VALIDATION_FAILED,
          message: 'A guest must give a name, a surname and an email',
        });
      }
      name = tidy(dto.name);
      surname = tidy(dto.surname);
      email = dto.email;
      ipHash = this.hashIp(ip);
      if ((await this.repository.countRecentFromIp(ipHash)) >= TESTIMONIALS.GUEST_PER_HOUR) {
        throw new HttpException(
          {
            code: ERROR_CODES.TOO_MANY_REQUESTS,
            message: 'Too many testimonials from this address, try again later',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const text = tidy(dto.text);
    const id = await this.repository.insert({
      userId,
      name,
      surname,
      email,
      phone: dto.phone ?? null,
      text,
      rating: dto.rating,
      ipHash,
    });

    await this.notifications.notifySection(SECTION, {
      type: 'testimonial_pending',
      ...NOTIFICATION_TEXTS.testimonialPending(`${name} ${surname}`, previewOf(text, false)),
      link: '/admin/testimonials',
      data: { testimonialId: id },
    });
    // The pending counter in the admin menu follows at once.
    this.realtime.publishToChannel('admins', { type: 'notifications.refresh' });

    return { id, status: 'pending' };
  }

  /** The picture of the author of a published testimonial, or 404 for anything else. */
  async getPublicAvatar(testimonialId: string): Promise<FileRecord> {
    const fileId = await this.repository.findPublicAvatarFileId(testimonialId);
    const file = fileId ? await this.files.findAvatarRecord(fileId) : null;
    if (!file) throw new NotFoundException();
    return file;
  }

  // ---- Moderation ----

  async listForAdmin(query: TestimonialsAdminQueryDto): Promise<PaginatedResult<AdminTestimonial>> {
    const { items, total } = await this.repository.listAdmin({
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    return new PaginatedResult(items, total, query.page, query.limit);
  }

  counts(): Promise<TestimonialCounts> {
    return this.repository.counts();
  }

  /** Edits the wording and/or moves the testimonial between pending, approved and rejected. */
  async update(adminId: string, id: string, dto: UpdateTestimonialDto): Promise<AdminTestimonial> {
    const current = await this.requireAdmin(id);

    const name = dto.name === undefined ? undefined : tidy(dto.name);
    const surname = dto.surname === undefined ? undefined : tidy(dto.surname);
    const text = dto.text === undefined ? undefined : tidy(dto.text);
    const edited =
      (name !== undefined && name !== current.name) ||
      (surname !== undefined && surname !== current.surname) ||
      (text !== undefined && text !== current.text) ||
      (dto.rating !== undefined && dto.rating !== current.rating);
    const statusChanged = dto.status !== undefined && dto.status !== current.status;

    await this.repository.update(id, {
      ...(name !== undefined ? { name } : {}),
      ...(surname !== undefined ? { surname } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(text !== undefined ? { text } : {}),
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      edited,
      moderatorId: adminId,
    });

    if (statusChanged && dto.status) await this.tellAuthor(current, dto.status);
    this.realtime.publishToChannel('admins', { type: 'notifications.refresh' });
    return this.requireAdmin(id);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.remove(id))) throw new NotFoundException('Testimonial not found');
    this.realtime.publishToChannel('admins', { type: 'notifications.refresh' });
  }

  // ---- helpers ----

  /** A registered author hears about the decision in their bell. */
  private async tellAuthor(
    testimonial: AdminTestimonial,
    status: TestimonialStatus,
  ): Promise<void> {
    if (!testimonial.author) return;
    if (status === 'approved') {
      await this.notifications.notify(testimonial.author.id, {
        type: 'testimonial_result',
        ...NOTIFICATION_TEXTS.testimonialApproved,
        link: '/#reviews',
        data: { testimonialId: testimonial.id, status },
      });
    } else if (status === 'rejected') {
      await this.notifications.notify(testimonial.author.id, {
        type: 'testimonial_result',
        ...NOTIFICATION_TEXTS.testimonialRejected,
        link: '/cabinet/feedback',
        data: { testimonialId: testimonial.id, status },
      });
    }
  }

  private async requireAdmin(id: string): Promise<AdminTestimonial> {
    const testimonial = await this.repository.findAdminById(id);
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  /** Salted, so the stored value cannot be turned back into an address. */
  private hashIp(ip: string | undefined): string {
    const salt = this.config.get('JWT_ACCESS_SECRET', { infer: true });
    return createHash('sha256')
      .update(`${salt}:${ip ?? 'unknown'}`)
      .digest('hex');
  }
}
