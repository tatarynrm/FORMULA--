import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { JWT_ACCESS_STRATEGY } from '../strategies/jwt-access.strategy.js';

/** Protects a route with a valid access token (`Authorization: Bearer <token>`). */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_ACCESS_STRATEGY) {}
