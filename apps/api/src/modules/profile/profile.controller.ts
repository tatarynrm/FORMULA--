import { AUTH_COOKIES, type Profile, type ProfileOptions } from '@formula/shared';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateProfileDto } from './dto/profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('profile')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('options')
  @ApiOperation({ summary: 'Statuses and goals offered during onboarding' })
  options(): Promise<ProfileOptions> {
    return this.profile.getOptions();
  }

  @Get()
  @ApiOperation({ summary: 'Profile of the current user' })
  get(@CurrentUser() user: RequestUser): Promise<Profile> {
    return this.profile.get(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Save the profile (also used to finish or skip onboarding)' })
  update(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profile.update(user.userId, dto);
  }
}
