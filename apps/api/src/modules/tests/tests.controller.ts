import {
  AUTH_COOKIES,
  type AdminTest,
  type StudentTestSummary,
  TEST_COLLECTIONS,
  type TestCollection,
  type TestFilterOptions,
  type TestSummary,
} from '@formula/shared';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateTestDto, SaveQuestionsDto, UpdateTestDto } from './dto/tests.dto.js';
import { TestsService } from './tests.service.js';

const UUID = new ParseUUIDPipe();

function parseCollection(value: string | undefined): TestCollection {
  const collection = TEST_COLLECTIONS.find((candidate) => candidate === value);
  if (!collection)
    throw new BadRequestException(`collection must be one of: ${TEST_COLLECTIONS.join(', ')}`);
  return collection;
}

/**
 * Test management. Rights depend on the collection (subtopic tests need the `subjects` section,
 * bases need `bases`...), which the service checks, so only the JWT is required here.
 */
@ApiTags('admin')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller({ path: 'admin/tests', version: '1' })
export class TestsAdminController {
  constructor(private readonly tests: TestsService) {}

  @Get()
  @ApiOperation({ summary: 'Tests of one collection (and optionally one subtopic)' })
  @ApiQuery({ name: 'collection', enum: TEST_COLLECTIONS })
  @ApiQuery({ name: 'subtopicId', required: false })
  list(
    @CurrentUser() user: RequestUser,
    @Query('collection') collection: string,
    @Query('subtopicId') subtopicId?: string,
  ): Promise<TestSummary[]> {
    return this.tests.adminList(user.userId, parseCollection(collection), subtopicId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTestDto): Promise<AdminTest> {
    return this.tests.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'A test with all questions, options and correct answers' })
  get(@CurrentUser() user: RequestUser, @Param('id', UUID) id: string): Promise<AdminTest> {
    return this.tests.adminGet(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit the test settings; publishing validates the questions' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
    @Body() dto: UpdateTestDto,
  ): Promise<AdminTest> {
    return this.tests.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<{ deleted: true }> {
    await this.tests.remove(user.userId, id);
    return { deleted: true };
  }

  @Put(':id/questions')
  @ApiOperation({
    summary: 'Replace all questions and options (existing ids are updated in place)',
  })
  saveQuestions(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
    @Body() dto: SaveQuestionsDto,
  ): Promise<AdminTest> {
    return this.tests.saveQuestions(user.userId, id, dto);
  }
}

/** Tests as students see them: published only, with their own progress. */
@ApiTags('tests')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class TestsController {
  constructor(private readonly tests: TestsService) {}

  @Get('tests')
  @ApiOperation({ summary: 'Published tests of the bases / booklets / AMPS lists, with filters' })
  @ApiQuery({ name: 'collection', enum: ['base', 'booklet', 'amps'] })
  list(
    @CurrentUser() user: RequestUser,
    @Query('collection') collection: string,
    @Query('category') category?: string,
    @Query('year') year?: string,
    @Query('specialty') specialty?: string,
    @Query('q') q?: string,
  ): Promise<StudentTestSummary[]> {
    const parsed = parseCollection(collection);
    if (parsed === 'subtopic')
      throw new BadRequestException('Use /subtopics/:id/tests for subtopic tests');

    return this.tests.listForStudent(user.userId, {
      collection: parsed,
      ...(category ? { category } : {}),
      ...(year ? { year: Number(year) || undefined } : {}),
      ...(specialty ? { specialty } : {}),
      ...(q ? { q: q.slice(0, 100) } : {}),
    });
  }

  @Get('tests/filters')
  @ApiQuery({ name: 'collection', enum: ['base', 'booklet', 'amps'] })
  filters(@Query('collection') collection: string): Promise<TestFilterOptions> {
    return this.tests.filterOptions(parseCollection(collection));
  }

  @Get('tests/:id')
  get(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<StudentTestSummary> {
    return this.tests.getForStudent(user.userId, id);
  }

  @Get('subtopics/:id/tests')
  @ApiOperation({ summary: 'Tests of a subtopic (403 without access)' })
  listForSubtopic(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<StudentTestSummary[]> {
    return this.tests.listForSubtopic(user.userId, id);
  }

  // ---- Saved ("Збережені") ----

  @Get('favorites')
  @ApiOperation({ summary: 'Saved tests of every collection' })
  favorites(@CurrentUser() user: RequestUser): Promise<StudentTestSummary[]> {
    return this.tests.listFavorites(user.userId);
  }

  @Put('favorites/:testId')
  @ApiOperation({ summary: 'Save a test' })
  async addFavorite(
    @CurrentUser() user: RequestUser,
    @Param('testId', UUID) testId: string,
  ): Promise<{ saved: true }> {
    await this.tests.addFavorite(user.userId, testId);
    return { saved: true };
  }

  @Delete('favorites/:testId')
  @HttpCode(200)
  async removeFavorite(
    @CurrentUser() user: RequestUser,
    @Param('testId', UUID) testId: string,
  ): Promise<{ saved: false }> {
    await this.tests.removeFavorite(user.userId, testId);
    return { saved: false };
  }
}
