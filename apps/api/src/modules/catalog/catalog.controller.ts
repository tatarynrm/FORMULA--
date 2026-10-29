import {
  AUTH_COOKIES,
  type AdminSubject,
  type AdminSubjectTree,
  type AdminSubtopic,
  type CatalogSubtopic,
  type Material,
  type StudentSubject,
  type StudentSubtopic,
  type SubjectGrant,
  type SubtopicGrant,
} from '@formula/shared';
import {
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
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AdminSection } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CatalogService } from './catalog.service.js';
import {
  CreateMaterialDto,
  CreateSubjectDto,
  CreateSubtopicDto,
  CreateTopicDto,
  RenameMaterialDto,
  ReorderDto,
  SetGrantsDto,
  UpdateSubjectDto,
  UpdateSubtopicDto,
  UpdateTopicDto,
} from './dto/catalog.dto.js';

const UUID = new ParseUUIDPipe();

/** Subjects, topics, subtopics and their materials. Needs the `subjects` section. */
@ApiTags('admin')
@AdminSection('subjects')
@Controller('admin')
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'All subjects' })
  listSubjects(): Promise<AdminSubject[]> {
    return this.catalog.listSubjects();
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a subject (starts as a draft)' })
  createSubject(@Body() dto: CreateSubjectDto): Promise<AdminSubject> {
    return this.catalog.createSubject(dto);
  }

  @Put('subjects/order')
  @ApiOperation({ summary: 'Save a new order of the subjects' })
  async reorderSubjects(@Body() dto: ReorderDto): Promise<{ ordered: true }> {
    await this.catalog.reorderSubjects(dto.ids);
    return { ordered: true };
  }

  @Put('subjects/:id/topics/order')
  @ApiOperation({ summary: 'Save a new order of the topics of a subject' })
  async reorderTopics(
    @Param('id', UUID) id: string,
    @Body() dto: ReorderDto,
  ): Promise<{ ordered: true }> {
    await this.catalog.reorderTopics(id, dto.ids);
    return { ordered: true };
  }

  @Put('topics/:id/subtopics/order')
  @ApiOperation({ summary: 'Save a new order of the subtopics of a topic' })
  async reorderSubtopics(
    @Param('id', UUID) id: string,
    @Body() dto: ReorderDto,
  ): Promise<{ ordered: true }> {
    await this.catalog.reorderSubtopics(id, dto.ids);
    return { ordered: true };
  }

  @Put('subtopics/:id/materials/order')
  @ApiOperation({ summary: 'Save a new order of the materials of a subtopic' })
  async reorderMaterials(
    @Param('id', UUID) id: string,
    @Body() dto: ReorderDto,
  ): Promise<{ ordered: true }> {
    await this.catalog.reorderMaterials(id, dto.ids);
    return { ordered: true };
  }

  @Get('subjects/:id')
  @ApiOperation({ summary: 'A subject with its topics and subtopics' })
  getSubject(@Param('id', UUID) id: string): Promise<AdminSubjectTree> {
    return this.catalog.getSubjectTree(id);
  }

  @Patch('subjects/:id')
  updateSubject(
    @Param('id', UUID) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<AdminSubject> {
    return this.catalog.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(200)
  async deleteSubject(@Param('id', UUID) id: string): Promise<{ deleted: true }> {
    await this.catalog.deleteSubject(id);
    return { deleted: true };
  }

  @Post('subjects/:id/topics')
  @ApiOperation({ summary: 'Add a topic; returns the updated subject tree' })
  createTopic(
    @Param('id', UUID) id: string,
    @Body() dto: CreateTopicDto,
  ): Promise<AdminSubjectTree> {
    return this.catalog.createTopic(id, dto);
  }

  @Patch('topics/:id')
  async updateTopic(
    @Param('id', UUID) id: string,
    @Body() dto: UpdateTopicDto,
  ): Promise<{ updated: true }> {
    await this.catalog.updateTopic(id, dto);
    return { updated: true };
  }

  @Delete('topics/:id')
  @HttpCode(200)
  async deleteTopic(@Param('id', UUID) id: string): Promise<{ deleted: true }> {
    await this.catalog.deleteTopic(id);
    return { deleted: true };
  }

  @Post('topics/:id/subtopics')
  @ApiOperation({ summary: 'Add a subtopic to a topic' })
  createSubtopic(
    @Param('id', UUID) id: string,
    @Body() dto: CreateSubtopicDto,
  ): Promise<{ id: string }> {
    return this.catalog.createSubtopic(id, dto);
  }

  @Get('subtopics/:id')
  @ApiOperation({ summary: 'A subtopic with its description and materials' })
  getSubtopic(@Param('id', UUID) id: string): Promise<AdminSubtopic> {
    return this.catalog.getSubtopic(id);
  }

  @Patch('subtopics/:id')
  @ApiOperation({ summary: 'Edit a subtopic. The description (rich text) is sanitized.' })
  updateSubtopic(
    @Param('id', UUID) id: string,
    @Body() dto: UpdateSubtopicDto,
  ): Promise<AdminSubtopic> {
    return this.catalog.updateSubtopic(id, dto);
  }

  @Delete('subtopics/:id')
  @HttpCode(200)
  async deleteSubtopic(@Param('id', UUID) id: string): Promise<{ deleted: true }> {
    await this.catalog.deleteSubtopic(id);
    return { deleted: true };
  }

  @Post('subtopics/:id/materials')
  @ApiOperation({ summary: 'Attach an uploaded video or document to a subtopic' })
  addMaterial(@Param('id', UUID) id: string, @Body() dto: CreateMaterialDto): Promise<Material> {
    return this.catalog.addMaterial(id, dto);
  }

  @Patch('materials/:id')
  async renameMaterial(
    @Param('id', UUID) id: string,
    @Body() dto: RenameMaterialDto,
  ): Promise<{ updated: true }> {
    await this.catalog.renameMaterial(id, dto.title);
    return { updated: true };
  }

  @Delete('materials/:id')
  @HttpCode(200)
  async deleteMaterial(@Param('id', UUID) id: string): Promise<{ deleted: true }> {
    await this.catalog.deleteMaterial(id);
    return { deleted: true };
  }
}

/** Which subtopics a student can open. Needs the `students` section. */
@ApiTags('admin')
@AdminSection('students')
@Controller('admin')
export class AccessGrantsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('catalog/subtopics')
  @ApiOperation({ summary: 'Flat list of all subtopics (for the "give access" picker)' })
  listSubtopics(): Promise<CatalogSubtopic[]> {
    return this.catalog.listAllSubtopics();
  }

  @Get('students/:userId/access')
  listGrants(@Param('userId', UUID) userId: string): Promise<SubtopicGrant[]> {
    return this.catalog.listGrants(userId);
  }

  @Get('students/:userId/subject-access')
  @ApiOperation({ summary: 'Whole subjects opened for a student' })
  listSubjectGrants(@Param('userId', UUID) userId: string): Promise<SubjectGrant[]> {
    return this.catalog.listSubjectGrants(userId);
  }

  @Put('students/:userId/subject-access/:subjectId')
  @ApiOperation({
    summary: 'Open a whole subject for a student (every subtopic, also future ones)',
  })
  grantSubject(
    @Param('userId', UUID) userId: string,
    @Param('subjectId', UUID) subjectId: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<SubjectGrant[]> {
    return this.catalog.grantSubject(userId, subjectId, actor.userId);
  }

  @Delete('students/:userId/subject-access/:subjectId')
  @HttpCode(200)
  revokeSubject(
    @Param('userId', UUID) userId: string,
    @Param('subjectId', UUID) subjectId: string,
  ): Promise<SubjectGrant[]> {
    return this.catalog.revokeSubject(userId, subjectId);
  }

  @Put('students/:userId/access')
  @ApiOperation({ summary: 'Set the individual subtopics a student may open (several at once)' })
  setGrants(
    @Param('userId', UUID) userId: string,
    @Body() dto: SetGrantsDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<SubtopicGrant[]> {
    return this.catalog.setGrants(userId, dto.subtopicIds, actor.userId);
  }

  @Put('students/:userId/access/:subtopicId')
  @ApiOperation({ summary: 'Give a student access to a subtopic' })
  grant(
    @Param('userId', UUID) userId: string,
    @Param('subtopicId', UUID) subtopicId: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<SubtopicGrant[]> {
    return this.catalog.grant(userId, subtopicId, actor.userId);
  }

  @Delete('students/:userId/access/:subtopicId')
  @HttpCode(200)
  revoke(
    @Param('userId', UUID) userId: string,
    @Param('subtopicId', UUID) subtopicId: string,
  ): Promise<SubtopicGrant[]> {
    return this.catalog.revoke(userId, subtopicId);
  }
}

/** The catalog as a student sees it: published content only, locked where there is no access. */
@ApiTags('catalog')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'Published subjects with topics and subtopics' })
  listSubjects(@CurrentUser() user: RequestUser): Promise<StudentSubject[]> {
    return this.catalog.listStudentSubjects(user.userId);
  }

  @Get('subjects/:id')
  getSubject(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<StudentSubject> {
    return this.catalog.getStudentSubject(user.userId, id);
  }

  @Get('subtopics/:id')
  @ApiOperation({
    summary: 'A subtopic. Description and materials are empty when the student has no access.',
  })
  getSubtopic(
    @CurrentUser() user: RequestUser,
    @Param('id', UUID) id: string,
  ): Promise<StudentSubtopic> {
    return this.catalog.getStudentSubtopic(user.userId, id);
  }
}
