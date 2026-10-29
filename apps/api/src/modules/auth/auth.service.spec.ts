import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { Env } from '../../config/env.js';
import type { AccessService } from '../access/access.service.js';
import type { MailService } from '../mail/mail.service.js';
import type { PresenceService } from '../presence/presence.service.js';
import type { UserRecord } from '../users/user.types.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import type { RefreshTokenRecord, RefreshTokensRepository } from './refresh-tokens.repository.js';

class FakeUsers {
  readonly rows: UserRecord[] = [];

  async findByEmail(email: string) {
    return this.rows.find((user) => user.email === email) ?? null;
  }

  async findById(id: string) {
    return this.rows.find((user) => user.id === id) ?? null;
  }

  async create(input: {
    email: string;
    name: string;
    surname: string;
    passwordHash: string | null;
    googleId?: string;
  }) {
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      surname: input.surname,
      passwordHash: input.passwordHash,
      googleId: input.googleId ?? null,
      onboardingCompleted: false,
      avatarFileId: null,
      lastLoginAt: null,
      createdAt: new Date(),
    };
    this.rows.push(user);
    return user;
  }

  async markLoggedIn() {}

  async findByGoogleId(googleId: string) {
    return this.rows.find((user) => user.googleId === googleId) ?? null;
  }

  async linkGoogle(id: string, googleId: string) {
    const user = this.rows.find((candidate) => candidate.id === id);
    if (user) user.googleId = googleId;
  }

  async updatePasswordHash(id: string, passwordHash: string) {
    const user = this.rows.find((candidate) => candidate.id === id);
    if (user) user.passwordHash = passwordHash;
  }
}

/** Stands in for the `admins` table: only ids listed here are admins. */
class FakeAccess {
  readonly superadmins = new Set<string>();

  async getContext(userId: string) {
    return this.superadmins.has(userId)
      ? { role: 'admin' as const, adminLevel: 'superadmin' as const, permissions: [] }
      : { role: 'student' as const, adminLevel: null, permissions: [] };
  }
}

class FakeRefreshTokens {
  readonly rows = new Map<string, RefreshTokenRecord>();

  async create(input: { id: string; userId: string; familyId: string; expiresAt: Date }) {
    this.rows.set(input.id, { ...input, revokedAt: null });
  }

  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }

  async revokeIfActive(id: string) {
    const row = this.rows.get(id);
    if (!row || row.revokedAt || row.expiresAt < new Date()) return false;
    row.revokedAt = new Date();
    return true;
  }

  async revokeFamily(familyId: string) {
    for (const row of this.rows.values()) {
      if (row.familyId === familyId && !row.revokedAt) row.revokedAt = new Date();
    }
  }

  async revokeAllForUser(userId: string) {
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.revokedAt) row.revokedAt = new Date();
    }
  }
}

const settings: Record<string, string> = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
};
const config = { get: (key: string) => settings[key] } as unknown as ConfigService<Env, true>;

function createService() {
  const users = new FakeUsers();
  const refreshTokens = new FakeRefreshTokens();
  const access = new FakeAccess();
  const service = new AuthService(
    users as unknown as UsersService,
    access as unknown as AccessService,
    { leave: async () => undefined, touch: async () => undefined } as unknown as PresenceService,
    new PasswordService(),
    refreshTokens as unknown as RefreshTokensRepository,
    new JwtService(),
    config,
    { sendWelcome: () => undefined } as unknown as MailService,
  );
  return { service, users, refreshTokens, access };
}

const credentials = {
  name: 'Анна',
  surname: 'Коваль',
  email: 'anna@example.com',
  password: 'password-123',
};

