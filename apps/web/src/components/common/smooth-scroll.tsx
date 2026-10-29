'use client';

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect } from 'react';

/** Distance kept above an anchor target so the sticky header does not cover it. */
const ANCHOR_OFFSET = -112;

/**
 * Inertial smooth scrolling for the public landing (Lenis). Also turns `/#section` links that
 * point at the current page into smooth scrolls. Does nothing for visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 0.9 });

    // Radix locks the page (`data-scroll-locked`) while the mobile menu is open; pause Lenis meanwhile.
    const lockObserver = new MutationObserver(() => {
      if (document.body.hasAttribute('data-scroll-locked')) lenis.stop();
      else lenis.start();
    });
    lockObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked'],
    });

    // Capture phase: run before Next's <Link> handler, which skips navigation on defaultPrevented.
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!link || link.target === '_blank') return;

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !url.hash
      )
        return;

      const target = document.querySelector(url.hash);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: ANCHOR_OFFSET, duration: 1.4 });
      history.pushState(null, '', url.hash);
    };
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('click', onClick, true);
      lockObserver.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
