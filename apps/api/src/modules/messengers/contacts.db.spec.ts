import type { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Env } from '../../config/env.js';
import { DatabaseService } from '../database/database.service.js';
import { ProfileRepository } from '../profile/profile.repository.js';
import { MessengersRepository } from './messengers.repository.js';

/**
 * The SQL of the messenger links and of the profile contacts, against a REAL PostgreSQL (the dev
 * database of `docker compose`). It runs when `DATABASE_URL` is set, e.g.
 * `node --env-file=.env ../../node_modules/vitest/vitest.mjs run src/modules/messengers`,
 * and cleans up the two users it creates.
 */
const url = process.env['DATABASE_URL'];

describe.skipIf(!url)('messenger links and profile contacts (real database)', () => {
  const stamp = Date.now().toString(36);
  let database: DatabaseService;
  let messengers: MessengersRepository;
  let profiles: ProfileRepository;
  let userA = '';
  let userB = '';

  beforeAll(async () => {
    database = new DatabaseService({ get: () => url } as unknown as ConfigService<Env, true>);
    messengers = new MessengersRepository(database);
    profiles = new ProfileRepository(database);
    for (const label of ['a', 'b']) {
      const row = await database.queryOne<{ id: string }>(
        `INSERT INTO users (email, name, surname) VALUES ($1, 'Test', 'Contacts') RETURNING id`,
        [`contacts.${label}.${stamp}@example.com`],
      );
      if (label === 'a') userA = (row as { id: string }).id;
      else userB = (row as { id: string }).id;
    }
  });

  afterAll(async () => {
    await database.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[userA, userB]]);
    await database.onModuleDestroy();
  });

  const person = (id: string) => ({ externalId: id, chatId: id, username: `nick_${id}` });

  describe('one-time links', () => {
    it('work once, and a new link replaces the old one', async () => {
      const first = await messengers.createToken(userA, 'telegram', `hash-1-${stamp}`, 15);
      expect(first.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
      await messengers.createToken(userA, 'telegram', `hash-2-${stamp}`, 15);

      expect(await messengers.consumeToken('telegram', `hash-1-${stamp}`)).toBeNull();
      expect(await messengers.consumeToken('telegram', `hash-2-${stamp}`)).toBe(userA);
      expect(await messengers.consumeToken('telegram', `hash-2-${stamp}`)).toBeNull();
    });

    it('do not work after they expire', async () => {
      await database.query(
        `INSERT INTO messenger_link_tokens (token_hash, user_id, provider, expires_at)
         VALUES ($1, $2, 'telegram', now() - interval '1 minute')`,
        [`old-${stamp}`, userA],
      );
      expect(await messengers.consumeToken('telegram', `old-${stamp}`)).toBeNull();
    });
  });

  describe('accounts', () => {
    const external = `9${stamp.replace(/\D/g, '').padEnd(8, '1').slice(0, 8)}`;

    it('start unverified and receive nothing until the phone is confirmed', async () => {
      const account = await messengers.connect(userA, 'telegram', person(external));
      expect(account).toMatchObject({ userId: userA, phone: null, phoneVerifiedAt: null });
      expect(await messengers.findDeliverable(userA, 'telegram')).toBeNull();

      const confirmed = await messengers.confirmPhone(account.id, '+380 98 938 55 85');
      expect(confirmed?.phoneVerifiedAt).not.toBeNull();
      expect((await messengers.findDeliverable(userA, 'telegram'))?.phone).toBe(
        '+380 98 938 55 85',
      );

      await messengers.setNotifications(account.id, false);
      expect(await messengers.findDeliverable(userA, 'telegram')).toBeNull();
    });

    it('the same person coming back keeps the verified phone, another person starts over', async () => {
      const again = await messengers.connect(userA, 'telegram', person(external));
      expect(again.phoneVerifiedAt).not.toBeNull();
      expect(again.notificationsEnabled).toBe(true);

      const other = await messengers.connect(userA, 'telegram', person(`${external}9`));
      expect(other).toMatchObject({
        phone: null,
        phoneVerifiedAt: null,
        externalId: `${external}9`,
      });
      expect((await messengers.findByUser(userA, 'telegram'))?.externalId).toBe(`${external}9`);
    });

    it('a person in a messenger cannot belong to two accounts', async () => {
      await expect(
        messengers.connect(userB, 'telegram', person(`${external}9`)),
      ).rejects.toMatchObject({
        code: '23505',
      });
      expect((await messengers.findByExternal('telegram', `${external}9`))?.userId).toBe(userA);
    });

    it('can be removed', async () => {
      const account = await messengers.findByUser(userA, 'telegram');
      await messengers.remove((account as { id: string }).id);
      expect(await messengers.findByUser(userA, 'telegram')).toBeNull();
    });
  });

  describe('the contacts of a profile', () => {
    it('keep a phone and the list of messengers, and replace the list as a whole', async () => {
      await profiles.upsert(userB, { phone: '+380 50 123 45 67' });
      await profiles.replaceMessengers(userB, [
        { kind: 'viber', username: null },
        { kind: 'telegram', username: 'my_nick' },
      ]);
      expect(await profiles.findByUserId(userB)).toMatchObject({
        phone: '+380 50 123 45 67',
        messengers: [
          { kind: 'telegram', username: 'my_nick' },
          { kind: 'viber', username: null },
        ],
      });

      await profiles.replaceMessengers(userB, [{ kind: 'whatsapp', username: null }]);
      expect((await profiles.findByUserId(userB)).messengers).toEqual([
        { kind: 'whatsapp', username: null },
      ]);
      // A save that does not mention the phone leaves it alone; null removes it.
      expect((await profiles.upsert(userB, { statusCode: null })).phone).toBe('+380 50 123 45 67');
      expect((await profiles.upsert(userB, { phone: null })).phone).toBeNull();
    });

    it('fill an empty phone only', async () => {
      expect(await profiles.fillPhoneIfEmpty(userB, '+380 98 938 55 85')).toBe(true);
      expect(await profiles.fillPhoneIfEmpty(userB, '+380 67 111 22 33')).toBe(false);
      expect((await profiles.findByUserId(userB)).phone).toBe('+380 98 938 55 85');
    });

    it('refuse a phone that is not written as +380 98 938 55 85', async () => {
      await expect(profiles.upsert(userB, { phone: '0989385585' })).rejects.toMatchObject({
        code: '23514',
      });
    });
  });
});
