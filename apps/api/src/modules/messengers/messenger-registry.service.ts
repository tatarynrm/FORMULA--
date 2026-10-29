import type { MessengerBot } from '@formula/shared';
import { Injectable } from '@nestjs/common';

import type { MessengerProvider } from './messenger.types.js';

/** Where the messenger providers meet: each one registers itself, the rest looks them up by name. */
@Injectable()
export class MessengerRegistry {
  private readonly providers = new Map<MessengerBot, MessengerProvider>();

  register(provider: MessengerProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): MessengerProvider | undefined {
    return this.providers.get(name as MessengerBot);
  }

  all(): MessengerProvider[] {
    return [...this.providers.values()];
  }
}
