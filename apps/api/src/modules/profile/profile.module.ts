import { Module } from '@nestjs/common';

import { FilesModule } from '../files/files.module.js';
import { UsersModule } from '../users/users.module.js';
import { ProfileController } from './profile.controller.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [FilesModule, UsersModule],
  controllers: [ProfileController],
  providers: [ProfileRepository, ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
