import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.js';
import type { ProfileService } from '../profile/profile.service.js';
import type { RealtimeService } from '../realtime/realtime.service.js';
import { MessengerChannel } from '../messengers/messenger.channel.js';
import { MessengerRegistry } from '../messengers/messenger-registry.service.js';
import type {
  MessengerAccount,
  MessengerPerson,
  MessengerProvider,
  OutgoingNotification,
  SendOutcome,
} from '../messengers/messenger.types.js';
import type { MessengersRepository } from '../messengers/messengers.repository.js';
import { MessengersService } from '../messengers/messengers.service.js';
import { TelegramBotService } from './telegram-bot.service.js';
import type { TelegramApi } from './telegram.api.js';
import { TelegramApiError } from './telegram.api.js';
import { TelegramProvider, formatNotification } from './telegram.provider.js';
import type { TelegramReplyMarkup, TelegramUpdate } from './telegram.types.js';

const USER_A = 'user-a';
const USER_B = 'user-b';
const IVAN = { id: 111, username: 'ivan_test' };
const OLHA = { id: 222, username: 'olha_test' };

/** The part of `messenger_accounts` and `messenger_link_tokens` the service needs, kept in memory. */
class FakeRepository {
  accounts: MessengerAccount[] = [];
  tokens = new Map<string, { userId: string; provider: string; expiresAt: number }>();
  now = 1_000_000;
  private counter = 0;

  async findByUser(userId: string, provider: string) {
    return this.accounts.find((a) => a.userId === userId && a.provider === provider) ?? null;
  }
  async findByExternal(provider: string, externalId: string) {
    return (
      this.accounts.find((a) => a.provider === provider && a.externalId === externalId) ?? null
    );
  }
  async findDeliverable(userId: string, provider: string) {
    const account = await this.findByUser(userId, provider);
    return account?.phoneVerifiedAt && account.notificationsEnabled ? account : null;
  }
  async createToken(userId: string, provider: string, hash: string, ttlMinutes: number) {
    for (const [key, token] of this.tokens) {
      if (token.userId === userId && token.provider === provider) this.tokens.delete(key);
    }
    const expiresAt = this.now + ttlMinutes * 60_000;
    this.tokens.set(hash, { userId, provider, expiresAt });
    return new Date(expiresAt);
  }
  async consumeToken(provider: string, hash: string) {
    const token = this.tokens.get(hash);
    if (!token || token.provider !== provider || token.expiresAt <= this.now) return null;
    this.tokens.delete(hash);
    return token.userId;
  }
  async connect(userId: string, provider: string, person: MessengerPerson) {
    const existing = await this.findByUser(userId, provider);
    const samePerson = existing?.externalId === person.externalId;
    const account: MessengerAccount = {
      id: existing?.id ?? `acc-${(this.counter += 1)}`,
      userId,
      provider: provider as 'telegram',
      externalId: person.externalId,
      chatId: person.chatId,
      username: person.username,
      phone: samePerson ? (existing?.phone ?? null) : null,
      phoneVerifiedAt: samePerson ? (existing?.phoneVerifiedAt ?? null) : null,
      notificationsEnabled: true,
      linkedAt: new Date(this.now),
    };
    this.accounts = [...this.accounts.filter((a) => a.id !== account.id), account];
    return account;
  }
  async confirmPhone(id: string, phone: string) {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) return null;
    Object.assign(account, {
      phone,
      phoneVerifiedAt: new Date(this.now),
      notificationsEnabled: true,
    });
    return account;
  }
  async setUsername(id: string, username: string | null) {
    const account = this.accounts.find((a) => a.id === id);
    if (account) account.username = username;
  }
  async setNotifications(id: string, enabled: boolean) {
    const account = this.accounts.find((a) => a.id === id);
    if (account) account.notificationsEnabled = enabled;
  }
  async remove(id: string) {
    this.accounts = this.accounts.filter((a) => a.id !== id);
  }
}

