import { ERROR_CODES, type HealthStatus } from '@formula/shared';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  async check(): Promise<HealthStatus> {
    const databaseUp = await this.database.ping();

    if (!databaseUp) {
      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Database is unavailable',
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: { database: 'up' },
    };
  }
}
