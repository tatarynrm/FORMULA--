import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { FilesController } from './files.controller.js';
import { FilesRepository } from './files.repository.js';
import { FilesService } from './files.service.js';
import { StorageService } from './storage.service.js';
import { UploadInterceptor } from './upload.interceptor.js';

@Module({
  imports: [AccessModule],
  controllers: [FilesController],
  providers: [FilesRepository, FilesService, StorageService, UploadInterceptor],
  exports: [FilesService, StorageService],
})
export class FilesModule {}
