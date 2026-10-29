'use client';

import { useCallback, useState } from 'react';

import { describeApiError } from '../utils/api-error';

/**
 * Runs a request from a button (publish, delete, rename...) and keeps the failure as a Ukrainian
 * message to show above the page. Starting a new action clears the previous message.
 */
export function useActionNotice() {
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(
    async <T>(action: () => Promise<T>, fallback: string): Promise<T | undefined> => {
      setNotice(null);
      try {
        return await action();
      } catch (error) {
        setNotice(describeApiError(error, fallback));
        return undefined;
      }
    },
    [],
  );

  const clear = useCallback(() => setNotice(null), []);

  return { notice, run, setNotice, clear };
}
