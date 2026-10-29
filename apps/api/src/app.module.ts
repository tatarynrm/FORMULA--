import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { createUserAwareTracker } from './common/throttle/user-tracker.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';
import { type Env, validateEnv } from './config/env.js';
import { AccessModule } from './modules/access/access.module.js';
import { AttemptsModule } from './modules/attempts/attempts.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { MessengersModule } from './modules/messengers/messengers.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { PresenceModule } from './modules/presence/presence.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { StaffModule } from './modules/staff/staff.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { TelegramModule } from './modules/telegram/telegram.module.js';
import { TestimonialsModule } from './modules/testimonials/testimonials.module.js';
import { TestsModule } from './modules/tests/tests.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_LIMIT', { infer: true }),
          },
        ],
        // Signed-in users get their own bucket, so one busy school IP cannot block a classroom.
        getTracker: createUserAwareTracker(config.get('JWT_ACCESS_SECRET', { infer: true })),
      }),
    }),
    DatabaseModule,
    HealthModule,
    AccessModule,
    AttemptsModule,
    AuthModule,
    CatalogModule,
    ChatModule,
    FilesModule,
    MenuModule,
    MessengersModule,
    NotificationsModule,
    ProfileModule,
    PresenceModule,
    ProgressModule,
    RealtimeModule,
    RedisModule,
    StaffModule,
    StudentsModule,
    TelegramModule,
    TestimonialsModule,
    TestsModule,
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
