import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { PresenceInterceptor } from './presence.interceptor.js';
import { PresenceRepository } from './presence.repository.js';
import { PresenceService } from './presence.service.js';

@Module({
  providers: [
    PresenceRepository,
    PresenceService,
    { provide: APP_INTERCEPTOR, useClass: PresenceInterceptor },
  ],
  exports: [PresenceService],
})
export class PresenceModule {}
