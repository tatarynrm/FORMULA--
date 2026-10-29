import type { AdminLevel, AuthUser } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import type { CreateUserInput, UserRecord } from './user.types.js';
import { UsersRepository } from './users.repository.js';

/**
 * Maps the internal record to the public shape (no password hash). A user row says nothing about
 * admin rights, so the caller passes the level it got from the access module (`null` = student).
 */
export function toAuthUser(user: UserRecord, adminLevel: AdminLevel | null): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    role: adminLevel ? 'admin' : 'student',
    adminLevel,
    onboardingCompleted: user.onboardingCompleted,
    avatarFileId: user.avatarFileId,
    hasPassword: user.passwordHash !== null,
    createdAt: user.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.repository.findByEmail(email);
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.repository.findById(id);
  }

  create(input: CreateUserInput): Promise<UserRecord> {
    return this.repository.create(input);
  }

  findByGoogleId(googleId: string): Promise<UserRecord | null> {
    return this.repository.findByGoogleId(googleId);
  }

  linkGoogle(id: string, googleId: string): Promise<void> {
    return this.repository.linkGoogle(id, googleId);
  }

  markLoggedIn(id: string): Promise<void> {
    return this.repository.touchLastLogin(id);
  }

  updateNames(id: string, name: string, surname: string): Promise<void> {
    return this.repository.updateNames(id, name, surname);
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    return this.repository.updatePasswordHash(id, passwordHash);
  }
}
