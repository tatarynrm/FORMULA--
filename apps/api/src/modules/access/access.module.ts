import { Module } from '@nestjs/common';

import { AccessRepository } from './access.repository.js';
import { AccessService } from './access.service.js';
import { SectionGuard } from './section.guard.js';

@Module({
  providers: [AccessRepository, AccessService, SectionGuard],
  exports: [AccessService, SectionGuard],
})
export class AccessModule {}
