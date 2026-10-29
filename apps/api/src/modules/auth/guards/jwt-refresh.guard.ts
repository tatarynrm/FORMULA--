import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { JWT_REFRESH_STRATEGY } from '../strategies/jwt-refresh.strategy.js';

/** Protects the refresh endpoint with a valid refresh token sent in the request body. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard(JWT_REFRESH_STRATEGY) {}
