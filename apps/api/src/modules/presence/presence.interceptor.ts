import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

import { PresenceService } from './presence.service.js';

/**
 * Marks the signed-in user as active on every request that passed a token guard (guards run
 * before interceptors, so `request.user` is set by then). Sign-out is left alone: it records
 * the leave itself, and a touch racing with it would make the user look online after leaving.
 */
@Injectable()
export class PresenceInterceptor implements NestInterceptor {
  constructor(private readonly presence: PresenceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: { userId?: string } }>();
    const userId = request.user?.userId;

    if (userId && !request.path.endsWith('/auth/logout')) {
      // Not awaited: the response must not wait for Redis or the database.
      void this.presence.touch(userId);
    }
    return next.handle();
  }
}
