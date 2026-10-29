'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { t } from '@/locales';

interface FreeSubtopicSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Hint text; defaults to the one used in the "add subtopic" dialog. */
  hint?: string;
}

/** "Безкоштовна підтема" switch: free subtopics are open to everyone, paid ones need an access grant. */
export function FreeSubtopicSwitch({
  checked,
  onCheckedChange,
  disabled,
  hint,
}: FreeSubtopicSwitchProps) {
  const copy = t.adminContent.subtopics;
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={hintId}
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id}>{copy.freeLabel}</Label>
        <p id={hintId} className="text-body-xs text-muted-foreground">
          {hint ?? copy.freeHint}
        </p>
      </div>
    </div>
  );
}
