import { AUTH_COOKIES } from '@formula/shared';
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SectionGuard, SECTION_KEY, SUPERADMIN_KEY } from './section.guard.js';

/** Admin route that needs the given section (superadmins always pass). Replaces `@Roles('admin')`. */
export const AdminSection = (sectionKey: string) =>
  applyDecorators(
    SetMetadata(SECTION_KEY, sectionKey),
    UseGuards(JwtAuthGuard, SectionGuard),
    ApiCookieAuth(AUTH_COOKIES.ACCESS),
  );

/** Admin route for superadmins only (team and menu management). */
export const SuperadminOnly = () =>
  applyDecorators(
    SetMetadata(SUPERADMIN_KEY, true),
    UseGuards(JwtAuthGuard, SectionGuard),
    ApiCookieAuth(AUTH_COOKIES.ACCESS),
  );
