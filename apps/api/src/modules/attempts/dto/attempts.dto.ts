import { TESTS } from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({
    description: 'Accept the time limit set by the admin (ignored when the test has none)',
  })
  @IsBoolean()
  timed!: boolean;

  @ApiProperty({
    description: 'Show whether each answer is right, with explanations, right after answering',
  })
  @IsBoolean()
  explanationsEnabled!: boolean;
}

export class SaveAnswerDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Choice questions: the picked options (empty clears the answer)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(TESTS.MAX_OPTIONS)
  @IsUUID('all', { each: true })
  optionIds?: string[];

  @ApiPropertyOptional({ nullable: true, description: 'Situational questions: the written answer' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(TESTS.ANSWER_MAX_LENGTH)
  textAnswer?: string | null;
}

export class GradeDto {
  @ApiProperty()
  @IsUUID()
  questionId!: string;

  @ApiProperty({ description: 'Points, from 0 to the question max score' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  score!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  comment?: string | null;
}

export class SubmitReviewDto {
  @ApiProperty({ type: [GradeDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GradeDto)
  grades!: GradeDto[];
}
