import { ERROR_CODES, type StaffMember } from '@formula/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isUniqueViolation } from '../../common/utils/pg-errors.js';
import { PasswordService } from '../auth/password.service.js';
import { MenuService } from '../menu/menu.service.js';
import { UsersService } from '../users/users.service.js';
import type { CreateStaffDto } from './dto/staff.dto.js';
import { StaffRepository } from './staff.repository.js';

@Injectable()
export class StaffService {
  constructor(
    private readonly repository: StaffRepository,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly menu: MenuService,
  ) {}

  list(): Promise<StaffMember[]> {
    return this.repository.findAll();
  }

  /** Promotes an existing account, or creates a new one when the email is unknown. */
  async create(dto: CreateStaffDto, grantedBy: string): Promise<StaffMember> {
    const permissions = await this.validatePermissions(dto.permissions);
    const existing = await this.users.findByEmail(dto.email);

    if (existing) {
      // Being an admin means having a row in `admins`.
      if (await this.repository.findById(existing.id)) {
        throw new ConflictException({
          code: ERROR_CODES.CONFLICT,
          message: 'This user is already an admin',
        });
      }
      return this.requireMember(await this.repository.promote(existing.id, permissions, grantedBy));
    }

    if (!dto.name || !dto.surname || !dto.password) {
      throw new BadRequestException(
        'Name, surname and password are required to create a new account',
      );
    }

    try {
      return this.requireMember(
        await this.repository.createSubadminAccount({
          email: dto.email,
          name: dto.name,
          surname: dto.surname,
          passwordHash: await this.passwords.hash(dto.password),
          sectionKeys: permissions,
          createdBy: grantedBy,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: ERROR_CODES.EMAIL_TAKEN,
          message: 'This email is already registered',
        });
      }
      throw error;
    }
  }

  async updatePermissions(
    id: string,
    requested: string[],
    grantedBy: string,
  ): Promise<StaffMember> {
    const member = await this.repository.findById(id);
    if (!member) throw new NotFoundException('Admin not found');
    if (member.adminLevel === 'superadmin') {
      throw new BadRequestException('Superadmins always have every permission');
    }

    const permissions = await this.validatePermissions(requested);
    return this.requireMember(await this.repository.setPermissions(id, permissions, grantedBy));
  }

  async remove(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new BadRequestException('You cannot remove yourself');
    }
    const member = await this.repository.findById(id);
    if (!member) throw new NotFoundException('Admin not found');
    if (member.adminLevel === 'superadmin') {
      throw new BadRequestException('Superadmins cannot be removed here');
    }
    await this.repository.demote(id);
  }

  /** Only real, grantable sections are accepted, so a typo cannot silently grant nothing. */
  private async validatePermissions(requested: string[]): Promise<string[]> {
    const grantable = new Set(await this.menu.listGrantableKeys());
    const unique = [...new Set(requested)];
    const unknown = unique.filter((key) => !grantable.has(key));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown or non-grantable sections: ${unknown.join(', ')}`);
    }
    return unique;
  }

  private requireMember(member: StaffMember | null): StaffMember {
    if (!member) throw new NotFoundException('Admin not found');
    return member;
  }
}
