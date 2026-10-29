import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { RequestUser } from '../auth/auth.types.js';
import { AccessService } from './access.service.js';

export const SECTION_KEY = 'adminSection';
export const SUPERADMIN_KEY = 'superadminOnly';

/** Runs after `JwtAuthGuard`. Checks the database, not the token, so revoked rights stop working immediately. */
@Injectable()
export class SectionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const section = this.reflector.getAllAndOverride<string | undefined>(SECTION_KEY, targets);
    const superadminOnly = this.reflector.getAllAndOverride<boolean | undefined>(
      SUPERADMIN_KEY,
      targets,
    );

    const { user } = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    if (!user) throw new ForbiddenException();

    const admin = await this.access.getContext(user.userId);

    const allowed = superadminOnly
      ? this.access.isSuperadmin(admin)
      : section
        ? this.access.canUseSection(admin, section)
        : false;

    if (!allowed) throw new ForbiddenException();
    return true;
  }
}
