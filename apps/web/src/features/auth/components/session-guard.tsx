'use client';

import { useEffect, useRef } from 'react';

import { ApiClientError } from '@/lib/api-client';

import { useLogout } from '../hooks/use-auth-mutations';
import { useCurrentUser } from '../hooks/use-current-user';

/**
 * Sends the visitor to /login when the session is gone (the api already tried to refresh it).
 * It calls logout first, so the leftover cookies are cleared and the proxy does not bounce back.
 */
export function SessionGuard() {
  const { error } = useCurrentUser();
  const logout = useLogout();
  const handled = useRef(false);

  useEffect(() => {
    if (error instanceof ApiClientError && error.statusCode === 401 && !handled.current) {
      handled.current = true;
      logout.mutate();
    }
  }, [error, logout]);

  return null;
}
