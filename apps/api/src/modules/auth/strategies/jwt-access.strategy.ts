import { AUTH_COOKIES, type JwtPayload } from '@formula/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Env } from '../../../config/env.js';
import type { RequestUser } from '../auth.types.js';

export const JWT_ACCESS_STRATEGY = 'jwt-access';

function fromCookie(request: Request): string | null {
  const value: unknown = request.cookies?.[AUTH_COOKIES.ACCESS];
  return typeof value === 'string' ? value : null;
}

/** Reads the access token from the httpOnly cookie, with `Authorization: Bearer` as a fallback for API clients. */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, JWT_ACCESS_STRATEGY) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub };
  }
}