describe('AuthService', () => {
  it('registers a user, hashes the password and starts a session', async () => {
    const { service, users, refreshTokens } = createService();

    const result = await service.register(credentials);

    expect(result.user.email).toBe(credentials.email);
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(users.rows[0]?.passwordHash).not.toBe(credentials.password);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(refreshTokens.rows.size).toBe(1);
  });

  it('rejects a duplicate email', async () => {
    const { service } = createService();
    await service.register(credentials);

    await expect(service.register(credentials)).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    const { service } = createService();
    await service.register(credentials);

    const ok = await service.login({ email: credentials.email, password: credentials.password });
    expect(ok.user.name).toBe('Анна');

    await expect(
      service.login({ email: credentials.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: 'nobody@example.com', password: 'whatever-123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token and revokes the family when an old token is replayed', async () => {
    const { service, refreshTokens } = createService();
    const { user } = await service.register(credentials);
    const [firstId] = [...refreshTokens.rows.keys()];
    if (!firstId) throw new Error('expected a refresh token');

    const rotated = await service.refresh(user.id, firstId);
    expect(rotated.user.id).toBe(user.id);
    expect(refreshTokens.rows.get(firstId)?.revokedAt).not.toBeNull();

    // Replaying the already used token is treated as theft: every token of the family is revoked.
    await expect(service.refresh(user.id, firstId)).rejects.toBeInstanceOf(UnauthorizedException);
    expect([...refreshTokens.rows.values()].every((row) => row.revokedAt !== null)).toBe(true);
  });

  it('logout revokes the whole session family', async () => {
    const { service, refreshTokens } = createService();
    await service.register(credentials);
    const [tokenId] = [...refreshTokens.rows.keys()];

    await service.logout(tokenId ?? null);

    expect([...refreshTokens.rows.values()].every((row) => row.revokedAt !== null)).toBe(true);
    await expect(service.logout(null)).resolves.toBeUndefined();
  });

  it('treats a user as a student unless the admins table says otherwise', async () => {
    const { service, access } = createService();
    const { user } = await service.register(credentials);

    expect(user.role).toBe('student');
    expect(user.adminLevel).toBeNull();

    access.superadmins.add(user.id);
    const login = await service.login({ email: credentials.email, password: credentials.password });
    expect(login.user.role).toBe('admin');
    expect(login.user.adminLevel).toBe('superadmin');
    expect((await service.getCurrentUser(user.id)).adminLevel).toBe('superadmin');
  });

  it('changes the password, ends the other sessions and keeps this device signed in', async () => {
    const { service, refreshTokens } = createService();
    const { user } = await service.register(credentials);
    await service.login({ email: credentials.email, password: credentials.password });
    expect(refreshTokens.rows.size).toBe(2);

    await expect(
      service.changePassword(user.id, 'wrong-password', 'new-password-456'),
    ).rejects.toBeInstanceOf(BadRequestException);

    const result = await service.changePassword(user.id, credentials.password, 'new-password-456');
    expect(result.tokens.refreshToken).toBeTruthy();

    // The two earlier sessions are revoked, the new one is active.
    const active = [...refreshTokens.rows.values()].filter((row) => row.revokedAt === null);
    expect(active).toHaveLength(1);

    await expect(
      service.login({ email: credentials.email, password: credentials.password }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: credentials.email, password: 'new-password-456' }),
    ).resolves.toBeTruthy();
  });

  it('signs in with Google: creates an account without a password, then reuses it', async () => {
    const { service, users } = createService();
    const profile = {
      id: 'google-1',
      email: 'anna@example.com',
      emailVerified: true,
      givenName: 'Анна',
      familyName: 'Коваль',
    };

    const first = await service.loginWithGoogle(profile);
    expect(first.isNew).toBe(true);
    expect(first.user.hasPassword).toBe(false);
    expect(users.rows[0]?.googleId).toBe('google-1');

    // No password: the password form must not let anyone in.
    await expect(
      service.login({ email: profile.email, password: 'whatever-123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const second = await service.loginWithGoogle(profile);
    expect(second.isNew).toBe(false);
    expect(users.rows).toHaveLength(1);
  });

  it('links Google to an existing account with the same email and refuses unverified emails', async () => {
    const { service, users } = createService();
    await service.register(credentials);

    const linked = await service.loginWithGoogle({
      id: 'google-2',
      email: credentials.email,
      emailVerified: true,
      givenName: 'Anna',
      familyName: 'K',
    });
    expect(linked.isNew).toBe(false);
    expect(users.rows[0]?.googleId).toBe('google-2');
    expect(linked.user.hasPassword).toBe(true);

    await expect(
      service.loginWithGoogle({
        id: 'google-3',
        email: 'x@example.com',
        emailVerified: false,
        givenName: '',
        familyName: '',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
