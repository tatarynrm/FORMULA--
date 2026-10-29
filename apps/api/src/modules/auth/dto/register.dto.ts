import { AUTH } from '@formula/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Іван',
    minLength: AUTH.NAME_MIN_LENGTH,
    maxLength: AUTH.NAME_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(AUTH.NAME_MIN_LENGTH)
  @MaxLength(AUTH.NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({
    example: 'Петренко',
    minLength: AUTH.SURNAME_MIN_LENGTH,
    maxLength: AUTH.SURNAME_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(AUTH.SURNAME_MIN_LENGTH)
  @MaxLength(AUTH.SURNAME_MAX_LENGTH)
  surname!: string;

  @ApiProperty({ example: 'student@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: AUTH.PASSWORD_MIN_LENGTH, maxLength: AUTH.PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(AUTH.PASSWORD_MIN_LENGTH)
  @MaxLength(AUTH.PASSWORD_MAX_LENGTH)
  password!: string;
}
