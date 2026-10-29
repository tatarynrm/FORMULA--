import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { RefreshPrincipal, RequestUser } from './auth.types.js';

/** The user from the validated access token (`JwtAuthGuard`). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    return context.switchToHttp().getRequest<Request & { user: RequestUser }>().user;
  },
);

/** The principal from the validated refresh token (`JwtRefreshGuard`). */
export const CurrentRefresh = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RefreshPrincipal => {
    return context.switchToHttp().getRequest<Request & { user: RefreshPrincipal }>().user;
  },
);