function createWorld(options: { configured?: boolean } = {}) {
  const repository = new FakeRepository();
  const registry = new MessengerRegistry();
  const sentToProvider: { account: MessengerAccount; message: OutgoingNotification }[] = [];
  let outcome: SendOutcome = 'sent';
  const provider: MessengerProvider = {
    name: 'telegram',
    configured: options.configured ?? true,
    botUsername: () => 'Formula_bot',
    linkUrl: (token) => `https://t.me/Formula_bot?start=${token}`,
    send: async (account, message) => {
      sentToProvider.push({ account, message });
      return outcome;
    },
    farewell: async () => undefined,
  };
  registry.register(provider);

  const events: { userId: string; type: string }[] = [];
  const realtime = {
    publishToUser: (userId: string, event: { type: string }) =>
      events.push({ userId, type: event.type }),
  } as unknown as RealtimeService;
  const fillPhone = vi.fn(async () => true);
  const profile = { fillPhoneIfEmpty: fillPhone } as unknown as ProfileService;

  const service = new MessengersService(
    repository as unknown as MessengersRepository,
    registry,
    realtime,
    profile,
  );

  const sent: { chatId: string; text: string; markup?: TelegramReplyMarkup }[] = [];
  const api = {
    sendMessage: async (chatId: string, text: string, markup?: TelegramReplyMarkup) => {
      sent.push({ chatId, text, ...(markup ? { markup } : {}) });
    },
  } as unknown as TelegramApi;
  const config = {
    get: (key: string) =>
      key === 'WEB_URL'
        ? 'https://formula.test'
        : key === 'CORS_ORIGINS'
          ? ['https://formula.test']
          : undefined,
  } as unknown as ConfigService<Env, true>;
  const bot = new TelegramBotService(api, service, config);
  const channel = new MessengerChannel(
    registry,
    repository as unknown as MessengersRepository,
    service,
    config,
  );

  let updateId = 0;
  const say = (text: string, from = IVAN, chatType: 'private' | 'group' = 'private') =>
    bot.handleUpdate({
      update_id: (updateId += 1),
      message: {
        message_id: updateId,
        from: { id: from.id, is_bot: false, first_name: 'X', username: from.username },
        chat: { id: from.id, type: chatType },
        text,
      },
    } satisfies TelegramUpdate);
  const shareContact = (phone: string, contactUserId: number | undefined, from = IVAN) =>
    bot.handleUpdate({
      update_id: (updateId += 1),
      message: {
        message_id: updateId,
        from: { id: from.id, is_bot: false, first_name: 'X', username: from.username },
        chat: { id: from.id, type: 'private' },
        contact: {
          phone_number: phone,
          first_name: 'X',
          ...(contactUserId !== undefined ? { user_id: contactUserId } : {}),
        },
      },
    } satisfies TelegramUpdate);

  /** The site side: the person asks for a link; the token is the part after `start=`. */
  const linkFor = async (userId: string) =>
    (await service.createLink(userId, 'telegram')).url.split('start=')[1] as string;

  return {
    bot,
    repository,
    service,
    channel,
    events,
    sent,
    sentToProvider,
    fillPhone,
    say,
    shareContact,
    linkFor,
    setOutcome: (next: SendOutcome) => (outcome = next),
    last: () => sent.at(-1),
  };
}

const NOTIFICATION = {
  id: 'n1',
  type: 'news' as const,
  title: 'Нова новина',
  body: 'Додали теми',
  link: '/cabinet',
  data: {},
  readAt: null,
  createdAt: new Date(0).toISOString(),
};

