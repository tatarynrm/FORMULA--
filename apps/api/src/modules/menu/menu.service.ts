import { randomUUID } from 'node:crypto';

import type { MenuAudience, MenuItem, MenuItemAdmin, MenuPage } from '@formula/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { sanitizeRichText } from '../../common/utils/sanitize-html.js';
import { AccessService } from '../access/access.service.js';
import type { CreateMenuItemDto, ReorderMenuDto, UpdateMenuItemDto } from './dto/menu.dto.js';
import { MenuRepository } from './menu.repository.js';
import type { MenuItemRecord } from './menu.types.js';

function toPublic(item: MenuItemRecord): MenuItem {
  return {
    id: item.id,
    key: item.key,
    label: item.label,
    href: item.href,
    icon: item.icon,
    exact: item.exact,
    kind: item.kind,
  };
}

function toAdmin(item: MenuItemRecord): MenuItemAdmin {
  return {
    ...toPublic(item),
    audience: item.audience,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    isSystem: item.isSystem,
    superadminOnly: item.superadminOnly,
  };
}

@Injectable()
export class MenuService {
  constructor(
    private readonly repository: MenuRepository,
    private readonly access: AccessService,
  ) {}

  /** The navigation of the signed-in user: students get theirs, admins only the sections they may use. */
  async getForUser(userId: string): Promise<MenuItem[]> {
    const context = await this.access.getContext(userId);
    if (!context) throw new ForbiddenException();

    if (context.role !== 'admin') {
      return (await this.repository.findByAudience('student', true)).map(toPublic);
    }

    // `canUseSection` lets superadmins through everything and subadmins only through granted keys.
    // Superadmin-only items are never granted, so subadmins cannot see them.
    const items = await this.repository.findByAudience('admin', true);
    return items.filter((item) => this.access.canUseSection(context, item.key)).map(toPublic);
  }

  async listForEditor(audience: MenuAudience): Promise<MenuItemAdmin[]> {
    return (await this.repository.findByAudience(audience, false)).map(toAdmin);
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItemAdmin> {
    const id = randomUUID();
    const key = `custom-${id.slice(0, 8)}`;

    // A page lives at an address built from its own id, inside the area of the menu it belongs to.
    const href =
      dto.kind === 'page'
        ? `${dto.audience === 'admin' ? '/admin' : '/cabinet'}/pages/${id}`
        : dto.href;
    if (!href) throw new BadRequestException('A link needs a path');

    return toAdmin(
      await this.repository.create({
        id,
        key,
        audience: dto.audience,
        label: dto.label,
        href,
        icon: dto.icon,
        kind: dto.kind,
      }),
    );
  }

  async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItemAdmin> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Menu item not found');

    // Hiding the team/menu editors would lock the superadmin out of their own tools.
    if (existing.superadminOnly && dto.isActive === false) {
      throw new BadRequestException('This section cannot be hidden');
    }
    // The address of a page is fixed: its content is stored under the item id.
    if (existing.kind === 'page' && dto.href !== undefined && dto.href !== existing.href) {
      throw new BadRequestException('The address of a page cannot be changed');
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) throw new NotFoundException('Menu item not found');
    return toAdmin(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Menu item not found');
    if (existing.isSystem) {
      throw new BadRequestException('Built-in items cannot be deleted, hide them instead');
    }
    await this.repository.deleteCustom(id);
  }

  async reorder(dto: ReorderMenuDto): Promise<MenuItemAdmin[]> {
    await this.repository.reorder(dto.audience, dto.ids);
    return this.listForEditor(dto.audience);
  }

  /**
   * A page of the menu for the person who opens it. Students see the pages of the student menu;
   * an admin page needs the section of its menu item (superadmins pass). Anything else looks missing.
   */
  async getPage(userId: string, itemId: string): Promise<MenuPage> {
    const item = await this.repository.findById(itemId);
    if (!item || item.kind !== 'page' || !item.isActive)
      throw new NotFoundException('Page not found');

    if (item.audience === 'admin') {
      const context = await this.access.getContext(userId);
      if (!this.access.canUseSection(context, item.key))
        throw new NotFoundException('Page not found');
    }

    return {
      id: item.id,
      title: item.label,
      bodyHtml: (await this.repository.findPageBody(itemId)) ?? '',
    };
  }

  /** The text of a page for the superadmin editor (works for hidden pages too). */
  async getPageForEditor(itemId: string): Promise<{ bodyHtml: string }> {
    const item = await this.repository.findById(itemId);
    if (!item || item.kind !== 'page') throw new NotFoundException('Page not found');
    return { bodyHtml: (await this.repository.findPageBody(itemId)) ?? '' };
  }

  async savePage(userId: string, itemId: string, bodyHtml: string): Promise<{ bodyHtml: string }> {
    const item = await this.repository.findById(itemId);
    if (!item || item.kind !== 'page') throw new NotFoundException('Page not found');

    const clean = sanitizeRichText(bodyHtml);
    await this.repository.savePageBody(itemId, clean, userId);
    return { bodyHtml: clean };
  }

  /** Keys that may be granted to subadmins. */
  listGrantableKeys(): Promise<string[]> {
    return this.repository.findGrantableAdminKeys();
  }
}
