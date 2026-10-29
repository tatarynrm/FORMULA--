'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

import type { StartTestRequest } from '../../types';
import { LEARNING_ROUTES, currentLocation, safeOrigin } from '../../utils/paths';
import { StartTestDialog } from './start-test-dialog';

type ResolvedRequest = StartTestRequest & { from: string };

const StartTestContext = createContext<((request: StartTestRequest) => void) | null>(null);

/**
 * Hosts the one start dialog of the cabinet. Any screen asks it to start a test; if the test already has
 * an unfinished attempt the student goes straight back to it instead of being asked again.
 */
export function StartTestProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [request, setRequest] = useState<ResolvedRequest | null>(null);

  const startTest = useCallback(
    (next: StartTestRequest) => {
      const from = safeOrigin(next.from ?? currentLocation()) ?? LEARNING_ROUTES.home;
      const open = next.summary?.lastAttempt;

      if (open?.status === 'in_progress') {
        router.push(LEARNING_ROUTES.attempt(open.id, from));
        return;
      }
      setRequest({ ...next, from });
    },
    [router],
  );

  const close = useCallback(() => setRequest(null), []);

  return (
    <StartTestContext value={startTest}>
      {children}
      <StartTestDialog request={request} onClose={close} />
    </StartTestContext>
  );
}

/** Returns `startTest(request)`: opens the start dialog, or continues the unfinished attempt. */
export function useStartTest(): (request: StartTestRequest) => void {
  const startTest = useContext(StartTestContext);
  if (!startTest) throw new Error('useStartTest must be used inside StartTestProvider');
  return startTest;
}
