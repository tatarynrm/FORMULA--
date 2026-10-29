import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { FilesModule } from '../files/files.module.js';
import { UsersModule } from '../users/users.module.js';
import { TestimonialsAdminController, TestimonialsController } from './testimonials.controller.js';
import { TestimonialsRepository } from './testimonials.repository.js';
import { TestimonialsService } from './testimonials.service.js';

// Notifications and realtime are global modules, so they need no import here.
@Module({
  imports: [AccessModule, FilesModule, UsersModule],
  controllers: [TestimonialsController, TestimonialsAdminController],
  providers: [TestimonialsRepository, TestimonialsService],
})
export class TestimonialsModule {}