describe('connecting Telegram from the site', () => {
  it('gives a one-time link with the bot name and keeps only a hash of the token', async () => {
    const world = createWorld();
    const link = await world.service.createLink(USER_A, 'telegram');
    expect(link.url).toMatch(/^https:\/\/t\.me\/Formula_bot\?start=[\w-]{20,}$/);
    const token = link.url.split('start=')[1] as string;
    expect([...world.repository.tokens.keys()]).not.toContain(token);
    expect(new Date(link.expiresAt).getTime()).toBe(world.repository.now + 15 * 60_000);
  });

  it('says the bot is not set up when it has no token', async () => {
    const world = createWorld({ configured: false });
    await expect(world.service.createLink(USER_A, 'telegram')).rejects.toMatchObject({
      status: 503,
    });
    expect(await world.service.getStatus(USER_A, 'telegram')).toMatchObject({
      configured: false,
      linked: false,
    });
  });

  it('knows no other messenger', async () => {
    await expect(createWorld().service.getStatus(USER_A, 'icq')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('a new link replaces the previous one', async () => {
    const world = createWorld();
    const first = await world.linkFor(USER_A);
    const second = await world.linkFor(USER_A);
    await world.say(`/start ${first}`);
    expect(world.last()?.text).toContain('застаріло');
    await world.say(`/start ${second}`);
    expect(world.last()?.markup).toMatchObject({ keyboard: [[{ request_contact: true }]] });
  });
});

describe('the bot: the link and the mandatory phone number', () => {
  it('ties the chat to the account, then insists on the phone', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);

    expect(world.last()?.text).toContain('обов’язково');
    expect(world.last()?.markup).toMatchObject({
      keyboard: [[{ request_contact: true }]],
      one_time_keyboard: true,
    });
    const status = await world.service.getStatus(USER_A, 'telegram');
    expect(status).toMatchObject({
      linked: true,
      awaitingPhone: true,
      username: 'ivan_test',
      phone: null,
    });

    // Anything else it hears keeps asking: the number is not optional.
    await world.say('привіт');
    expect(world.last()?.text).toContain('потрібен ваш номер');
    expect(world.last()?.markup).toMatchObject({ keyboard: [[{ request_contact: true }]] });
  });

  it('sends nothing until the phone is shared', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);
    await world.channel.deliver(USER_A, NOTIFICATION);
    await new Promise((resolve) => setImmediate(resolve));
    expect(world.sentToProvider).toHaveLength(0);
  });

  it('takes the number only when it is the person’s own', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);

    await world.shareContact('380671112233', OLHA.id); // somebody else's contact
    expect(world.last()?.text).toContain('власний номер');
    await world.shareContact('380671112233', undefined); // a contact that is not on Telegram
    expect(world.last()?.text).toContain('власний номер');
    expect((await world.service.getStatus(USER_A, 'telegram')).awaitingPhone).toBe(true);

    await world.shareContact('380989385585', IVAN.id);
    expect(world.last()?.text).toContain('Готово');
    expect(world.last()?.markup).toEqual({ remove_keyboard: true });
    expect(await world.service.getStatus(USER_A, 'telegram')).toMatchObject({
      linked: true,
      awaitingPhone: false,
      phone: '+380 98 938 55 85',
      notificationsEnabled: true,
    });
  });

  it('fills the profile phone with a Ukrainian number, and keeps a foreign one only in the bot', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);
    await world.shareContact('+380989385585', IVAN.id);
    expect(world.fillPhone).toHaveBeenCalledWith(USER_A, '+380 98 938 55 85');

    const foreign = createWorld();
    await foreign.say(`/start ${await foreign.linkFor(USER_B)}`);
    await foreign.shareContact('48123456789', IVAN.id);
    expect(foreign.fillPhone).not.toHaveBeenCalled();
    expect((await foreign.service.getStatus(USER_B, 'telegram')).phone).toBe('+48123456789');
  });

  it('tells the open tabs of the person about each step', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);
    await world.shareContact('380989385585', IVAN.id);
    expect(
      world.events.filter((e) => e.userId === USER_A && e.type === 'messenger.updated'),
    ).toHaveLength(2);
  });

  it('a link works once and only while it is fresh', async () => {
    const world = createWorld();
    const token = await world.linkFor(USER_A);
    await world.say(`/start ${token}`);
    await world.say(`/start ${token}`, OLHA);
    expect(world.last()?.text).toContain('застаріло');

    const stale = await world.linkFor(USER_B);
    world.repository.now += 16 * 60_000;
    await world.say(`/start ${stale}`, OLHA);
    expect(world.last()?.text).toContain('застаріло');
  });

  it('refuses a person who is already connected to another account', async () => {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);
    await world.shareContact('380989385585', IVAN.id);

    await world.say(`/start ${await world.linkFor(USER_B)}`); // the same Telegram, another account
    expect(world.last()?.text).toContain('уже підключено до іншого акаунту');
    expect(await world.service.getStatus(USER_B, 'telegram')).toMatchObject({ linked: false });
  });

  it('a person who has no link is pointed to the profile', async () => {
    const world = createWorld();
    await world.say('/start');
    expect(world.last()?.text).toContain('https://formula.test/cabinet/profile');
    await world.shareContact('380989385585', IVAN.id);
    expect(world.last()?.text).toContain('https://formula.test/cabinet/profile');
  });

  it('ignores groups, bots and updates without a message', async () => {
    const world = createWorld();
    await world.say('/start x', IVAN, 'group');
    await world.say('/help', IVAN, 'group');
    await world.bot.handleUpdate({ update_id: 99 });
    await world.bot.handleUpdate({
      update_id: 100,
      message: {
        message_id: 1,
        from: { id: 5, is_bot: true, first_name: 'Bot' },
        chat: { id: 5, type: 'private' },
        text: '/start',
      },
    });
    expect(world.sent).toHaveLength(0);
  });
});

