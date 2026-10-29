'use client';

import { useId, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { format } from '@/lib/format';
import { t } from '@/locales';

/**
 * For the actions that cannot be undone: the person must type this text (a name, an email) before
 * the button works, so nothing is deleted by an unlucky click.
 */
export interface RequiredText {
  /** What has to be typed. */
  value: string;
  /** What it is, in the sentence "Введіть {kind}": for example "назву" or "пошту студента". */
  kind: string;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Runs when the admin confirms. The dialog closes at once; the page shows a failure itself. */
  onConfirm: () => void;
  /** Ask to type this text first; the confirm button stays off until it matches. */
  requireText?: RequiredText;
}

/** Trimmed, spaces collapsed, case ignored: «  Біологія » matches «біологія». */
function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The typing box of the dialog. It lives inside the dialog content, so it is empty on every opening. */
function TypedConfirmation({
  required,
  onMatch,
}: {
  required: RequiredText;
  onMatch: (matches: boolean) => void;
}) {
  const copy = t.adminContent.common.typeToConfirm;
  const inputId = useId();
  const [typed, setTyped] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-body-sm text-foreground">
        {format(copy.prompt, { kind: required.kind })}
      </label>
      <p
        className="bg-surface-soft border-border text-body-md text-foreground rounded-2xl border px-4 py-2 font-semibold break-words select-all"
        data-testid="required-text"
      >
        {required.value}
      </p>
      <Input
        id={inputId}
        value={typed}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={copy.placeholder}
        onChange={(event) => {
          setTyped(event.target.value);
          onMatch(normalize(event.target.value) === normalize(required.value));
        }}
      />
    </div>
  );
}

/**
 * "Are you sure?" modal for destructive actions (deleting content, finishing a review). With
 * `requireText` the admin must also type a name or an email before it can be confirmed.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  requireText,
}: ConfirmDialogProps) {
  const [matches, setMatches] = useState(false);
  const blocked = Boolean(requireText) && !matches;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // A fresh opening starts with an empty box, so it starts "not confirmed" too.
        if (!next) setMatches(false);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireText ? <TypedConfirmation required={requireText} onMatch={setMatches} /> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t.adminContent.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={blocked}
            onClick={(event) => {
              if (blocked) {
                event.preventDefault();
                return;
              }
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
