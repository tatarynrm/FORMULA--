import type { StaffMember } from '@formula/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SuperadminOnly } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateStaffDto, UpdatePermissionsDto } from './dto/staff.dto.js';
import { StaffService } from './staff.service.js';

/** Team management: who is an admin and which sections each subadmin may use. */
@ApiTags('admin')
@SuperadminOnly()
@Controller('admin/staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'All admins with their sections' })
  list(): Promise<StaffMember[]> {
    return this.staff.list();
  }

  @Post()
  @ApiOperation({ summary: 'Add a subadmin (promotes an existing account or creates a new one)' })
  create(@Body() dto: CreateStaffDto, @CurrentUser() actor: RequestUser): Promise<StaffMember> {
    return this.staff.create(dto, actor.userId);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Replace the sections a subadmin may use' })
  updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<StaffMember> {
    return this.staff.updatePermissions(id, dto.permissions, actor.userId);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Turn a subadmin back into a regular student' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<{ removed: true }> {
    await this.staff.remove(id, actor.userId);
    return { removed: true };
  }
}
