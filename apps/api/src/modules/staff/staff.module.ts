import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MenuModule } from '../menu/menu.module.js';
import { UsersModule } from '../users/users.module.js';
import { StaffController } from './staff.controller.js';
import { StaffRepository } from './staff.repository.js';
import { StaffService } from './staff.service.js';

@Module({
  imports: [AccessModule, AuthModule, MenuModule, UsersModule],
  controllers: [StaffController],
  providers: [StaffRepository, StaffService],
})
export class StaffModule {}
