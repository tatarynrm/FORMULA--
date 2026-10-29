import {
  AUTH_COOKIES,
  type AdminTestimonial,
  type MyTestimonial,
  type PublicTestimonial,
  type SubmitTestimonialResult,
  type TestimonialCounts,
} from '@formula/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AdminSection } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { StorageService } from '../files/storage.service.js';
import {
  PublicTestimonialsQueryDto,
  SubmitTestimonialDto,
  TestimonialsAdminQueryDto,
  UpdateTestimonialDto,
} from './dto/testimonials.dto.js';
import { TestimonialsService } from './testimonials.service.js';

const UUID = new ParseUUIDPipe();

/** Public side: the published testimonials, and leaving one (as a guest or signed in). */
@ApiTags('testimonials')
@Controller({ path: 'testimonials', version: '1' })
export class TestimonialsController {
  constructor(
    private readonly testimonials: TestimonialsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  // The landing page asks often and a new testimonial may wait a moment, so it is cached briefly.
  @Header('Cache-Control', 'public, max-age=30')
  @ApiOperation({ summary: 'Published testimonials, newest first (no sign-in needed)' })
  list(@Query() query: PublicTestimonialsQueryDto): Promise<PublicTestimonial[]> {
    return this.testimonials.listPublic(query.limit);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Leave a testimonial. A signed-in author gets the name of the account; a guest sends name and surname. It waits for moderation.',
  })
  submit(
    @CurrentUser() user: RequestUser | null,
    @Body() dto: SubmitTestimonialDto,
    @Req() request: Request,
  ): Promise<SubmitTestimonialResult> {
    return this.testimonials.submit(user?.userId ?? null, dto, request.ip);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIES.ACCESS)
  @ApiOperation({ summary: 'My testimonials with their state' })
  mine(@CurrentUser() user: RequestUser): Promise<MyTestimonial[]> {
    return this.testimonials.listMine(user.userId);
  }

  @Get(':id/avatar')
  @ApiOperation({ summary: 'Profile picture of the author of a PUBLISHED testimonial' })
  async avatar(@Param('id', UUID) id: string, @Res() response: Response): Promise<void> {
    const file = await this.testimonials.getPublicAvatar(id);
    const size = await this.storage.size(file.storageKey);

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', String(size));
    response.setHeader('Content-Disposition', 'inline');
    response.setHeader('Cache-Control', 'public, max-age=300');
    // The web app may be on another port (same site) in development.
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    const stream = this.storage.read(file.storageKey);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  }
}

/** Moderation. Needs the `testimonials` section: superadmins, or subadmins who were granted it. */
@ApiTags('admin')
@AdminSection('testimonials')
@Controller({ path: 'admin/testimonials', version: '1' })
export class TestimonialsAdminController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Testimonials of one state (pending by default), newest first' })
  list(@Query() query: TestimonialsAdminQueryDto): Promise<PaginatedResult<AdminTestimonial>> {
    return this.testimonials.listForAdmin(query);
  }

  @Get('counts')
  @ApiOperation({ summary: 'How many testimonials are pending, approved and rejected' })
  counts(): Promise<TestimonialCounts> {
    return this.testimonials.counts();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit the wording and/or publish, reject or put back on hold' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
    @Body() dto: UpdateTestimonialDto,
  ): Promise<AdminTestimonial> {
    return this.testimonials.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a testimonial for good' })
  async remove(@Param('id', UUID) id: string): Promise<void> {
    await this.testimonials.remove(id);
  }
}
