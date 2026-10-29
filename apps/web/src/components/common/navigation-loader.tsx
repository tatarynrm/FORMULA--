'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageLoader } from './page-loader';

/** If a navigation never finishes (offline, error), the loader gives up after this long. */
const GIVE_UP_MS = 10_000;

/**
 * Shows the centered logo loader from the moment a visitor clicks an internal link until the new
 * page has rendered. The overlay is derived from state (`from === pathname`), so it disappears the
 * instant the route changes, without an effect to reset it.
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState<string | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      const sameSite = url.origin === window.location.origin;
      // Hash-only links and links to the current page do not navigate, so there is nothing to wait for.
      if (!sameSite || url.pathname === window.location.pathname) return;

      setLeaving(window.location.pathname);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(() => setLeaving(null), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  return leaving === pathname ? <PageLoader /> : null;
}
