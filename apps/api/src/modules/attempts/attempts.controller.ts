import {
  AUTH_COOKIES,
  ATTEMPT_STATUSES,
  type AttemptResult,
  type AttemptSession,
  type AttemptSummary,
  type ReviewDetail,
  type ReviewListItem,
  type SaveAnswerResult,
} from '@formula/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AdminSection } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AttemptsService } from './attempts.service.js';
import { SaveAnswerDto, StartAttemptDto, SubmitReviewDto } from './dto/attempts.dto.js';

const UUID = new ParseUUIDPipe();

/** Taking a test: start (or continue), answer question by question, finish, look at the result. */
@ApiTags('attempts')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post('tests/:testId/attempts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a test, or continue the unfinished attempt of this test' })
  start(
    @CurrentUser() user: RequestUser,
    @Param('testId', UUID) testId: string,
    @Body() dto: StartAttemptDto,
  ): Promise<AttemptSession> {
    return this.attempts.start(user.userId, testId, dto);
  }

  @Get('tests/:testId/attempts')
  @ApiOperation({ summary: 'History of the student attempts of one test, newest first' })
  history(
    @CurrentUser() user: RequestUser,
    @Param('testId', UUID) testId: string,
  ): Promise<AttemptSummary[]> {
    return this.attempts.history(user.userId, testId);
  }

  @Get('attempts/:id')
  @ApiOperation({
    summary: 'An unfinished attempt (questions without answers, saved answers, deadline)',
  })
  getSession(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<AttemptSession> {
    return this.attempts.getSession(user.userId, id);
  }

  @Put('attempts/:id/answers/:questionId')
  @ApiOperation({
    summary: 'Save the answer to one question. With explanations on, the reply holds the feedback.',
  })
  saveAnswer(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
    @Param('questionId', UUID) questionId: string,
    @Body() dto: SaveAnswerDto,
  ): Promise<SaveAnswerResult> {
    return this.attempts.saveAnswer(user.userId, id, questionId, dto);
  }

  @Post('attempts/:id/finish')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Finish the attempt. Choice tests are graded now, situational ones wait for a review.',
  })
  finish(@CurrentUser() user: RequestUser, @Param('id', UUID) id: string): Promise<AttemptResult> {
    return this.attempts.finish(user.userId, id);
  }

  @Get('attempts/:id/result')
  @ApiOperation({ summary: 'Result of a finished attempt, with mistakes and explanations' })
  result(@CurrentUser() user: RequestUser, @Param('id', UUID) id: string): Promise<AttemptResult> {
    return this.attempts.getResult(user.userId, id);
  }
}

/** Grading of the written answers of situational tests. Needs the `reviews` section. */
@ApiTags('admin')
@AdminSection('reviews')
@Controller({ path: 'admin/reviews', version: '1' })
export class ReviewsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Get()
  @ApiOperation({
    summary: 'Attempts waiting for a review (or, with ?status=reviewed, the finished reviews)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ATTEMPT_STATUSES })
  list(@Query('status') status?: string): Promise<ReviewListItem[]> {
    return this.attempts.listReviews(status === 'reviewed' ? 'reviewed' : 'pending_review');
  }

  @Get(':attemptId')
  @ApiOperation({ summary: 'The answers of one attempt together with the model answers' })
  get(@Param('attemptId', UUID) attemptId: string): Promise<ReviewDetail> {
    return this.attempts.getReview(attemptId);
  }

  @Put(':attemptId')
  @ApiOperation({ summary: 'Give points and comments for every question and close the review' })
  submit(
    @CurrentUser() reviewer: RequestUser,
    @Param('attemptId', UUID) attemptId: string,
    @Body() dto: SubmitReviewDto,
  ): Promise<ReviewDetail> {
    return this.attempts.submitReview(reviewer.userId, attemptId, dto);
  }
}
