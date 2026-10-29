import { PRESENCE } from '@formula/shared';

import type { PresenceRepository } from './presence.repository.js';
import { PresenceService } from './presence.service.js';
import type { RedisService } from '../redis/redis.service.js';

/** Just enough of ioredis for the service: `set` with EX/NX, `mget`, `del`. */
class FakeRedis {
  readonly store = new Map<string, string>();

  async set(key: string, value: string, _ex: string, _seconds: number, nx?: string) {
    if (nx === 'NX' && this.store.has(key)) return null;
    this.store.set(key, value);
    return 'OK';
  }

  async mget(keys: string[]) {
    return keys.map((key) => this.store.get(key) ?? null);
  }

  readonly online = new Map<string, number>();

  async zadd(_set: string, score: number, member: string) {
    this.online.set(member, score);
    return 1;
  }

  async zrem(_set: string, member: string) {
    return this.online.delete(member) ? 1 : 0;
  }

  async zremrangebyscore(_set: string, _min: string, max: number) {
    for (const [member, score] of this.online) if (score < max) this.online.delete(member);
    return 0;
  }

  async zrange() {
    return [...this.online.keys()];
  }

  async del(...keys: string[]) {
    for (const key of keys) this.store.delete(key);
    return keys.length;
  }
}

class FakeRepository {
  writes: string[] = [];
  lastSeen = new Map<string, Date | null>();

  async markSeen(userId: string) {
    this.writes.push(userId);
    this.lastSeen.set(userId, new Date());
  }

  async findLastSeen(userIds: string[]) {
    return new Map(userIds.map((id) => [id, this.lastSeen.get(id) ?? null]));
  }

  async findSessions() {
    return [];
  }

  async countActiveDays() {
    return 0;
  }
}

function createService(withRedis: boolean) {
  const redis = withRedis ? new FakeRedis() : null;
  const repository = new FakeRepository();
  const service = new PresenceService(
    { client: redis } as unknown as RedisService,
    repository as unknown as PresenceRepository,
  );
  return { service, redis, repository };
}

describe('PresenceService', () => {
  it('marks a user online and writes the database only once per minute', async () => {
    const { service, repository } = createService(true);

    await service.touch('u1');
    await service.touch('u1');
    await service.touch('u1');

    expect(repository.writes).toEqual(['u1']);
    const presence = await service.getMany(['u1', 'u2']);
    expect(presence.get('u1')).toMatchObject({ online: true });
    expect(presence.get('u2')).toEqual({ online: false, lastSeenAt: null });
  });

  it('lists who is online', async () => {
    const { service } = createService(true);
    await service.touch('u1');
    await service.touch('u2');
    await service.leave('u2');

    expect(await service.listOnlineIds()).toEqual(['u1']);
    expect(await createService(false).service.listOnlineIds()).toBeNull();
  });

  it('takes the user offline on sign-out', async () => {
    const { service, redis } = createService(true);
    await service.touch('u1');
    expect(redis?.store.has('presence:seen:u1')).toBe(true);

    await service.leave('u1');

    expect(redis?.store.has('presence:seen:u1')).toBe(false);
  });

  it('works on the database alone when Redis is away', async () => {
    const { service, repository } = createService(false);

    await service.touch('u1');
    await service.touch('u1');

    expect(repository.writes).toEqual(['u1']);
    expect((await service.getMany(['u1'])).get('u1')?.online).toBe(true);

    await service.leave('u1');
    expect((await service.getMany(['u1'])).get('u1')?.online).toBe(false);
    await service.touch('u1');
    expect((await service.getMany(['u1'])).get('u1')?.online).toBe(true);
  });

  it('is offline right after sign-out even though the last request was a moment ago', async () => {
    const { service } = createService(true);
    await service.touch('u1');
    await service.leave('u1');

    const presence = (await service.getMany(['u1'])).get('u1');
    expect(presence?.online).toBe(false);
    expect(presence?.lastSeenAt).not.toBeNull();
  });

  it('treats an old last request as offline', async () => {
    const { service, repository } = createService(false);
    repository.lastSeen.set(
      'u1',
      new Date(Date.now() - (PRESENCE.ONLINE_WINDOW_SECONDS + 60) * 1000),
    );

    const presence = (await service.getMany(['u1'])).get('u1');
    expect(presence?.online).toBe(false);
    expect(presence?.lastSeenAt).not.toBeNull();
  });
});
