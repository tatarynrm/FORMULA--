'use client';

import { useEffect } from 'react';

import { t } from '@/locales';

/**
 * Editors that hold unsaved changes right now. One shared set of listeners serves all of them, so
 * a page with several editors (a subtopic has a description and two tests) asks only once.
 */
const dirtyEditors = new Set<symbol>();

function onBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
  // Some browsers only show the dialog when a return value is set.
  event.returnValue = '';
}

/** Links inside the app are navigated by Next.js, so the browser does not ask about them. */
function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

  const url = new URL(link.href, window.location.href);
  // Other sites are covered by `beforeunload`; the same page (or a hash) does not leave.
  if (url.origin !== window.location.origin) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;

  if (!window.confirm(t.adminContent.unsaved.confirmLeave)) {
    event.preventDefault();
    // Stops Next.js `Link` from navigating anyway (its handler runs after this capture listener).
    event.stopPropagation();
  }
}

function register(): () => void {
  const owner = Symbol('unsaved-editor');
  if (dirtyEditors.size === 0) {
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
  }
  dirtyEditors.add(owner);

  return () => {
    dirtyEditors.delete(owner);
    if (dirtyEditors.size === 0) {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    }
  };
}

/**
 * Warns before unsaved edits are lost: the browser asks when the tab is closed or reloaded
 * (`beforeunload`), and a click on a link inside the app asks first too (Next.js has no hook to
 * block client-side navigation). The Back button cannot be intercepted reliably, so the visible
 * "unsaved" indicator next to the save button stays the main signal.
 */
export function useUnsavedChangesWarning(dirty: boolean): void {
  useEffect(() => (dirty ? register() : undefined), [dirty]);
}
