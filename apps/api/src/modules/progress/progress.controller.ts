import { AUTH_COOKIES, type ProgressSummary, type SubjectProgress } from '@formula/shared';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProgressService } from './progress.service.js';

/** Numbers for the student's home screen. */
@ApiTags('progress')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Tests passed, average result, mistakes to work through, subtopics done',
  })
  summary(@CurrentUser() user: RequestUser): Promise<ProgressSummary> {
    return this.progress.getSummary(user.userId);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Progress of the student in every published subject' })
  subjects(@CurrentUser() user: RequestUser): Promise<SubjectProgress[]> {
    return this.progress.getSubjects(user.userId);
  }
}
