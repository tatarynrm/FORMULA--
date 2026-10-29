import { chat } from './chat';
import { consent } from './consent';
import { contacts } from './contacts';
import { notifications } from './notifications';
import { testimonials } from './testimonials';
import { uk } from './uk';

/**
 * Single active dictionary. Swap this for a locale lookup when i18n is introduced.
 * Feature dictionaries that live in their own file register here, one line each.
 */
export const t = { ...uk, notifications, chat, contacts, testimonials, consent } as const;

export type Dictionary = typeof t;
