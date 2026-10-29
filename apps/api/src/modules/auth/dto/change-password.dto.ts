import { AUTH } from '@formula/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(AUTH.PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  @ApiProperty({ minLength: AUTH.PASSWORD_MIN_LENGTH, maxLength: AUTH.PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(AUTH.PASSWORD_MIN_LENGTH)
  @MaxLength(AUTH.PASSWORD_MAX_LENGTH)
  newPassword!: string;
}
