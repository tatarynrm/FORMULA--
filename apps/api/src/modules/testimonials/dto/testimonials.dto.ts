import {
  AUTH,
  TESTIMONIAL_STATUSES,
  TESTIMONIALS,
  type TestimonialStatus,
  UA_PHONE_EXAMPLE,
  UA_PHONE_PATTERN,
} from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { toCanonicalPhone } from '../../../common/utils/phone-transform.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lowerTrim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const PHONE_FORMAT_MESSAGE = `phone must look like ${UA_PHONE_EXAMPLE}`;

export class SubmitTestimonialDto {
  @ApiPropertyOptional({
    description: 'Required for a guest. A signed-in author gets the name of the account.',
    minLength: AUTH.NAME_MIN_LENGTH,
    maxLength: AUTH.NAME_MAX_LENGTH,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.NAME_MIN_LENGTH)
  @MaxLength(AUTH.NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description: 'Required for a guest. A signed-in author gets the surname of the account.',
    minLength: AUTH.SURNAME_MIN_LENGTH,
    maxLength: AUTH.SURNAME_MAX_LENGTH,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.SURNAME_MIN_LENGTH)
  @MaxLength(AUTH.SURNAME_MAX_LENGTH)
  surname?: string;

  @ApiPropertyOptional({
    description: 'Required for a guest. A signed-in author gets the email of the account.',
    maxLength: 254,
  })
  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    description: `Optional, a Ukrainian number written as ${UA_PHONE_EXAMPLE} (other writings of the same number are accepted and converted).`,
    example: UA_PHONE_EXAMPLE,
    nullable: true,
  })
  @IsOptional()
  @Transform(toCanonicalPhone)
  @Matches(UA_PHONE_PATTERN, { message: PHONE_FORMAT_MESSAGE })
  phone?: string | null;

  @ApiProperty({ minLength: TESTIMONIALS.TEXT_MIN_LENGTH, maxLength: TESTIMONIALS.TEXT_MAX_LENGTH })
  @Transform(trim)
  @IsString()
  @MinLength(TESTIMONIALS.TEXT_MIN_LENGTH)
  @MaxLength(TESTIMONIALS.TEXT_MAX_LENGTH)
  text!: string;

  @ApiProperty({ minimum: TESTIMONIALS.RATING_MIN, maximum: TESTIMONIALS.RATING_MAX })
  @IsInt()
  @Min(TESTIMONIALS.RATING_MIN)
  @Max(TESTIMONIALS.RATING_MAX)
  rating!: number;

  @ApiPropertyOptional({ description: 'Hidden bot trap: real people leave it empty' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class UpdateTestimonialDto {
  @ApiPropertyOptional({ maxLength: AUTH.NAME_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.NAME_MIN_LENGTH)
  @MaxLength(AUTH.NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ maxLength: AUTH.SURNAME_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.SURNAME_MIN_LENGTH)
  @MaxLength(AUTH.SURNAME_MAX_LENGTH)
  surname?: string;

  @ApiPropertyOptional({ maxLength: 254 })
  @IsOptional()
  @Transform(lowerTrim)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    description: 'Written as +380 98 938 55 85; `null` or an empty string removes the phone.',
    example: UA_PHONE_EXAMPLE,
    nullable: true,
  })
  @IsOptional()
  @Transform(toCanonicalPhone)
  @Matches(UA_PHONE_PATTERN, { message: PHONE_FORMAT_MESSAGE })
  phone?: string | null;

  @ApiPropertyOptional({ maxLength: TESTIMONIALS.TEXT_MAX_LENGTH })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(TESTIMONIALS.TEXT_MIN_LENGTH)
  @MaxLength(TESTIMONIALS.TEXT_MAX_LENGTH)
  text?: string;

  @ApiPropertyOptional({ minimum: TESTIMONIALS.RATING_MIN, maximum: TESTIMONIALS.RATING_MAX })
  @IsOptional()
  @IsInt()
  @Min(TESTIMONIALS.RATING_MIN)
  @Max(TESTIMONIALS.RATING_MAX)
  rating?: number;

  @ApiPropertyOptional({ enum: TESTIMONIAL_STATUSES })
  @IsOptional()
  @IsIn(TESTIMONIAL_STATUSES)
  status?: TestimonialStatus;
}

export class TestimonialsAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TESTIMONIAL_STATUSES, default: 'pending' })
  @IsOptional()
  @IsIn(TESTIMONIAL_STATUSES)
  status: TestimonialStatus = 'pending';
}

export class PublicTestimonialsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: TESTIMONIALS.PUBLIC_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TESTIMONIALS.PUBLIC_LIMIT)
  limit: number = TESTIMONIALS.PUBLIC_LIMIT;
}
