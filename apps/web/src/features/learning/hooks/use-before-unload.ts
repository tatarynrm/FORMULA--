'use client';

import { useEffect } from 'react';

/** Asks the browser to confirm before the tab is closed or reloaded while `active` is true. */
export function useBeforeUnload(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need a return value to show the prompt.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
}
