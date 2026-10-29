import { Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { FilesModule } from '../files/files.module.js';
import { ChatController, ChatSupportController } from './chat.controller.js';
import { ChatRepository } from './chat.repository.js';
import { ChatService } from './chat.service.js';

// Notifications and realtime are global modules, so they need no import here.
@Module({
  imports: [AccessModule, FilesModule],
  controllers: [ChatController, ChatSupportController],
  providers: [ChatRepository, ChatService],
})
export class ChatModule {}
