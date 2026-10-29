import { createHash, randomBytes } from 'node:crypto';

import {
  ERROR_CODES,
  MESSENGER_LINK,
  type MessengerBot,
  type MessengerBotLink,
  type MessengerBotStatus,
  normalizeUkrainianPhone,
} from '@formula/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ProfileService } from '../profile/profile.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { MessengerRegistry } from './messenger-registry.service.js';
import type {
  AcceptLinkResult,
  MessengerAccount,
  MessengerPerson,
  MessengerProvider,
} from './messenger.types.js';
import { MessengersRepository } from './messengers.repository.js';

/** The token is a secret: only its hash is stored, so a leaked table cannot connect anyone. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Connecting a messenger bot to an account. Two sides use it: the website (the signed-in person
 * asks for a link, looks at the status, switches notifications or disconnects) and the bot itself
 * (it receives the link, then the phone number). Everything provider-specific stays in the
 * provider; this service works for every messenger.
 */
@Injectable()
export class MessengersService {
  constructor(
    private readonly repository: MessengersRepository,
    private readonly registry: MessengerRegistry,
    private readonly realtime: RealtimeService,
    private readonly profile: ProfileService,
  ) {}

  // ---- The website side ----

  async getStatus(userId: string, providerName: string): Promise<MessengerBotStatus> {
    const provider = this.requireProvider(providerName);
    return this.statusOf(provider, await this.repository.findByUser(userId, provider.name));
  }

  /** A one-time address that opens the bot with the token; the bot then ties the chat to the account. */
  async createLink(userId: string, providerName: string): Promise<MessengerBotLink> {
    const provider = this.requireProvider(providerName);
    if (!provider.configured || !provider.botUsername()) {
      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'The bot is not set up yet',
      });
    }

    const existing = await this.repository.findByUser(userId, provider.name);
    if (existing?.phoneVerifiedAt) {
      throw new ConflictException({
        code: ERROR_CODES.CONFLICT,
        message: 'This messenger is already connected: disconnect it first',
      });
    }

    const token = randomBytes(24).toString('base64url');
    const expiresAt = await this.repository.createToken(
      userId,
      provider.name,
      hashToken(token),
      MESSENGER_LINK.TOKEN_TTL_MINUTES,
    );
    const url = provider.linkUrl(token);
    if (!url) {
      throw new ServiceUnavailableException({
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'The bot is not set up yet',
      });
    }
    return { url, expiresAt: expiresAt.toISOString() };
  }

  async unlink(userId: string, providerName: string): Promise<MessengerBotStatus> {
    const provider = this.requireProvider(providerName);
    const account = await this.repository.findByUser(userId, provider.name);
    if (account) {
      await this.repository.remove(account.id);
      await provider.farewell(account);
      this.announce(userId, provider.name);
    }
    return this.statusOf(provider, null);
  }

  async setNotifications(
    userId: string,
    providerName: string,
    enabled: boolean,
  ): Promise<MessengerBotStatus> {
    const provider = this.requireProvider(providerName);
    const account = await this.repository.findByUser(userId, provider.name);
    if (!account) throw new NotFoundException('This messenger is not connected');
    await this.repository.setNotifications(account.id, enabled);
    this.announce(userId, provider.name);
    return this.statusOf(provider, { ...account, notificationsEnabled: enabled });
  }

  // ---- The bot side ----

  /** The person in the messenger presented a connection link. */
  async acceptLinkToken(
    provider: MessengerBot,
    token: string,
    person: MessengerPerson,
  ): Promise<AcceptLinkResult> {
    const userId = await this.repository.consumeToken(provider, hashToken(token));
    if (!userId) return { ok: false, reason: 'invalid' };

    // One person in a messenger belongs to one account.
    const taken = await this.repository.findByExternal(provider, person.externalId);
    if (taken && taken.userId !== userId) return { ok: false, reason: 'taken' };

    const account = await this.repository.connect(userId, provider, person);
    this.announce(userId, provider);
    return { ok: true, account, alreadyVerified: account.phoneVerifiedAt !== null };
  }

  findByExternal(provider: MessengerBot, externalId: string): Promise<MessengerAccount | null> {
    return this.repository.findByExternal(provider, externalId);
  }

  /**
   * The person shared their own number in the bot: the link is complete and notifications start.
   * A Ukrainian number also fills the phone of the profile when that is empty.
   */
  async confirmPhone(account: MessengerAccount, rawPhone: string): Promise<MessengerAccount> {
    const digits = rawPhone.replace(/\D/g, '');
    const ukrainian = normalizeUkrainianPhone(digits);
    // A foreign number is kept in the international form.
    const phone = ukrainian ?? `+${digits}`;

    const confirmed = (await this.repository.confirmPhone(account.id, phone)) ?? account;
    if (ukrainian) await this.profile.fillPhoneIfEmpty(account.userId, ukrainian);
    this.announce(account.userId, account.provider);
    return confirmed;
  }

  async setNotificationsFor(account: MessengerAccount, enabled: boolean): Promise<void> {
    await this.repository.setNotifications(account.id, enabled);
    this.announce(account.userId, account.provider);
  }

  async refreshUsername(account: MessengerAccount, username: string | null): Promise<void> {
    if (account.username === username) return;
    await this.repository.setUsername(account.id, username);
    this.announce(account.userId, account.provider);
  }

  /** The person stopped the bot: it must not keep writing, and the site shows it. */
  async markBlocked(account: MessengerAccount): Promise<void> {
    await this.setNotificationsFor(account, false);
  }

  // ---- helpers ----

  private requireProvider(name: string): MessengerProvider {
    const provider = this.registry.get(name);
    if (!provider) throw new NotFoundException('Unknown messenger');
    return provider;
  }

  private statusOf(
    provider: MessengerProvider,
    account: MessengerAccount | null,
  ): MessengerBotStatus {
    return {
      provider: provider.name,
      configured: provider.configured && provider.botUsername() !== null,
      botUsername: provider.botUsername(),
      linked: account !== null,
      awaitingPhone: account !== null && account.phoneVerifiedAt === null,
      username: account?.username ?? null,
      phone: account?.phone ?? null,
      notificationsEnabled: account?.notificationsEnabled ?? false,
      linkedAt: account?.linkedAt.toISOString() ?? null,
    };
  }

  /** Every open tab of this user reloads the status of the bot. */
  private announce(userId: string, provider: MessengerBot): void {
    this.realtime.publishToUser(userId, { type: 'messenger.updated', provider });
  }
}
