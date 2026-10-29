'use client';

import { useSyncExternalStore } from 'react';

import {
  acceptAll,
  closeSettings,
  getSnapshot,
  openSettings,
  rejectOptional,
  saveConsent,
  SERVER_SNAPSHOT,
  subscribe,
} from '../consent-store';
import { CONSENT_MODE, type ConsentCategory } from '../constants';

const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * The visitor's cookie choice. `hasConsent('analytics')` is the one question a script, a pixel or
 * an embed must ask before it starts; strictly necessary cookies are always allowed.
 * Until the browser has been asked (or on the server) every optional category is refused.
 */
export function useConsent() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const hasConsent = (category: ConsentCategory): boolean =>
    category === 'necessary' || (snapshot.decided && snapshot.record?.c[category] === true);

  return {
    ready: snapshot.ready,
    decided: snapshot.decided,
    record: snapshot.record,
    settingsOpen: snapshot.settingsOpen,
    mode: CONSENT_MODE,
    hasConsent,
    acceptAll,
    rejectOptional,
    save: saveConsent,
    openSettings,
    closeSettings,
  };
}
