import { ServiceUnavailableException } from '@nestjs/common';

import type { DatabaseService } from '../database/database.service.js';
import { HealthService } from './health.service.js';

function createService(databaseUp: boolean): HealthService {
  const database = { ping: async () => databaseUp } as unknown as DatabaseService;
  return new HealthService(database);
}

describe('HealthService', () => {
  it('returns ok when the database answers', async () => {
    const result = await createService(true).check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('up');
  });

  it('throws 503 when the database is down', async () => {
    await expect(createService(false).check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
