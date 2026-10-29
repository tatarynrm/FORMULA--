'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';

import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useStartAttempt } from '../../hooks/use-attempts';
import { useTest } from '../../hooks/use-tests';
import type { StartTestRequest } from '../../types';
import { LEARNING_ROUTES } from '../../utils/paths';
import { formatDuration } from '../../utils/time';
import { ChoiceCard } from './choice-card';

interface StartTestDialogProps {
  request: (StartTestRequest & { from: string }) | null;
  onClose: () => void;
}

/**
 * The question before every new attempt: show explanations after each answer or only at the end, and
 * (when the admin set a time limit) accept the limit or take the test without one.
 */
export function StartTestDialog({ request, onClose }: StartTestDialogProps) {
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {request ? (
        <StartTestContent key={request.testId} request={request} onClose={onClose} />
      ) : null}
    </Dialog>
  );
}

function StartTestContent({
  request,
  onClose,
}: {
  request: StartTestRequest & { from: string };
  onClose: () => void;
}) {
  const copy = t.learning.start;
  const router = useRouter();
  const groupId = useId();
  const test = useTest(request.testId, request.summary);
  const startAttempt = useStartAttempt();

  const [explanations, setExplanations] = useState(true);
  const [timed, setTimed] = useState(true);

  const data = test.data;
  const openAttempt = data?.lastAttempt?.status === 'in_progress' ? data.lastAttempt : null;
  const situational = data?.kind === 'situational';
  const timeLimit = data?.timeLimitSeconds ?? null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;

    startAttempt.mutate(
      {
        testId: data.id,
        timed: timeLimit !== null && timed,
        // Written answers have no feedback to show.
        explanationsEnabled: !situational && explanations,
      },
      {
        onSuccess: (session) => {
          router.push(LEARNING_ROUTES.attempt(session.attempt.id, request.from));
          onClose();
        },
      },
    );
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>
          {data
            ? format(data.subtopicTitle ? copy.descriptionSubtopic : copy.description, {
                subtopic: data.subtopicTitle ?? '',
                title: data.title,
                questions: format(t.learning.common.count, {
                  count: data.questionCount,
                  word: pluralizeUk(data.questionCount, t.learning.common.questions),
                }),
              })
            : copy.title}
        </DialogDescription>
      </DialogHeader>

      {test.isPending ? <LogoLoader size="sm" className="min-h-40" /> : null}

      {test.isError && !data ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.loadError}
        </p>
      ) : null}

      {data && openAttempt ? (
        <div className="flex flex-col gap-4">
          <div className="bg-secondary flex flex-col gap-1 rounded-2xl p-4">
            <p className="text-body-md text-foreground font-semibold">{copy.resume.title}</p>
            <p className="text-body-sm text-muted-foreground">{copy.resume.description}</p>
          </div>
          <DialogFooter>
            <LinkButton
              href={LEARNING_ROUTES.attempt(openAttempt.id, request.from)}
              onClick={onClose}
              className="sm:min-w-40"
            >
              {copy.resume.cta}
            </LinkButton>
          </DialogFooter>
        </div>
      ) : null}

      {data && !openAttempt ? (
        <form onSubmit={submit} className="flex flex-col gap-6">
          {situational ? (
            <p className="text-body-sm text-text-secondary bg-secondary rounded-2xl p-4">
              {copy.situationalNote}
            </p>
          ) : (
            <fieldset className="flex flex-col gap-3">
              <legend className="text-body-md text-foreground mb-3 font-bold">
                {copy.explanationsLegend}
              </legend>
              <ChoiceCard
                name={`${groupId}-explanations`}
                checked={explanations}
                onSelect={() => setExplanations(true)}
                title={copy.explanationsOn}
                hint={copy.explanationsOnHint}
              />
              <ChoiceCard
                name={`${groupId}-explanations`}
                checked={!explanations}
                onSelect={() => setExplanations(false)}
                title={copy.explanationsOff}
                hint={copy.explanationsOffHint}
              />
            </fieldset>
          )}

          {timeLimit !== null ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="text-body-md text-foreground mb-1 font-bold">
                {copy.timeLegend}
              </legend>
              <p className="text-body-sm text-muted-foreground mb-2">
                {format(copy.timeInfo, { duration: formatDuration(timeLimit) })}
              </p>
              <ChoiceCard
                name={`${groupId}-time`}
                checked={timed}
                onSelect={() => setTimed(true)}
                title={copy.timed}
                hint={copy.timedHint}
              />
              <ChoiceCard
                name={`${groupId}-time`}
                checked={!timed}
                onSelect={() => setTimed(false)}
                title={copy.untimed}
                hint={copy.untimedHint}
              />
            </fieldset>
          ) : null}

          {startAttempt.isError ? (
            <p role="alert" className="text-body-sm text-input-error-text">
              {copy.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={startAttempt.isPending}
            >
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={startAttempt.isPending} className="sm:min-w-40">
              {startAttempt.isPending ? copy.starting : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      ) : null}
    </DialogContent>
  );
}
