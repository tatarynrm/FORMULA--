import { z } from 'zod';

import {
  ACTIVE_OPTIONAL,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
  COOKIE_CATALOG,
  type OptionalCategory,
} from './constants';

/**
 * The visitor's choice, kept in a first-party cookie (not localStorage) so it survives like any
 * other cookie and could be read on the server later. `c` holds one yes/no per optional category.
 */
const recordSchema = z.object({
  /** `CONSENT_VERSION` at the time of the choice. */
  v: z.number(),
  /** When the choice was made, ms since the epoch. */
  t: z.number(),
  c: z.record(z.string(), z.boolean()),
});

export type ConsentRecord = z.infer<typeof recordSchema>;

export interface ConsentSnapshot {
  /** `false` on the server and during hydration: the banner must not flash for people who chose. */
  ready: boolean;
  record: ConsentRecord | null;
  /** A choice exists, is not older than the limit, has the current version and covers every category. */
  decided: boolean;
  settingsOpen: boolean;
}

export const SERVER_SNAPSHOT: ConsentSnapshot = {
  ready: false,
  record: null,
  decided: false,
  settingsOpen: false,
};

const DAY_MS = 86_400_000;

let settingsOpen = false;
let current: ConsentSnapshot = SERVER_SNAPSHOT;
let cachedRaw: string | undefined;
let cachedRecord: ConsentRecord | null = null;
const listeners = new Set<() => void>();

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

/** Parses the cookie once per distinct value, so React gets the same object back while nothing changed. */
function readRecord(): ConsentRecord | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (raw === cachedRaw) return cachedRecord;
  cachedRaw = raw;
  cachedRecord = null;
  if (raw) {
    try {
      const parsed = recordSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
      if (parsed.success) cachedRecord = parsed.data;
    } catch {
      // A broken cookie is the same as no cookie: the visitor is asked again.
    }
  }
  return cachedRecord;
}

function isUsable(record: ConsentRecord | null): record is ConsentRecord {
  if (!record || record.v !== CONSENT_VERSION) return false;
  if (Date.now() - record.t > CONSENT_MAX_AGE_DAYS * DAY_MS) return false;
  // A category added after the choice was made has to be asked about.
  return ACTIVE_OPTIONAL.every((category) => category in record.c);
}

export function getSnapshot(): ConsentSnapshot {
  const record = readRecord();
  const decided = isUsable(record);
  if (
    current.ready &&
    current.record === record &&
    current.decided === decided &&
    current.settingsOpen === settingsOpen
  ) {
    return current;
  }
  current = { ready: true, record, decided, settingsOpen };
  return current;
}

function notify(): void {
  for (const listener of listeners) listener();
}

let watching = false;

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!watching && typeof window !== 'undefined') {
    watching = true;
    // A choice made in another tab shows up here when the visitor comes back to this one.
    window.addEventListener('focus', notify);
    document.addEventListener('visibilitychange', notify);
  }
  return () => {
    listeners.delete(listener);
  };
}

function writeRecord(record: ConsentRecord): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}` +
    `; Max-Age=${CONSENT_MAX_AGE_DAYS * 86_400}; Path=/; SameSite=Lax${secure}`;
}

/** Removes a cookie on this host and on every parent domain it could have been set for. */
function expireCookie(name: string): void {
  const host = window.location.hostname;
  const labels = host.split('.');
  const domains = new Set<string | undefined>([undefined, host]);
  for (let index = 0; index < labels.length - 1; index += 1) {
    domains.add(`.${labels.slice(index).join('.')}`);
  }
  for (const domain of domains) {
    document.cookie =
      `${name}=; Max-Age=0; Path=/; SameSite=Lax` + (domain ? `; Domain=${domain}` : '');
  }
}

/** What the visitor refused must not stay in the browser from an earlier "yes". */
function purgeRefused(choices: Record<string, boolean>): void {
  for (const item of COOKIE_CATALOG) {
    if (item.category === 'necessary' || choices[item.category]) continue;
    if (item.storage === 'cookie') expireCookie(item.id);
    else window.localStorage.removeItem(item.id);
  }
}

/** Stores the choice. Categories that are not listed count as refused. */
export function saveConsent(choices: Partial<Record<OptionalCategory, boolean>>): void {
  const answers: Record<string, boolean> = {};
  for (const category of ACTIVE_OPTIONAL) answers[category] = choices[category] === true;
  writeRecord({ v: CONSENT_VERSION, t: Date.now(), c: answers });
  purgeRefused(answers);
  settingsOpen = false;
  notify();
}

export function acceptAll(): void {
  saveConsent(Object.fromEntries(ACTIVE_OPTIONAL.map((category) => [category, true])));
}

export function rejectOptional(): void {
  saveConsent({});
}

export function openSettings(): void {
  settingsOpen = true;
  notify();
}

export function closeSettings(): void {
  settingsOpen = false;
  notify();
}
