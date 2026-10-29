import { AUTH } from '@formula/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const STUDENT_SORTS = ['newest', 'name', 'lastSeen'] as const;

export class StudentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Matches name, surname or email' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Only students online right now' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  online?: boolean;

  @ApiPropertyOptional({ enum: STUDENT_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(STUDENT_SORTS)
  sort: (typeof STUDENT_SORTS)[number] = 'newest';
}

export class StudentAttemptsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  limit: number = 50;
}

export class UpdateStudentDto {
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
}
