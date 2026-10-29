'use client';

import {
  type AnswerFeedback,
  type AttemptSession,
  ERROR_CODES,
  type StudentQuestion,
} from '@formula/shared';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { attemptsApi } from '../../api/attempts-api';
import { TEXT_SAVE_DEBOUNCE_MS } from '../../constants';
import { hasErrorCode } from '../../hooks/query-keys';
import { useAnswerSaver } from '../../hooks/use-answer-saver';
import { useFinishAttempt } from '../../hooks/use-attempts';
import { useBeforeUnload } from '../../hooks/use-before-unload';
import { LEARNING_ROUTES, resolveBackTarget } from '../../utils/paths';
import { clockOffsetMs } from '../../utils/time';
import { PageBackHeader } from '../page-back-header';
import { LeaveDialog, SkippedDialog, TimeOverDialog } from './attempt-dialogs';
import { AttemptTimer } from './attempt-timer';
import { type ChipState, QuestionNavigator } from './question-navigator';
import { QuestionView } from './question-view';

// ---- Local state is built once from the snapshot the api sent ----

function selectionsOf(session: AttemptSession): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const answer of session.answers) {
    if (answer.optionIds.length > 0) result[answer.questionId] = [...answer.optionIds];
  }
  return result;
}

function textsOf(session: AttemptSession): Record<string, string> {
  const result: Record<string, string> = {};
  for (const answer of session.answers) {
    if (answer.textAnswer) result[answer.questionId] = answer.textAnswer;
  }
  return result;
}

function feedbacksOf(session: AttemptSession): Record<string, AnswerFeedback> {
  const result: Record<string, AnswerFeedback> = {};
  for (const answer of session.answers) {
    if (answer.feedback) result[answer.questionId] = answer.feedback;
  }
  return result;
}

/** A resumed attempt opens on the first question without an answer (the last one if all are answered). */
function startIndexOf(session: AttemptSession): number {
  const answered = new Set(
    session.answers
      .filter((answer) => answer.optionIds.length > 0 || (answer.textAnswer ?? '').trim() !== '')
      .map((answer) => answer.questionId),
  );
  const firstOpen = session.questions.findIndex((question) => !answered.has(question.id));
  return firstOpen === -1 ? Math.max(0, session.questions.length - 1) : firstOpen;
}

function lettersOf(question: StudentQuestion, feedback: AnswerFeedback): string {
  return question.options
    .filter((option) => feedback.correctOptionIds.includes(option.id))
    .map((option) => option.letter)
    .join(', ');
}

interface AttemptRunnerProps {
  session: AttemptSession;
  /** When the session reached the browser (device clock, ms): `session.serverNow` is compared with it. */
  receivedAt: number;
  /** Page the test was started from; leaving or finishing leads back there. */
  from: string | null;
  /** Reload the attempt from the api (the answers on screen no longer match the saved ones). */
  onResync: () => void;
}

/**
 * Taking a test, question by question. Exam mode saves every change silently and lets the student
 * change answers until the end; explanation mode makes an answer final and shows its feedback at once.
 * A timed attempt counts down by the server clock and finishes by itself at zero. Finishing with
 * unanswered questions asks first.
 */
