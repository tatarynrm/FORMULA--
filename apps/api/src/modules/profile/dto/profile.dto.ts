import {
  AUTH,
  INSTITUTION_KINDS,
  type InstitutionKind,
  MESSENGERS,
  type Messenger,
  PROFILE,
  TELEGRAM_USERNAME_PATTERN,
  UA_PHONE_EXAMPLE,
  UA_PHONE_PATTERN,
} from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { toCanonicalPhone, toTelegramUsername } from '../../../common/utils/phone-transform.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** One messenger of the profile. The nickname only exists for Telegram (the service checks it). */
export class ProfileMessengerDto {
  @ApiProperty({ enum: MESSENGERS })
  @IsIn(MESSENGERS)
  kind!: Messenger;

  @ApiPropertyOptional({ nullable: true, description: 'Telegram nickname, with or without @' })
  @IsOptional()
  @Transform(toTelegramUsername)
  @ValidateIf((_, value) => value !== null)
  @Matches(TELEGRAM_USERNAME_PATTERN, {
    message: 'username must be a Telegram nickname: 5-32 letters, digits or underscores',
  })
  username?: string | null;
}

/**
 * Every field is optional and may be `null` to clear it. `ValidateIf` skips the checks for `null`
 * while `undefined` (field not sent) is skipped by `IsOptional`.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: AUTH.NAME_MIN_LENGTH, maxLength: AUTH.NAME_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.NAME_MIN_LENGTH)
  @MaxLength(AUTH.NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ minLength: AUTH.SURNAME_MIN_LENGTH, maxLength: AUTH.SURNAME_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.SURNAME_MIN_LENGTH)
  @MaxLength(AUTH.SURNAME_MAX_LENGTH)
  surname?: string;

  @ApiPropertyOptional({ nullable: true, example: 'student' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(32)
  statusCode?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'krok' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(32)
  goalCode?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'A file uploaded with POST /uploads?purpose=avatar by this user. null removes the avatar.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  avatarFileId?: string | null;

  @ApiPropertyOptional({ nullable: true, enum: INSTITUTION_KINDS })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(INSTITUTION_KINDS)
  institutionKind?: InstitutionKind | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trim)
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE.INSTITUTION_MAX_LENGTH)
  institutionName?: string | null;

  @ApiPropertyOptional({ description: 'Marks onboarding as finished (also used by "skip")' })
  @IsOptional()
  @IsBoolean()
  completeOnboarding?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    example: UA_PHONE_EXAMPLE,
    description: `A Ukrainian number written as ${UA_PHONE_EXAMPLE} (other writings of it are converted). null or an empty string removes it.`,
  })
  @IsOptional()
  @Transform(toCanonicalPhone)
  @Matches(UA_PHONE_PATTERN, { message: `phone must look like ${UA_PHONE_EXAMPLE}` })
  phone?: string | null;

  @ApiPropertyOptional({
    type: [ProfileMessengerDto],
    description:
      'The messengers the person uses. The whole list at once: missing ones are removed.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MESSENGERS.length)
  @ValidateNested({ each: true })
  @Type(() => ProfileMessengerDto)
  messengers?: ProfileMessengerDto[];
}
