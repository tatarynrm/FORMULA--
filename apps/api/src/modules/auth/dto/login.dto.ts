import { AUTH } from '@formula/shared';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
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
