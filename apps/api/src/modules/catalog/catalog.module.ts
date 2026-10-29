import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { FilesModule } from '../files/files.module.js';
import {
  AccessGrantsController,
  CatalogAdminController,
  CatalogController,
} from './catalog.controller.js';
import { CatalogRepository } from './catalog.repository.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [AccessModule, FilesModule],
  controllers: [CatalogAdminController, AccessGrantsController, CatalogController],
  providers: [CatalogRepository, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
