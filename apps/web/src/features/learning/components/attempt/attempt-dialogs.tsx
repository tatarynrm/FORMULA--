'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { formatNumberRanges } from '../../utils/ranges';

interface SkippedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Numbers (1-based) of the questions without an answer. */
  numbers: readonly number[];
  /** "Далі": finish the test anyway. */
  onContinue: () => void;
}

/** "Ви пропустили питання. Повернутись до тесту чи йдемо далі?" Back only closes the dialog. */
export function SkippedDialog({ open, onOpenChange, numbers, onContinue }: SkippedDialogProps) {
  const copy = t.learning.attempt.skipped;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy.description}
            <span className="mt-2 block">
              {format(copy.list, { numbers: formatNumberRanges(numbers) })}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.back}</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>{copy.next}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The attempt has a time limit, so the clock keeps running while the student is away. */
  timed: boolean;
  onConfirm: () => void;
}

/** "Вийти з тесту?" The progress is saved, so the test can be continued later. */
export function LeaveDialog({ open, onOpenChange, timed, onConfirm }: LeaveDialogProps) {
  const copy = t.learning.attempt.leaveDialog;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {timed ? copy.timedDescription : copy.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.stay}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{copy.confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface TimeOverDialogProps {
  open: boolean;
  /** The result is ready, so the button can open it. */
  ready: boolean;
  failed: boolean;
  onOpenResult: () => void;
  onRetry: () => void;
}

/** "Час вичерпано": cannot be dismissed, it waits for the result and then offers to open it (Figma "modal"). */
export function TimeOverDialog({
  open,
  ready,
  failed,
  onOpenResult,
  onRetry,
}: TimeOverDialogProps) {
  const copy = t.learning.attempt.timeOver;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <p role="status" aria-live="polite" className="text-body-sm text-muted-foreground">
          {failed ? (
            <span className="text-input-error-text">{copy.error}</span>
          ) : ready ? (
            ''
          ) : (
            copy.finishing
          )}
        </p>

        <AlertDialogFooter>
          {failed ? (
            <Button type="button" onClick={onRetry} className="flex-1">
              {t.learning.common.retry}
            </Button>
          ) : (
            <Button type="button" disabled={!ready} onClick={onOpenResult} className="flex-1">
              {copy.cta}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