export function AttemptRunner({ session, receivedAt, from, onResync }: AttemptRunnerProps) {
  const copy = t.learning.attempt;
  const router = useRouter();
  const { attempt, test, questions, deadlineAt } = session;
  const situational = test.kind === 'situational';
  const explanationMode = attempt.explanationsEnabled && !situational;
  // The countdown must not depend on the device clock, which may be minutes off.
  const serverClockOffset = clockOffsetMs(session.serverNow, receivedAt);

  const [index, setIndex] = useState(() => startIndexOf(session));
  const [selections, setSelections] = useState(() => selectionsOf(session));
  const [texts, setTexts] = useState(() => textsOf(session));
  const [feedbacks, setFeedbacks] = useState(() => feedbacksOf(session));
  /** Questions the student moved away from; the unanswered ones among them are "skipped". */
  const [left, setLeft] = useState<ReadonlySet<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const [submitFailedFor, setSubmitFailedFor] = useState<string | null>(null);

  const [skippedNumbers, setSkippedNumbers] = useState<number[]>([]);
  const [skippedOpen, setSkippedOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<'save' | 'finish' | null>(null);
  const [timeOver, setTimeOver] = useState(false);
  const [resultReady, setResultReady] = useState(false);

  const finishingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRenderRef = useRef(true);

  const finishAttempt = useFinishAttempt();
  const submitAnswer = useMutation({
    mutationFn: ({ questionId, optionIds }: { questionId: string; optionIds: string[] }) =>
      attemptsApi.saveAnswer(attempt.id, questionId, { optionIds }),
  });
  const saver = useAnswerSaver({
    attemptId: attempt.id,
    onClosed: handleClosed,
    onRefused: onResync,
  });

  useBeforeUnload(!finishing);

  // After moving to another question the screen reader should start at its text.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const question = questions[index];
  if (!question) return null;

  function isAnswered(questionId: string): boolean {
    if (situational) return (texts[questionId] ?? '').trim() !== '';
    if (explanationMode) return feedbacks[questionId] !== undefined;
    return (selections[questionId]?.length ?? 0) > 0;
  }

  function chipStateOf(target: StudentQuestion): ChipState {
    const feedback = feedbacks[target.id];
    if (explanationMode && feedback) return feedback.isCorrect ? 'correct' : 'wrong';
    if (isAnswered(target.id)) return 'answered';
    return left.has(target.id) ? 'skipped' : 'unanswered';
  }

  // ---- Moving around ----

  function goTo(next: number) {
    if (next < 0 || next >= questions.length || next === index) return;
    const leaving = questions[index];
    if (leaving) setLeft((current) => new Set(current).add(leaving.id));
    setAnnouncement('');
    setSubmitFailedFor(null);
    // Written answers are sent before the next question opens.
    void saver.flush();
    setIndex(next);
  }

  // ---- Answering ----

  function handleSaveFailure(error: unknown, questionId: string) {
    // Answered elsewhere in the meantime: what is on screen is outdated, so load the saved state again.
    // Access withdrawn by an admin: the reload answers with the lock instead of the test.
    if (hasErrorCode(error, ERROR_CODES.ANSWER_FINAL, ERROR_CODES.FORBIDDEN)) {
      onResync();
      return;
    }
    // The attempt is closed (time ran out, or it was finished on another device): close it here too.
    if (hasErrorCode(error, ERROR_CODES.TIME_OVER, ERROR_CODES.ATTEMPT_FINISHED)) {
      void finish({ force: true });
      return;
    }
    setSubmitFailedFor(questionId);
  }

  async function submitExplained(target: StudentQuestion, optionIds: string[]) {
    const previous = selections[target.id] ?? [];
    setSelections((current) => ({ ...current, [target.id]: optionIds }));
    setSubmitFailedFor(null);

    try {
      const result = await submitAnswer.mutateAsync({ questionId: target.id, optionIds });
      const feedback = result.feedback;
      if (feedback) {
        setFeedbacks((current) => ({ ...current, [target.id]: feedback }));
        setAnnouncement(
          feedback.isCorrect
            ? copy.feedback.correct
            : `${copy.feedback.wrong}. ${format(copy.feedback.correctAnswer, { letters: lettersOf(target, feedback) })}`,
        );
      }
    } catch (error) {
      setSelections((current) => ({ ...current, [target.id]: previous }));
      handleSaveFailure(error, target.id);
    }
  }

  function toggleOption(target: StudentQuestion, optionId: string) {
    if (feedbacks[target.id] || submitAnswer.isPending || finishing) return;

    const current = selections[target.id] ?? [];
    const next = target.multiple
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : [optionId];

    // A single choice in explanation mode is final the moment it is clicked.
    if (explanationMode && !target.multiple) {
      void submitExplained(target, next);
      return;
    }

    setSelections((previous) => ({ ...previous, [target.id]: next }));
    if (!explanationMode) saver.enqueue(target.id, { optionIds: next });
  }

  function clearAnswer(target: StudentQuestion) {
    setSelections((previous) => ({ ...previous, [target.id]: [] }));
    saver.enqueue(target.id, { optionIds: [] });
  }

  function changeText(target: StudentQuestion, value: string) {
    setTexts((previous) => ({ ...previous, [target.id]: value }));
    saver.enqueue(target.id, { textAnswer: value }, TEXT_SAVE_DEBOUNCE_MS);
  }

  // ---- Finishing ----

  function requestFinish() {
    const missing = questions.flatMap((item, position) =>
      isAnswered(item.id) ? [] : [position + 1],
    );
    if (missing.length > 0) {
      setSkippedNumbers(missing);
      setSkippedOpen(true);
      return;
    }
    void finish();
  }

  /**
   * Sends what is still waiting, then closes the attempt. `force` finishes even if some answer could not
   * be saved (time is over). `auto` waits on the "time is over" dialog instead of opening the result.
   */
  async function finish(options: { force?: boolean; auto?: boolean } = {}) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setFinishError(null);

    const failed = await saver.flush();
    if (failed.length > 0 && !options.force) {
      finishingRef.current = false;
      setFinishing(false);
      setFinishError('save');
      return;
    }

    try {
      await finishAttempt.mutateAsync(attempt.id);
      if (options.auto) {
        setResultReady(true);
        return;
      }
      router.replace(LEARNING_ROUTES.result(attempt.id, from));
    } catch {
      finishingRef.current = false;
      setFinishing(false);
      setFinishError('finish');
    }
  }

  /** The api refused an answer because the attempt is closed (time is over, or it was finished elsewhere). */
  function handleClosed() {
    void finish({ force: true });
  }

  function handleExpire() {
    if (finishingRef.current) return;
    setTimeOver(true);
    void finish({ force: true, auto: true });
  }

  async function leave() {
    await saver.flush();
    router.push(resolveBackTarget(from, test).href);
  }

  const states = questions.map(chipStateOf);
  const isLast = index === questions.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <PageBackHeader
        title={test.title}
        subtitle={
          test.subtopicTitle
            ? format(t.learning.common.subtopicOf, { subtopic: test.subtopicTitle })
            : copy.subtitle[test.kind]
        }
        onBack={() => setLeaveOpen(true)}
        backLabel={copy.leave}
        actions={
          <Button type="button" onClick={requestFinish} disabled={finishing}>
            {copy.finish}
          </Button>
        }
      />

      <QuestionNavigator states={states} current={index} onSelect={goTo} />

      {deadlineAt ? (
        <div className="bg-secondary rounded-2xl px-4 py-3">
          <AttemptTimer
            deadlineAt={deadlineAt}
            clockOffsetMs={serverClockOffset}
            onExpire={handleExpire}
          />
        </div>
      ) : null}

      <QuestionView
        key={question.id}
        question={question}
        number={index + 1}
        total={questions.length}
        situational={situational}
        explanationMode={explanationMode}
        selection={selections[question.id] ?? []}
        text={texts[question.id] ?? ''}
        feedback={feedbacks[question.id] ?? null}
        submitting={submitAnswer.isPending}
        submitFailed={submitFailedFor === question.id}
        saveStatus={saver.statuses[question.id]}
        headingRef={headingRef}
        onToggleOption={(optionId) => toggleOption(question, optionId)}
        onSubmit={() => void submitExplained(question, selections[question.id] ?? [])}
        onClear={() => clearAnswer(question)}
        onTextChange={(value) => changeText(question, value)}
        onTextBlur={() => void saver.flush()}
        onRetrySave={() => saver.retry(question.id)}
      />

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          {copy.previous}
        </Button>
        {isLast ? (
          <Button type="button" onClick={requestFinish} disabled={finishing}>
            {finishing && !timeOver ? copy.finishing : copy.finishTest}
          </Button>
        ) : (
          <Button type="button" onClick={() => goTo(index + 1)}>
            {copy.next}
          </Button>
        )}
      </div>

      {finishError && !timeOver ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {finishError === 'save' ? copy.finishSaveError : copy.finishError}
        </p>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <SkippedDialog
        open={skippedOpen}
        onOpenChange={setSkippedOpen}
        numbers={skippedNumbers}
        onContinue={() => void finish()}
      />
      <LeaveDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        timed={deadlineAt !== null}
        onConfirm={() => void leave()}
      />
      <TimeOverDialog
        open={timeOver}
        ready={resultReady}
        failed={finishError !== null}
        onOpenResult={() => router.replace(LEARNING_ROUTES.result(attempt.id, from))}
        onRetry={() => void finish({ force: true, auto: true })}
      />
    </div>
  );
}
