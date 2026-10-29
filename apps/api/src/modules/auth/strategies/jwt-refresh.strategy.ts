import { AUTH_COOKIES, type JwtPayload } from '@formula/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Env } from '../../../config/env.js';
import type { RefreshPrincipal } from '../auth.types.js';

export const JWT_REFRESH_STRATEGY = 'jwt-refresh';

function fromCookie(request: Request): string | null {
  const value: unknown = request.cookies?.[AUTH_COOKIES.REFRESH];
  return typeof value === 'string' ? value : null;
}

/** The refresh token is only ever accepted from its httpOnly cookie. */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, JWT_REFRESH_STRATEGY) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_REFRESH_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): RefreshPrincipal {
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, tokenId: payload.jti };
  }
}
