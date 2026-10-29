import { CHAT, CHAT_STATUSES, type ChatStatus } from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SendChatMessageDto {
  @ApiPropertyOptional({ maxLength: CHAT.MESSAGE_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(CHAT.MESSAGE_MAX_LENGTH)
  body?: string;

  @ApiPropertyOptional({ description: 'A file uploaded with purpose "chat" by the same user' })
  @IsOptional()
  @IsUUID()
  imageFileId?: string | null;
}

export class ChatMessagesQueryDto {
  @ApiPropertyOptional({
    description: 'Id of the oldest message on screen: older ones are returned',
  })
  @IsOptional()
  @IsUUID()
  before?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: CHAT.PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = CHAT.PAGE_SIZE;
}

export class ConversationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CHAT_STATUSES })
  @IsOptional()
  @IsIn(CHAT_STATUSES)
  status?: ChatStatus;

  @ApiPropertyOptional({ description: "Matches the student's name, surname or email" })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class UpdateConversationDto {
  @ApiProperty({ enum: CHAT_STATUSES })
  @IsIn(CHAT_STATUSES)
  status!: ChatStatus;
}
