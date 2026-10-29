import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { MenuAdminController, MenuController } from './menu.controller.js';
import { MenuRepository } from './menu.repository.js';
import { MenuService } from './menu.service.js';

@Module({
  imports: [AccessModule],
  controllers: [MenuController, MenuAdminController],
  providers: [MenuRepository, MenuService],
  exports: [MenuService],
})
export class MenuModule {}
