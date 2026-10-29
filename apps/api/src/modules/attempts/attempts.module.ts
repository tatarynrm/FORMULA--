import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { TestsModule } from '../tests/tests.module.js';
import { AttemptsController, ReviewsController } from './attempts.controller.js';
import { AttemptsRepository } from './attempts.repository.js';
import { AttemptsService } from './attempts.service.js';

@Module({
  imports: [AccessModule, TestsModule],
  controllers: [AttemptsController, ReviewsController],
  providers: [AttemptsRepository, AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
