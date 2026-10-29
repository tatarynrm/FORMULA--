import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { AttemptsModule } from '../attempts/attempts.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { FilesModule } from '../files/files.module.js';
import { PresenceModule } from '../presence/presence.module.js';
import { ProgressModule } from '../progress/progress.module.js';
import { UsersModule } from '../users/users.module.js';
import { StudentsController } from './students.controller.js';
import { StudentsRepository } from './students.repository.js';
import { StudentsService } from './students.service.js';

@Module({
  imports: [
    AccessModule,
    AttemptsModule,
    CatalogModule,
    FilesModule,
    PresenceModule,
    ProgressModule,
    UsersModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsRepository, StudentsService],
})
export class StudentsModule {}
