'use client';

import type { ResultQuestion, ReviewDetail } from '@formula/shared';
import { useId, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { FileImage } from '@/components/common/file-image';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useReview, useSubmitReview } from '../hooks/use-reviews';
import { describeApiError, isApiStatus } from '../utils/api-error';
import { formatDateTime } from '../utils/format-date';
import { formatContentPath } from '../utils/format-path';
import { type GradeDraft, parseScore, toGradeDrafts, toGradeInputs } from '../utils/review-grades';
import { AdminPageHeader } from './admin-page-header';
import { AdminTextarea } from './admin-textarea';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { Field, FieldError } from './field';
import { PageTitle } from './page-title';

const EMPTY_GRADE: GradeDraft = { score: '', comment: '' };

interface ReviewQuestionProps {
  question: ResultQuestion;
  number: number;
  /** Graded works are shown, not edited. */
  readOnly: boolean;
  draft: GradeDraft;
  onChange: (changes: Partial<GradeDraft>) => void;
}

/** One question of a work: the question, the written answer next to the model answer, score and comment. */
function ReviewQuestion({ question, number, readOnly, draft, onChange }: ReviewQuestionProps) {
  const copy = t.adminContent.reviews.detail;
  const id = useId();
  const names = { n: number, max: question.maxScore };
  const score = parseScore(draft.score, question.maxScore);
  const scoreInvalid = draft.score.trim() !== '' && score === null;

  return (
    <article
      aria-labelledby={`${id}-heading`}
      className="bg-surface-raised border-input flex flex-col gap-4 rounded-3xl border p-4 md:p-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-heading`} className="text-body-lg text-foreground font-bold">
          {format(copy.question, names)}
        </h2>
        <span className="text-body-sm text-muted-foreground">{format(copy.maxScore, names)}</span>
      </header>

      <p className="text-body-md text-foreground wrap-anywhere whitespace-pre-wrap">
        {question.body}
      </p>
      {question.imageFileId ? (
        <FileImage
          fileId={question.imageFileId}
          alt={format(t.adminContent.questions.imageAlt, names)}
          className="border-input max-h-64 w-fit rounded-xl border object-contain"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-background flex flex-col gap-2 rounded-2xl p-4">
          <h3 className="text-body-sm text-text-secondary font-semibold">{copy.studentAnswer}</h3>
          {question.textAnswer ? (
            <p className="text-body-md text-foreground wrap-anywhere whitespace-pre-wrap">
              {question.textAnswer}
            </p>
          ) : (
            <p className="text-body-md text-muted-foreground">{copy.noAnswer}</p>
          )}
        </section>
        <section className="bg-success-soft flex flex-col gap-2 rounded-2xl p-4">
          <h3 className="text-body-sm text-success font-semibold">{copy.modelAnswer}</h3>
          {question.explanation ? (
            <p className="text-body-md text-foreground wrap-anywhere whitespace-pre-wrap">
              {question.explanation}
            </p>
          ) : (
            <p className="text-body-md text-muted-foreground">{copy.noModelAnswer}</p>
          )}
        </section>
      </div>

      {readOnly ? (
        <div className="flex flex-col gap-1">
          <p className="text-body-md text-foreground font-semibold">
            {format(copy.scoreReadOnly, {
              score: question.score === null ? '–' : String(question.score).replace('.', ','),
              max: question.maxScore,
            })}
          </p>
          {question.reviewerComment ? (
            <p className="text-body-md text-text-secondary wrap-anywhere whitespace-pre-wrap">
              {question.reviewerComment}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
          <Field>
            <Label htmlFor={`${id}-score`}>{format(copy.score, names)}</Label>
            <Input
              id={`${id}-score`}
              type="number"
              inputMode="decimal"
              min={0}
              max={question.maxScore}
              step={0.5}
              value={draft.score}
              aria-invalid={scoreInvalid}
              aria-describedby={scoreInvalid ? `${id}-score-error` : undefined}
              onChange={(event) => onChange({ score: event.target.value })}
            />
            {scoreInvalid ? (
              <FieldError id={`${id}-score-error`}>
                {format(copy.scoreRange, { max: question.maxScore })}
              </FieldError>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor={`${id}-comment`}>{format(copy.comment, names)}</Label>
            <AdminTextarea
              id={`${id}-comment`}
              value={draft.comment}
              placeholder={copy.commentPlaceholder}
              maxLength={2000}
              className="min-h-16"
              onChange={(event) => onChange({ comment: event.target.value })}
            />
          </Field>
        </div>
      )}
    </article>
  );
}

function ReviewView({ review }: { review: ReviewDetail }) {
  const copy = t.adminContent.reviews.detail;
  const submit = useSubmitReview(review.attempt.id);
  const readOnly = review.attempt.status === 'reviewed';
  const [drafts, setDrafts] = useState(() => toGradeDrafts(review.questions));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Every subtopic has a test called "Ситуаційні задачі", so the place says which one this is.
  const path = formatContentPath([review.subjectTitle, review.topicTitle, review.subtopicTitle]);
  const grades = toGradeInputs(review.questions, drafts);
  const maxTotal = review.questions.reduce((sum, question) => sum + question.maxScore, 0);
  const total = readOnly
    ? (review.attempt.score ?? 0)
    : review.questions.reduce(
        (sum, question) =>
          sum + (parseScore(drafts[question.id]?.score ?? '', question.maxScore) ?? 0),
        0,
      );
  const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const totalLabel = format(copy.total, {
    score: String(total).replace('.', ','),
    max: maxTotal,
  });

  async function send() {
    if (!grades) return;
    setError(null);
    try {
      await submit.mutateAsync(grades);
      setJustSubmitted(true);
    } catch (caught) {
      setError(
        isApiStatus(caught, 409) ? copy.alreadyReviewed : describeApiError(caught, copy.error),
      );
    }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/reviews"
        title={
          <div className="flex min-w-0 flex-col gap-1">
            <PageTitle>{review.test.title}</PageTitle>
            {path ? (
              <p className="text-body-sm text-muted-foreground wrap-anywhere">{path}</p>
            ) : null}
          </div>
        }
      />

      <section
        aria-label={copy.student}
        className="bg-surface-raised border-input flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-4 md:p-6"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-body-lg text-foreground font-bold wrap-anywhere">
            {review.studentName}
          </p>
          <p className="text-body-sm text-text-secondary wrap-anywhere">{review.studentEmail}</p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          {review.attempt.finishedAt ? (
            <p className="text-body-sm text-muted-foreground">
              {format(copy.finished, { date: formatDateTime(review.attempt.finishedAt) })}
            </p>
          ) : null}
          <p className="text-body-md text-foreground font-semibold">
            {totalLabel} ({format(copy.percent, { percent })})
          </p>
        </div>
      </section>

      {readOnly ? (
        <p
          role="status"
          className={
            justSubmitted
              ? 'bg-success-soft text-success text-body-md rounded-2xl px-4 py-3 font-medium'
              : 'text-body-md text-text-secondary'
          }
        >
          {justSubmitted ? copy.done : copy.readOnly}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {review.questions.map((question, index) => (
          <ReviewQuestion
            key={question.id}
            question={question}
            number={index + 1}
            readOnly={readOnly}
            draft={drafts[question.id] ?? EMPTY_GRADE}
            onChange={(changes) =>
              setDrafts((current) => ({
                ...current,
                [question.id]: { ...(current[question.id] ?? EMPTY_GRADE), ...changes },
              }))
            }
          />
        ))}
      </div>

      {readOnly ? null : (
        <div className="bg-surface-raised border-input sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border p-3 shadow-lg md:px-5">
          <ErrorNotice message={error} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-body-md text-foreground font-semibold">{totalLabel}</p>
              {grades ? null : (
                <p className="text-body-sm text-muted-foreground">{copy.incomplete}</p>
              )}
            </div>
            <Button
              type="button"
              disabled={!grades || submit.isPending}
              onClick={() => setConfirming(true)}
            >
              {submit.isPending ? copy.submitting : copy.submit}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={copy.confirmTitle}
        description={copy.confirmDescription}
        confirmLabel={copy.confirm}
        onConfirm={() => void send()}
      />
    </div>
  );
}

/** One attempt of a situational test: written answers next to the model answers, with grading. */
export function ReviewEditor({ attemptId }: { attemptId: string }) {
  const copy = t.adminContent.reviews;
  const { data: review, isPending, isError, error } = useReview(attemptId);

  if (isError) {
    const missing = isApiStatus(error, 404);
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={copy.pageTitle} backHref="/admin/reviews" />
        <EmptyState
          title={missing ? copy.detail.notFound : copy.detail.loadError}
          description={missing ? copy.detail.notFoundHint : undefined}
          action={
            <LinkButton href="/admin/reviews" variant="secondary">
              {copy.detail.back}
            </LinkButton>
          }
        />
      </div>
    );
  }

  if (isPending) return <LogoLoader size="lg" fill />;

  // Keyed by attempt: the form copies the stored grades once.
  return <ReviewView key={review.attempt.id} review={review} />;
}
