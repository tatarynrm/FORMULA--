import {
  CONTENT_STATUSES,
  type ContentStatus,
  TEST_COLLECTIONS,
  TEST_KINDS,
  type TestCollection,
  type TestKind,
  TESTS,
} from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateTestDto {
  @ApiProperty({ enum: TEST_KINDS })
  @IsIn(TEST_KINDS)
  kind!: TestKind;

  @ApiProperty({ enum: TEST_COLLECTIONS })
  @IsIn(TEST_COLLECTIONS)
  collection!: TestCollection;

  @ApiPropertyOptional({
    description: 'Required for the "subtopic" collection, forbidden otherwise',
  })
  @IsOptional()
  @IsUUID()
  subtopicId?: string;

  @ApiProperty({ maxLength: TESTS.TITLE_MAX_LENGTH })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TESTS.TITLE_MAX_LENGTH)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  specialty?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Total time for the whole test, in seconds' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(10)
  @Max(24 * 3600)
  timeLimitSeconds?: number | null;
}

export class UpdateTestDto {
  @ApiPropertyOptional({
    enum: TEST_KINDS,
    description: 'Only while the test has no questions (a subtopic test picks its kind this way)',
  })
  @IsOptional()
  @IsIn(TEST_KINDS)
  kind?: TestKind;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TESTS.TITLE_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1900)
  @Max(2200)
  year?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(100)
  specialty?: string | null;

  @ApiPropertyOptional({ enum: CONTENT_STATUSES })
  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: ContentStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(10)
  @Max(24 * 3600)
  timeLimitSeconds?: number | null;
}

export class OptionDto {
  @ApiPropertyOptional({ description: 'Keep the id of an existing option to update it in place' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ maxLength: TESTS.BODY_MAX_LENGTH })
  @IsString()
  @MaxLength(TESTS.BODY_MAX_LENGTH)
  body!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  imageFileId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(TESTS.BODY_MAX_LENGTH)
  explanation?: string | null;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class QuestionDto {
  @ApiPropertyOptional({ description: 'Keep the id of an existing question to update it in place' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ maxLength: TESTS.BODY_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(TESTS.BODY_MAX_LENGTH)
  body!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  imageFileId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(TESTS.ANSWER_MAX_LENGTH)
  explanation?: string | null;

  @ApiPropertyOptional({ description: 'Points for a situational question', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxScore?: number;

  @ApiPropertyOptional({ type: [OptionDto], description: 'Choice tests only' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TESTS.MAX_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}

export class SaveQuestionsDto {
  @ApiProperty({ type: [QuestionDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions!: QuestionDto[];
}
