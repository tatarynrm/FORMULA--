import { ADMIN_LEVELS, USER_ROLES } from '@formula/shared';
import { ApiProperty } from '@nestjs/swagger';

/** Swagger description of `AuthUser` from `@formula/shared`. */
export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  surname!: string;

  @ApiProperty({
    enum: USER_ROLES,
    description: 'admin exactly when the user has a row in the admins table',
  })
  role!: (typeof USER_ROLES)[number];

  @ApiProperty({ enum: ADMIN_LEVELS, nullable: true })
  adminLevel!: (typeof ADMIN_LEVELS)[number] | null;

  @ApiProperty()
  onboardingCompleted!: boolean;

  @ApiProperty({ format: 'uuid', nullable: true, description: 'Open at /api/v1/files/:id' })
  avatarFileId!: string | null;

  @ApiProperty({ description: 'False for a Google account that has not set a password yet' })
  hasPassword!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class AuthSessionDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
