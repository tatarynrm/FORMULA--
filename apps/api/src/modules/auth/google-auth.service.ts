import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';

/** What Google tells us about the person after they agreed to sign in. */
export interface GoogleProfile {
  /** Stable Google account id (`sub`). */
  id: string;
  email: string;
  emailVerified: boolean;
  givenName: string;
  familyName: string;
}

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * The OAuth 2.0 "authorization code" flow with Google, done with plain `fetch`: build the consent
 * url, swap the returned code for tokens, read the profile. The callback url is the api itself
 * (`<API_PUBLIC_URL>/api/v1/auth/google/callback`), which must be registered in Google Cloud.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  readonly callbackUrl: string;

  constructor(config: ConfigService<Env, true>) {
    this.clientId = config.get('GOOGLE_CLIENT_ID', { infer: true });
    this.clientSecret = config.get('GOOGLE_CLIENT_SECRET', { infer: true });
    this.callbackUrl = `${config.get('API_PUBLIC_URL', { infer: true })}/api/v1/auth/google/callback`;

    if (this.enabled) this.logger.log(`Google sign-in: callback ${this.callbackUrl}`);
    else this.logger.warn('Google sign-in is off (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)');
  }

  get enabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** Where to send the browser. `state` comes back untouched and guards against forged callbacks. */
  authorizationUrl(state: string): string {
    if (!this.clientId) throw this.unavailable();

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  /** Turns the code from the callback into the person's profile. Throws on any Google-side failure. */
  async fetchProfile(code: string): Promise<GoogleProfile> {
    if (!this.clientId || !this.clientSecret) throw this.unavailable();

    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed (${tokenResponse.status})`);
    }
    const tokens = (await tokenResponse.json()) as { access_token?: unknown };
    if (typeof tokens.access_token !== 'string') {
      throw new Error('Google token exchange returned no access token');
    }

    const profileResponse = await fetch(USERINFO_URL, {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileResponse.ok) {
      throw new Error(`Google userinfo failed (${profileResponse.status})`);
    }
    const raw = (await profileResponse.json()) as Record<string, unknown>;

    const id = raw['sub'];
    const email = raw['email'];
    if (typeof id !== 'string' || typeof email !== 'string') {
      throw new Error('Google userinfo is missing the account id or the email');
    }
    return {
      id,
      email: email.trim().toLowerCase(),
      emailVerified: raw['email_verified'] === true,
      givenName: typeof raw['given_name'] === 'string' ? raw['given_name'] : '',
      familyName: typeof raw['family_name'] === 'string' ? raw['family_name'] : '',
    };
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException('Google sign-in is not configured');
  }
}
