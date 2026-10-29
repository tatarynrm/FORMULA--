import type { HealthStatus } from '@formula/shared';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { HealthService } from './health.service.js';

/** Version-neutral on purpose: served at `/api/health` for load balancers and monitoring. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness and database connectivity check' })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
