'use client';

import type { AdminTest, ContentStatus } from '@formula/shared';
import { useId, useMemo, useReducer, useState } from 'react';

import { t } from '@/locales';

import type { TestSettingsDraft, ValidationProblem } from '../types';
import { describeApiError } from '../utils/api-error';
import { applySavedIds, draftReducer, toDraft, toQuestionInputs } from '../utils/question-draft';
import { scrollToElement } from '../utils/scroll';
import {
  type SettingsScope,
  settingsFromTest,
  settingsSnapshot,
  settingsToPatch,
} from '../utils/test-settings';
import { validateTest } from '../utils/test-validation';
import { useTestMutations } from './use-admin-tests';
import { useUnsavedChangesWarning } from './use-unsaved-changes-warning';

/** What the request in flight is for. Everything is locked while there is one. */
export type WorkKind = 'save' | 'publish' | 'other';

export interface EditorNotice {
  kind: 'error' | 'success';
  text: string;
}

interface UseTestEditorOptions {
  /** The stored test. The editor copies it once; mount a new editor (by key) for another test. */
  initial: AdminTest;
  scope: SettingsScope;
  /** Called after the test was deleted (the page editor then leaves for the list). */
  onDeleted?: () => void;
}

const EMPTY_KEYS: ReadonlySet<string> = new Set();

/**
 * State and actions of one test editor: the settings, the question draft, what is invalid, and
 * save / publish / unpublish / delete. The page editor (bases, booklets, AMPS) and the inline
 * editor of a subtopic share it and only differ in layout.
 *
 * The form copies `initial` once; edits live here until they are saved.
 */
