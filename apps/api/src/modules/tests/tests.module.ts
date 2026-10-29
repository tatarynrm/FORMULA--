import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { TestsAdminController, TestsController } from './tests.controller.js';
import { TestsRepository } from './tests.repository.js';
import { TestsService } from './tests.service.js';

@Module({
  imports: [AccessModule, CatalogModule],
  controllers: [TestsAdminController, TestsController],
  providers: [TestsRepository, TestsService],
  exports: [TestsService],
})
export class TestsModule {}
