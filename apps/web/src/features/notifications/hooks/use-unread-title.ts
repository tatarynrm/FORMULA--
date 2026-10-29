'use client';

import { useEffect } from 'react';

/** The prefix this hook adds: "(3) " or "(99+) ". */
const PREFIX = /^\(\d+\+?\) /;

/**
 * Prefixes the document title with the unread count, like mail clients do, and keeps it there
 * across navigations (Next replaces the title with the metadata of every page). Idempotent, so
 * two bells (desktop and mobile) may both use it.
 */
export function useUnreadTitle(unread: number, badge: string): void {
  useEffect(() => {
    const label = unread > 0 ? `(${badge}) ` : '';

    const apply = () => {
      const next = label + document.title.replace(PREFIX, '');
      if (document.title !== next) document.title = next;
    };

    apply();
    // Next swaps the <title> element itself on navigation, so the whole head is watched.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, characterData: true, subtree: true });

    return () => {
      observer.disconnect();
      document.title = document.title.replace(PREFIX, '');
    };
  }, [unread, badge]);
}
