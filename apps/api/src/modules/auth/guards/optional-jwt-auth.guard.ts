import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { JWT_ACCESS_STRATEGY } from '../strategies/jwt-access.strategy.js';

/**
 * Lets everyone through. A valid access token fills `request.user`; a missing, expired or forged
 * one just leaves it `null`, so the route can serve a guest and a signed-in user from one handler.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(JWT_ACCESS_STRATEGY) {
  override handleRequest<TUser>(_error: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
