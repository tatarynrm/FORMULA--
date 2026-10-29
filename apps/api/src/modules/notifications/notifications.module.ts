import { Global, Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { MessengerChannel } from '../messengers/messenger.channel.js';
import { MessengersModule } from '../messengers/messengers.module.js';
import { InAppChannel, NOTIFICATION_CHANNELS } from './notification-channels.js';
import { NewsAdminController, NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

/**
 * Global: attempts, catalog and chat notify without importing the module. A new channel (Telegram,
 * email) is one more provider in the `NOTIFICATION_CHANNELS` list.
 */
@Global()
@Module({
  imports: [AccessModule, MessengersModule],
  controllers: [NotificationsController, NewsAdminController],
  providers: [
    NotificationsRepository,
    InAppChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (inApp: InAppChannel, messengers: MessengerChannel) => [inApp, messengers],
      inject: [InAppChannel, MessengerChannel],
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
