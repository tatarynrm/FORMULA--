import { randomUUID } from 'node:crypto';

import { type AdminLevel, type AuthUser, ERROR_CODES, type JwtPayload } from '@formula/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { parseDurationMs } from '../../common/utils/duration.js';
import { isUniqueViolation } from '../../common/utils/pg-errors.js';
import type { Env } from '../../config/env.js';
import { AccessService } from '../access/access.service.js';
import { PresenceService } from '../presence/presence.service.js';
import type { UserRecord } from '../users/user.types.js';
import { UsersService, toAuthUser } from '../users/users.service.js';
import type { SessionTokens } from './auth.types.js';
import type { GoogleProfile } from './google-auth.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { PasswordService } from './password.service.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';

export interface AuthResult {
  user: AuthUser;
  tokens: SessionTokens;
}

@Injectable()
export class AuthService {
  private readonly accessTtlMs: number;
  private readonly refreshTtlMs: number;

  constructor(
    private readonly users: UsersService,
    private readonly access: AccessService,
    private readonly presence: PresenceService,
    private readonly passwords: PasswordService,
    private readonly refreshTokens: RefreshTokensRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.accessTtlMs = parseDurationMs(this.config.get('JWT_ACCESS_TTL', { infer: true }));
    this.refreshTtlMs = parseDurationMs(this.config.get('JWT_REFRESH_TTL', { infer: true }));
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email;

    if (await this.users.findByEmail(email)) {
      throw this.emailTaken();
    }

    const passwordHash = await this.passwords.hash(dto.password);

    let user: UserRecord;
    try {
      user = await this.users.create({ email, name: dto.name, surname: dto.surname, passwordHash });
    } catch (error) {
      // Two simultaneous sign-ups with the same email: the unique index decides.
      if (isUniqueViolation(error)) throw this.emailTaken();
      throw error;
    }

    await this.presence.touch(user.id);
    return this.startSession(user, randomUUID());
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);

    // Always run one scrypt verification, so unknown emails (and Google-only accounts without a
    // password) cost as much time as wrong passwords.
    const hash = user?.passwordHash ?? (await this.passwords.getDummyHash());
    const passwordMatches = await this.passwords.verify(dto.password, hash);

    if (!user || !user.passwordHash || !passwordMatches) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    await this.users.markLoggedIn(user.id);
    await this.presence.touch(user.id);
    return this.startSession(user, randomUUID());
  }

  /**
   * Signs in with a Google account: the account tied to this Google id; else the account with the
   * same verified email, which gets tied to it; else a new account without a password.
   */
  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResult & { isNew: boolean }> {
    if (!profile.emailVerified) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'The Google account email is not verified',
      });
    }

    let user = await this.users.findByGoogleId(profile.id);
    let isNew = false;

    if (!user) {
      const sameEmail = await this.users.findByEmail(profile.email);
      if (sameEmail) {
        await this.users.linkGoogle(sameEmail.id, profile.id);
        user = sameEmail;
      } else {
        user = await this.users.create({
          email: profile.email,
          // Google may send no name; the email's local part is better than an empty field.
          name: profile.givenName.trim() || profile.email.split('@')[0] || 'Student',
          surname: profile.familyName.trim(),
          passwordHash: null,
          googleId: profile.id,
        });
        isNew = true;
      }
    }

    await this.users.markLoggedIn(user.id);
    await this.presence.touch(user.id);
    return { ...(await this.startSession(user, randomUUID())), isNew };
  }

  /**
   * Rotates a refresh token: the presented one is revoked and a new pair is issued in the same
   * family. A token that was already revoked means replay or theft, so the whole family dies.
   */
  async refresh(userId: string, tokenId: string): Promise<AuthResult> {
    const token = await this.refreshTokens.findById(tokenId);

    if (!token || token.userId !== userId) {
      throw this.sessionExpired();
    }

    if (token.revokedAt) {
      await this.refreshTokens.revokeFamily(token.familyId);
      throw this.sessionExpired();
    }

    const claimed = await this.refreshTokens.revokeIfActive(tokenId);
    if (!claimed) {
      await this.refreshTokens.revokeFamily(token.familyId);
      throw this.sessionExpired();
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw this.sessionExpired();
    }

    return this.startSession(user, token.familyId);
  }

  /** Ends the session of the given refresh token. Unknown tokens are ignored on purpose. */
  async logout(tokenId: string | null): Promise<void> {
    if (!tokenId) return;

    const token = await this.refreshTokens.findById(tokenId);
    if (token) {
      await this.refreshTokens.revokeFamily(token.familyId);
      await this.presence.leave(token.userId);
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw this.sessionExpired();
    }
    return toAuthUser(user, await this.getAdminLevel(user.id));
  }

  /**
   * Changes the password after checking the current one, ends every session (so a stolen session
   * dies too) and signs the current device in again.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw this.sessionExpired();
    }

    // A Google account without a password sets its first one without a current password.
    if (user.passwordHash && !(await this.passwords.verify(currentPassword, user.passwordHash))) {
      // 400, not 401: the web client treats 401 as "session expired" and would refresh and retry.
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'The current password is wrong',
      });
    }

    await this.users.updatePasswordHash(userId, await this.passwords.hash(newPassword));
    await this.refreshTokens.revokeAllForUser(userId);
    return this.startSession(user, randomUUID());
  }

  private async startSession(user: UserRecord, familyId: string): Promise<AuthResult> {
    const tokenId = randomUUID();

    await this.refreshTokens.create({
      id: tokenId,
      userId: user.id,
      familyId,
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
    });

    // The role claim is a hint for the web proxy only; every protected api route reads the rights from the database.
    const adminLevel = await this.getAdminLevel(user.id);
    const accessPayload: JwtPayload & { role: string } = {
      sub: user.id,
      type: 'access',
      role: adminLevel ? 'admin' : 'student',
    };
    const refreshPayload: JwtPayload = { sub: user.id, type: 'refresh', jti: tokenId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: Math.floor(this.accessTtlMs / 1000),
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: Math.floor(this.refreshTtlMs / 1000),
      }),
    ]);

    return {
      user: toAuthUser(user, adminLevel),
      tokens: {
        accessToken,
        refreshToken,
        accessExpiresInMs: this.accessTtlMs,
        refreshExpiresInMs: this.refreshTtlMs,
      },
    };
  }

  /** `null` for students: only a row in `admins` makes someone an admin. */
  private async getAdminLevel(userId: string): Promise<AdminLevel | null> {
    return (await this.access.getContext(userId))?.adminLevel ?? null;
  }

  private emailTaken(): ConflictException {
    return new ConflictException({
      code: ERROR_CODES.EMAIL_TAKEN,
      message: 'This email is already registered',
    });
  }

  private sessionExpired(): UnauthorizedException {
    return new UnauthorizedException({
      code: ERROR_CODES.SESSION_EXPIRED,
      message: 'Session expired, please sign in again',
    });
  }
}