export function useTestEditor({ initial, scope, onDeleted }: UseTestEditorOptions) {
  const copy = t.adminContent.testEditor;
  const { update, saveQuestions, remove } = useTestMutations();
  const anchor = useId();
  // The kind decides how questions look; the api only lets it change while there are none, and
  // the editor is then mounted anew.
  const { kind } = initial;

  /** The test as stored on the server, as far as this editor knows. */
  const [stored, setStored] = useState<AdminTest>(initial);
  const [settings, setSettings] = useState<TestSettingsDraft>(() => settingsFromTest(initial));
  const [questions, dispatch] = useReducer(draftReducer, initial.questions, toDraft);
  // Texts of what was loaded or saved last, to tell whether there is anything to save.
  const [baseline, setBaseline] = useState(() => ({
    settings: settingsSnapshot(settingsFromTest(initial), scope),
    questions: JSON.stringify(toQuestionInputs(toDraft(initial.questions), kind)),
  }));
  const [working, setWorking] = useState<WorkKind | null>(null);
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  // After a blocked save or publish the problems are drawn in red; a new test does not start red.
  const [showProblems, setShowProblems] = useState(false);

  const status: ContentStatus = stored.status;
  const published = status === 'published';

  const settingsKey = settingsSnapshot(settings, scope);
  const questionsKey = useMemo(
    () => JSON.stringify(toQuestionInputs(questions, kind)),
    [questions, kind],
  );
  const settingsDirty = settingsKey !== baseline.settings;
  const questionsDirty = questionsKey !== baseline.questions;
  const dirty = settingsDirty || questionsDirty;
  useUnsavedChangesWarning(dirty);

  const problems = useMemo(
    () => validateTest({ kind, settings, scope, questions }),
    [kind, settings, scope, questions],
  );
  const invalidKeys = useMemo(
    () =>
      new Set(
        problems
          .map((problem) => problem.questionKey)
          .filter((key): key is string => key !== undefined),
      ),
    [problems],
  );

  function changeSettings(changes: Partial<TestSettingsDraft>) {
    setSettings((current) => ({ ...current, ...changes }));
  }

  function goTo(problem: ValidationProblem) {
    if (problem.questionKey) scrollToElement(`question-${problem.questionKey}`);
    else scrollToElement(`${anchor}-${problem.id === 'no-questions' ? 'questions' : 'settings'}`);
  }

  /** Blocks an action while there are problems: shows them and takes the admin to the first one. */
  function refuse(blocking: ValidationProblem[], text: string): boolean {
    const first = blocking[0];
    if (!first) return false;

    setShowProblems(true);
    setNotice({ kind: 'error', text });
    goTo(first);
    return true;
  }

  /**
   * Sends what changed: the settings, then all questions. Returns the stored test, or `null` when
   * something failed (the notice says what).
   */
  async function persist(): Promise<AdminTest | null> {
    try {
      let current = stored;
      let questionsBaseline = baseline.questions;

      if (settingsDirty) {
        current = await update.mutateAsync({
          id: current.id,
          patch: settingsToPatch(settings, scope),
        });
        setStored(current);
      }

      if (questionsDirty) {
        current = await saveQuestions.mutateAsync({
          id: current.id,
          questions: toQuestionInputs(questions, kind),
        });
        setStored(current);
        // New questions and options got their ids; keep them so the next save updates in place.
        const withIds = applySavedIds(questions, current.questions);
        dispatch({ type: 'replace', questions: withIds });
        questionsBaseline = JSON.stringify(toQuestionInputs(withIds, kind));
      }

      setBaseline({ settings: settingsKey, questions: questionsBaseline });
      return current;
    } catch (error) {
      setNotice({ kind: 'error', text: describeApiError(error, copy.saveError) });
      return null;
    }
  }

  async function withBusy(work: WorkKind, action: () => Promise<void>) {
    setWorking(work);
    setNotice(null);
    try {
      await action();
    } finally {
      setWorking(null);
    }
  }

  async function save() {
    if (!dirty) return;
    // A published test must stay valid, so every problem blocks; a draft only needs what the api demands.
    const blocking = published ? problems : problems.filter((problem) => problem.blocksSave);
    if (refuse(blocking, published ? copy.publishedNeedsValid : copy.cannotSave)) return;

    await withBusy('save', async () => {
      if (await persist()) setNotice({ kind: 'success', text: copy.saved });
    });
  }

  async function publish() {
    if (refuse(problems, copy.publishBlocked)) return;

    await withBusy('publish', async () => {
      const current = dirty ? await persist() : stored;
      if (!current) return;

      try {
        setStored(await update.mutateAsync({ id: current.id, patch: { status: 'published' } }));
        setShowProblems(false);
        setNotice({ kind: 'success', text: copy.publishedNow });
      } catch (error) {
        // The api answers 409 with the reason (for example "Question 2 has no correct option").
        setNotice({ kind: 'error', text: describeApiError(error, copy.publishError) });
      }
    });
  }

  async function unpublish() {
    const { id } = stored;

    await withBusy('other', async () => {
      try {
        setStored(await update.mutateAsync({ id, patch: { status: 'draft' } }));
        setNotice({ kind: 'success', text: copy.unpublishedNow });
      } catch (error) {
        setNotice({ kind: 'error', text: describeApiError(error, copy.unpublishError) });
      }
    });
  }

  async function deleteTest() {
    const { id } = stored;

    await withBusy('other', async () => {
      try {
        await remove.mutateAsync(id);
        onDeleted?.();
      } catch (error) {
        setNotice({ kind: 'error', text: describeApiError(error, copy.deleteError) });
      }
    });
  }

  // A success message belongs to the saved state; new edits make it stale.
  const visibleNotice = notice && !(notice.kind === 'success' && dirty) ? notice : null;

  return {
    kind,
    /** Prefix of the element ids the layout gives to its settings and questions blocks. */
    anchor,
    stored,
    status,
    published,
    settings,
    changeSettings,
    questions,
    dispatch,
    problems,
    /** Questions to outline in red. */
    invalidKeys: showProblems || published ? invalidKeys : EMPTY_KEYS,
    /** Draws the list of problems in red. */
    emphasizeProblems: showProblems || published,
    dirty,
    working,
    busy: working !== null,
    notice: visibleNotice,
    goTo,
    save,
    publish,
    unpublish,
    deleteTest,
  };
}

export type TestEditorController = ReturnType<typeof useTestEditor>;
