import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccessModule } from '../access/access.module.js';
import { PresenceModule } from '../presence/presence.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthCookiesService } from './auth-cookies.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleAuthService } from './google-auth.service.js';
import { PasswordService } from './password.service.js';
import { RefreshTokensRepository } from './refresh-tokens.repository.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

@Module({
  imports: [PassportModule, JwtModule.register({}), AccessModule, PresenceModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookiesService,
    GoogleAuthService,
    PasswordService,
    RefreshTokensRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
