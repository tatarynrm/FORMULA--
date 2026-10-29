import type {
  StudentAttemptItem,
  StudentDetail,
  StudentListItem,
  StudentPresenceHistory,
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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginatedResult } from '../../common/paginated-result.js';
import { AdminSection } from '../access/access.decorators.js';
import {
  StudentAttemptsQueryDto,
  StudentListQueryDto,
  UpdateStudentDto,
} from './dto/students.dto.js';
import { StudentsService } from './students.service.js';

const UUID = new ParseUUIDPipe();

/** Needs the `students` section: superadmins, or subadmins who were granted it. */
@ApiTags('admin')
@AdminSection('students')
@Controller('admin/students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Students with profile, stats and online flag; search, sort, online filter',
  })
  list(@Query() query: StudentListQueryDto): Promise<PaginatedResult<StudentListItem>> {
    return this.students.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One student in full: profile, progress, grants, sessions' })
  get(@Param('id', UUID) id: string): Promise<StudentDetail> {
    return this.students.get(id);
  }

  @Get(':id/presence')
  @ApiOperation({ summary: 'Online now, last request and the session history of a student' })
  presence(@Param('id', UUID) id: string): Promise<StudentPresenceHistory> {
    return this.students.getPresence(id);
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Attempts of a student, newest first' })
  attempts(
    @Param('id', UUID) id: string,
    @Query() query: StudentAttemptsQueryDto,
  ): Promise<StudentAttemptItem[]> {
    return this.students.listAttempts(id, query.limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit the name of a student' })
  update(@Param('id', UUID) id: string, @Body() dto: UpdateStudentDto): Promise<StudentDetail> {
    return this.students.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete the account of a student with everything it owns' })
  async remove(@Param('id', UUID) id: string): Promise<{ deleted: true }> {
    await this.students.remove(id);
    return { deleted: true };
  }
}
