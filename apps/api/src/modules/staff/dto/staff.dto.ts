import { AUTH } from '@formula/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdatePermissionsDto {
  @ApiProperty({ type: [String], example: ['bases'] })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  permissions!: string[];
}

export class CreateStaffDto extends UpdatePermissionsDto {
  @ApiProperty({ example: 'kateryna@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Required only when the account does not exist yet' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.NAME_MIN_LENGTH)
  @MaxLength(AUTH.NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ description: 'Required only when the account does not exist yet' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(AUTH.SURNAME_MIN_LENGTH)
  @MaxLength(AUTH.SURNAME_MAX_LENGTH)
  surname?: string;

  @ApiPropertyOptional({ description: 'Required only when the account does not exist yet' })
  @IsOptional()
  @IsString()
  @MinLength(AUTH.PASSWORD_MIN_LENGTH)
  @MaxLength(AUTH.PASSWORD_MAX_LENGTH)
  password?: string;
}
