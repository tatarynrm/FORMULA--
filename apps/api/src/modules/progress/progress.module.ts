import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { ProgressController } from './progress.controller.js';
import { ProgressRepository } from './progress.repository.js';
import { ProgressService } from './progress.service.js';

@Module({
  imports: [AccessModule],
  controllers: [ProgressController],
  providers: [ProgressRepository, ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
