import { Global, Module } from '@nestjs/common';

import { AccessModule } from '../access/access.module.js';
import { RealtimeController } from './realtime.controller.js';
import { RealtimeService } from './realtime.service.js';

/** Global: any service may push live events without importing the module. */
@Global()
@Module({
  imports: [AccessModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