describe('notifications in Telegram', () => {
  async function connected() {
    const world = createWorld();
    await world.say(`/start ${await world.linkFor(USER_A)}`);
    await world.shareContact('380989385585', IVAN.id);
    world.sent.length = 0;
    return world;
  }
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  it('delivers to the person who finished connecting', async () => {
    const world = await connected();
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(1);
    expect(world.sentToProvider[0]?.message).toEqual({
      title: 'Нова новина',
      body: 'Додали теми',
      url: 'https://formula.test/cabinet',
    });
    await world.channel.deliver('nobody', NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(1);
  });

  it('/stop switches it off and /start back on', async () => {
    const world = await connected();
    await world.say('/stop');
    expect(world.last()?.text).toContain('вимкнено');
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(0);

    await world.say('/start');
    expect(world.last()?.text).toContain('знову увімкнено');
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(1);
  });

  it('can be switched from the site, and the person can disconnect', async () => {
    const world = await connected();
    expect(
      (await world.service.setNotifications(USER_A, 'telegram', false)).notificationsEnabled,
    ).toBe(false);
    expect(await world.service.unlink(USER_A, 'telegram')).toMatchObject({
      linked: false,
      phone: null,
    });
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(0);
  });

  it('stops writing to a person who blocked the bot', async () => {
    const world = await connected();
    world.setOutcome('blocked');
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    await flush();
    expect((await world.service.getStatus(USER_A, 'telegram')).notificationsEnabled).toBe(false);
  });

  it('a bot without a token delivers nothing', async () => {
    const world = createWorld({ configured: false });
    world.repository.accounts.push({
      id: 'a',
      userId: USER_A,
      provider: 'telegram',
      externalId: '1',
      chatId: '1',
      username: null,
      phone: '+380 98 938 55 85',
      phoneVerifiedAt: new Date(),
      notificationsEnabled: true,
      linkedAt: new Date(),
    });
    await world.channel.deliver(USER_A, NOTIFICATION);
    await flush();
    expect(world.sentToProvider).toHaveLength(0);
  });
});

describe('TelegramProvider', () => {
  function makeProvider(error?: Error) {
    const api = {
      configured: true,
      sendMessage: vi.fn(async () => {
        if (error) throw error;
      }),
    } as unknown as TelegramApi;
    const config = { get: () => undefined } as unknown as ConfigService<Env, true>;
    return new TelegramProvider(api, new MessengerRegistry(), config);
  }
  const account = { chatId: '42' } as MessengerAccount;
  const message: OutgoingNotification = { title: 'T', body: 'B', url: null };

  it('builds the link only when the bot name is known', () => {
    const provider = makeProvider();
    expect(provider.linkUrl('abc')).toBeNull();
    provider.setBotUsername('Formula_bot');
    expect(provider.linkUrl('abc')).toBe('https://t.me/Formula_bot?start=abc');
  });

  it('tells blocked from a hiccup', async () => {
    expect(await makeProvider().send(account, message)).toBe('sent');
    expect(
      await makeProvider(new TelegramApiError(403, 'Forbidden: bot was blocked by the user')).send(
        account,
        message,
      ),
    ).toBe('blocked');
    expect(
      await makeProvider(new TelegramApiError(400, 'Bad Request: chat not found')).send(
        account,
        message,
      ),
    ).toBe('blocked');
    expect(await makeProvider(new TelegramApiError(500, 'oops')).send(account, message)).toBe(
      'failed',
    );
    expect(await makeProvider(new TelegramApiError(0, 'timeout')).send(account, message)).toBe(
      'failed',
    );
  });

  it('writes the title, the text and the link', () => {
    expect(formatNotification({ title: 'T', body: 'B', url: 'https://x.test/a' })).toBe(
      'T\nB\n\nhttps://x.test/a',
    );
    expect(formatNotification({ title: 'T', body: '', url: null })).toBe('T');
  });
});
