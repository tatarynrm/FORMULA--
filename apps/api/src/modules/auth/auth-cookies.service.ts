import { AUTH_COOKIES } from '@formula/shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

import type { Env } from '../../config/env.js';
import type { SessionTokens } from './auth.types.js';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthState {
  /** Random value that must come back from Google unchanged. */
  state: string;
  /** Path inside the web app to open after the sign-in. */
  next: string;
}

/**
 * Writes the session into httpOnly cookies, so browser JavaScript (and XSS) can never read a token.
 * `SameSite=Lax` plus the CORS allow-list protects the JSON endpoints from cross-site requests.
 */
@Injectable()
export class AuthCookiesService {
  private readonly baseOptions: CookieOptions;

  constructor(config: ConfigService<Env, true>) {
    this.baseOptions = {
      httpOnly: true,
      secure: config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: '/',
      domain: config.get('COOKIE_DOMAIN', { infer: true }) || undefined,
    };
  }

  set(response: Response, tokens: SessionTokens): void {
    response.cookie(AUTH_COOKIES.ACCESS, tokens.accessToken, {
      ...this.baseOptions,
      maxAge: tokens.accessExpiresInMs,
    });
    response.cookie(AUTH_COOKIES.REFRESH, tokens.refreshToken, {
      ...this.baseOptions,
      maxAge: tokens.refreshExpiresInMs,
    });
  }

  /** Remembers the Google sign-in in flight (state + where to go afterwards) for a few minutes. */
  setOAuthState(response: Response, state: OAuthState): void {
    response.cookie(OAUTH_STATE_COOKIE, JSON.stringify(state), {
      ...this.baseOptions,
      maxAge: OAUTH_STATE_TTL_MS,
    });
  }

  readOAuthState(request: Request): OAuthState | null {
    const raw: unknown = request.cookies?.[OAUTH_STATE_COOKIE];
    if (typeof raw !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as OAuthState).state === 'string' &&
        typeof (parsed as OAuthState).next === 'string'
      ) {
        return parsed as OAuthState;
      }
    } catch {
      // A damaged cookie is the same as none.
    }
    return null;
  }

  clearOAuthState(response: Response): void {
    response.clearCookie(OAUTH_STATE_COOKIE, this.baseOptions);
  }

  clear(response: Response): void {
    response.clearCookie(AUTH_COOKIES.ACCESS, this.baseOptions);
    response.clearCookie(AUTH_COOKIES.REFRESH, this.baseOptions);
  }
}
