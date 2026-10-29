import { Module } from '@nestjs/common';

import { ProfileModule } from '../profile/profile.module.js';
import { MessengerChannel } from './messenger.channel.js';
import { MessengerRegistry } from './messenger-registry.service.js';
import { MessengersController } from './messengers.controller.js';
import { MessengersRepository } from './messengers.repository.js';
import { MessengersService } from './messengers.service.js';

/**
 * Messenger bots (Telegram first): who is connected, one-time links, and delivery of
 * notifications. A provider module (see `TelegramModule`) registers itself in `MessengerRegistry`.
 */
@Module({
  imports: [ProfileModule],
  controllers: [MessengersController],
  providers: [MessengersRepository, MessengerRegistry, MessengersService, MessengerChannel],
  exports: [MessengerRegistry, MessengersService, MessengerChannel],
})
export class MessengersModule {}
