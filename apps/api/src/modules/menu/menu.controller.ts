import { AUTH_COOKIES, type MenuItem, type MenuItemAdmin, type MenuPage } from '@formula/shared';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { SuperadminOnly } from '../access/access.decorators.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  CreateMenuItemDto,
  ReorderMenuDto,
  UpdateMenuItemDto,
  UpdateMenuPageDto,
} from './dto/menu.dto.js';
import { MenuService } from './menu.service.js';

/** Navigation of the signed-in user (student cabinet or admin panel). */
@ApiTags('menu')
@ApiCookieAuth(AUTH_COOKIES.ACCESS)
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Menu items the current user may see' })
  getMine(@CurrentUser() user: RequestUser): Promise<MenuItem[]> {
    return this.menu.getForUser(user.userId);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'The text of a page-kind menu item the current user may open' })
  getPage(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuPage> {
    return this.menu.getPage(user.userId, id);
  }
}

/** Menu editor, superadmin only. */
@ApiTags('admin')
@SuperadminOnly()
@Controller('admin/menu')
export class MenuAdminController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'All items of one menu, including hidden ones' })
  @ApiQuery({ name: 'audience', enum: ['student', 'admin'] })
  list(@Query('audience') audience: string): Promise<MenuItemAdmin[]> {
    return this.menu.listForEditor(audience === 'admin' ? 'admin' : 'student');
  }

  @Post()
  @ApiOperation({ summary: 'Add a custom menu item' })
  create(@Body() dto: CreateMenuItemDto): Promise<MenuItemAdmin> {
    return this.menu.create(dto);
  }

  @Put('order')
  @ApiOperation({ summary: 'Save a new order of one menu' })
  reorder(@Body() dto: ReorderMenuDto): Promise<MenuItemAdmin[]> {
    return this.menu.reorder(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename, change link or icon, show or hide an item' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<MenuItemAdmin> {
    return this.menu.update(id, dto);
  }

  @Get(':id/page')
  @ApiOperation({ summary: 'The text of a page-kind item, for the editor' })
  getPage(@Param('id', ParseUUIDPipe) id: string): Promise<{ bodyHtml: string }> {
    return this.menu.getPageForEditor(id);
  }

  @Put(':id/page')
  @ApiOperation({ summary: 'Save the text of a page-kind item (sanitized)' })
  savePage(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuPageDto,
  ): Promise<{ bodyHtml: string }> {
    return this.menu.savePage(user.userId, id, dto.bodyHtml);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a custom item (built-in ones can only be hidden)' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ deleted: true }> {
    await this.menu.remove(id);
    return { deleted: true };
  }
}
