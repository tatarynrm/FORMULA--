import { NOTIFICATIONS } from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : trim({ value });

export class NotificationsListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only the unread ones' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  unread?: boolean;
}

export class SendBroadcastDto {
  @ApiProperty({ maxLength: NOTIFICATIONS.TITLE_MAX_LENGTH })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(NOTIFICATIONS.TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({ maxLength: NOTIFICATIONS.BODY_MAX_LENGTH, description: 'Plain text' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(NOTIFICATIONS.BODY_MAX_LENGTH)
  body!: string;

  @ApiPropertyOptional({
    maxLength: NOTIFICATIONS.LINK_MAX_LENGTH,
    description: 'A path inside the site the news leads to, e.g. /cabinet/subjects/<id>',
  })
  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(NOTIFICATIONS.LINK_MAX_LENGTH)
  @Matches(/^\/[^\s]*$/, { message: 'link must be a path inside the site, starting with /' })
  link?: string | null;
}
