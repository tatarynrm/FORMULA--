import {
  CONTENT_STATUSES,
  type ContentStatus,
  MATERIAL_KINDS,
  type MaterialKind,
  TESTS,
} from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const TITLE_MAX = TESTS.TITLE_MAX_LENGTH;
/** A rich text description can be long, but not unbounded. */
const HTML_MAX = 200_000;

export class CreateSubjectDto {
  @ApiProperty({ example: 'Біохімія', maxLength: TITLE_MAX })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: CONTENT_STATUSES })
  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: ContentStatus;
}

export class CreateTopicDto {
  @ApiProperty({ example: 'Гормони', maxLength: TITLE_MAX })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title!: string;
}

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title?: string;

  @ApiPropertyOptional({ enum: CONTENT_STATUSES })
  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: ContentStatus;
}

export class CreateSubtopicDto {
  @ApiProperty({ example: 'Стероїдні гормони', maxLength: TITLE_MAX })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title!: string;

  @ApiPropertyOptional({ description: 'Free subtopics are open to every student' })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateSubtopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title?: string;

  @ApiPropertyOptional({ description: 'Rich text from the editor; sanitized before it is stored' })
  @IsOptional()
  @IsString()
  @MaxLength(HTML_MAX)
  descriptionHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ enum: CONTENT_STATUSES })
  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: ContentStatus;
}

export class CreateMaterialDto {
  @ApiProperty({ enum: MATERIAL_KINDS })
  @IsIn(MATERIAL_KINDS)
  kind!: MaterialKind;

  @ApiProperty({ maxLength: TITLE_MAX })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title!: string;

  @ApiProperty({ description: 'Id returned by POST /uploads (purpose must match the kind)' })
  @IsUUID()
  fileId!: string;
}

export class RenameMaterialDto {
  @ApiProperty({ maxLength: TITLE_MAX })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_MAX)
  title!: string;
}

/** The new order of the children of one parent: ids from first to last. */
export class ReorderDto {
  @ApiProperty({ type: [String], description: 'Ids in the new order (children of one parent)' })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids!: string[];
}

/** The subtopics a student may open, set in one go (whole-subject grants are separate). */
export class SetGrantsDto {
  @ApiProperty({
    type: [String],
    description: 'Every subtopic the student should have; the rest is revoked',
  })
  @IsArray()
  @ArrayMaxSize(2000)
  @IsUUID('all', { each: true })
  subtopicIds!: string[];
}
