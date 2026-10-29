import type { AttemptTestInfo } from '@formula/shared';

import { t } from '@/locales';

import type { BackTarget, SubtopicTab } from '../types';

function withFrom(path: string, from: string | null | undefined): string {
  return from ? `${path}?from=${encodeURIComponent(from)}` : path;
}

export const LEARNING_ROUTES = {
  home: '/cabinet',
  bases: '/cabinet/bases',
  booklets: '/cabinet/booklets',
  amps: '/cabinet/amps',
  saved: '/cabinet/saved',
  subject: (id: string) => `/cabinet/subjects/${id}`,
  subtopic: (id: string, tab: SubtopicTab = 'materials') =>
    tab === 'tests' ? `/cabinet/subtopics/${id}?tab=tests` : `/cabinet/subtopics/${id}`,
  /** `from` is the page the student started from; the result page offers a way back to it. */
  attempt: (id: string, from?: string | null) => withFrom(`/cabinet/attempts/${id}`, from),
  result: (id: string, from?: string | null) => withFrom(`/cabinet/attempts/${id}/result`, from),
} as const;

const SAFE_BASE = 'http://localhost';

/** Accepts only paths inside the cabinet, so `?from=` can never lead to another site. */
export function safeOrigin(value: string | null | undefined): string | null {
  if (!value?.startsWith('/cabinet')) return null;
  try {
    const url = new URL(value, SAFE_BASE);
    const insideCabinet = url.pathname === '/cabinet' || url.pathname.startsWith('/cabinet/');
    if (url.origin !== SAFE_BASE || !insideCabinet) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/** The page the student was on when starting a test, taken in an event handler (browser only). */
export function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Where the "back" button of a result (or leaving a test) leads: the page the test was started from;
 * without a usable `from`, a subtopic test leads to its subtopic (the "Тести" tab), the others to their list.
 */
export function resolveBackTarget(
  from: string | null,
  test: Pick<AttemptTestInfo, 'collection' | 'subtopicId'>,
): BackTarget {
  const copy = t.learning.result.actions;
  const origin = safeOrigin(from);

  if (origin) {
    const path = origin.split('?')[0] ?? origin;
    if (path.startsWith('/cabinet/subtopics/')) return { href: origin, label: copy.toSubtopic };
    if (path === LEARNING_ROUTES.saved) return { href: origin, label: copy.toSaved };
    if (path === LEARNING_ROUTES.bases) return { href: origin, label: copy.toBases };
    if (path === LEARNING_ROUTES.booklets) return { href: origin, label: copy.toBooklets };
    if (path === LEARNING_ROUTES.amps) return { href: origin, label: copy.toAmps };
  }

  if (test.collection === 'subtopic' && test.subtopicId) {
    return { href: LEARNING_ROUTES.subtopic(test.subtopicId, 'tests'), label: copy.toSubtopic };
  }

  switch (test.collection) {
    case 'base':
      return { href: LEARNING_ROUTES.bases, label: copy.toBases };
    case 'booklet':
      return { href: LEARNING_ROUTES.booklets, label: copy.toBooklets };
    case 'amps':
      return { href: LEARNING_ROUTES.amps, label: copy.toAmps };
    case 'subtopic':
      return { href: LEARNING_ROUTES.home, label: copy.toHome };
  }
}
