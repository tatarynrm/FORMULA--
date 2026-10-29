import type { ListedCollection, SubtopicTab, TestFilterField } from './types';

export const LISTED_COLLECTIONS = [
  'base',
  'booklet',
  'amps',
] as const satisfies readonly ListedCollection[];

export const SUBTOPIC_TABS = ['materials', 'tests'] as const satisfies readonly SubtopicTab[];

/** Filters each list offers. Bases are grouped by category only. */
export const COLLECTION_FILTERS: Record<ListedCollection, readonly TestFilterField[]> = {
  base: ['category'],
  booklet: ['category', 'year', 'specialty'],
  amps: ['category', 'year', 'specialty'],
};

/** Up to this many categories a base list shows them as tabs, more than that as a dropdown. */
export const MAX_CATEGORY_TABS = 4;

export const SEARCH_DEBOUNCE_MS = 300;

/** A written (situational) answer is saved this long after the student stops typing. */
export const TEXT_SAVE_DEBOUNCE_MS = 800;

/** The timer turns red and is announced when this many seconds are left. */
export const TIMER_WARNING_SECONDS = 60;

/** A test with more questions than this gets a "go to question" field next to the navigator. */
export const JUMP_FIELD_MIN_QUESTIONS = 12;
