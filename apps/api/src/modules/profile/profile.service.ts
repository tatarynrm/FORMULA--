import type { Profile, ProfileMessenger, ProfileOptions } from '@formula/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { FilesService } from '../files/files.service.js';
import { UsersService } from '../users/users.service.js';
import type { UpdateProfileDto } from './dto/profile.dto.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly users: UsersService,
    private readonly files: FilesService,
  ) {}

  async getOptions(): Promise<ProfileOptions> {
    const [statuses, goals] = await Promise.all([
      this.repository.listStatuses(),
      this.repository.listGoals(),
    ]);
    return { statuses, goals };
  }

  /** Account data from `users` plus the stored profile. Works the same for students and admins. */
  async get(userId: string): Promise<Profile> {
    const [user, stored] = await Promise.all([
      this.users.findById(userId),
      this.repository.findByUserId(userId),
    ]);
    if (!user) throw new NotFoundException('User not found');

    return { name: user.name, surname: user.surname, email: user.email, ...stored };
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const options = await this.getOptions();
    if (dto.statusCode && !options.statuses.some((option) => option.code === dto.statusCode)) {
      throw new BadRequestException('Unknown status');
    }
    if (dto.goalCode && !options.goals.some((option) => option.code === dto.goalCode)) {
      throw new BadRequestException('Unknown goal');
    }

    const previousAvatar = (await this.repository.findByUserId(userId)).avatarFileId;
    if (dto.avatarFileId && !(await this.files.isOwnAvatar(userId, dto.avatarFileId))) {
      throw new BadRequestException('The avatar must be a file you uploaded with purpose "avatar"');
    }

    if (dto.name !== undefined || dto.surname !== undefined) {
      await this.users.updateNames(userId, dto.name ?? user.name, dto.surname ?? user.surname);
    }

    // Empty text means "not set", not an empty institution name.
    const institutionName = dto.institutionName === '' ? null : dto.institutionName;

    // The messengers go in as one list: no repeats, and a nickname only for Telegram.
    const messengers = dto.messengers ? this.normalizeMessengers(dto.messengers) : null;

    await this.repository.upsert(userId, {
      ...(dto.statusCode !== undefined ? { statusCode: dto.statusCode } : {}),
      ...(dto.goalCode !== undefined ? { goalCode: dto.goalCode } : {}),
      ...(dto.avatarFileId !== undefined ? { avatarFileId: dto.avatarFileId } : {}),
      ...(dto.institutionKind !== undefined ? { institutionKind: dto.institutionKind } : {}),
      ...(institutionName !== undefined ? { institutionName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.completeOnboarding !== undefined
        ? { completeOnboarding: dto.completeOnboarding }
        : {}),
    });
    if (messengers) await this.repository.replaceMessengers(userId, messengers);

    // The old picture is not needed once the avatar was replaced or removed.
    if (dto.avatarFileId !== undefined && previousAvatar && previousAvatar !== dto.avatarFileId) {
      await this.files.deleteOwnAvatar(userId, previousAvatar);
    }

    return this.get(userId);
  }

  /** Fills the phone of a profile that has none (used when a number is verified in a messenger bot). */
  fillPhoneIfEmpty(userId: string, phone: string): Promise<boolean> {
    return this.repository.fillPhoneIfEmpty(userId, phone);
  }

  private normalizeMessengers(
    input: NonNullable<UpdateProfileDto['messengers']>,
  ): ProfileMessenger[] {
    const seen = new Set<string>();
    const result: ProfileMessenger[] = [];
    for (const item of input) {
      if (seen.has(item.kind)) throw new BadRequestException(`Messenger ${item.kind} is repeated`);
      seen.add(item.kind);
      if (item.username && item.kind !== 'telegram') {
        throw new BadRequestException('A nickname is only supported for Telegram');
      }
      result.push({ kind: item.kind, username: item.username ?? null });
    }
    return result;
  }
}
