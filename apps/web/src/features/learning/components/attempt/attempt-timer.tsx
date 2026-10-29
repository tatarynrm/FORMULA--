'use client';

import { Clock } from 'lucide-react';
import { useEffect, useEffectEvent } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { TIMER_WARNING_SECONDS } from '../../constants';
import { useRemainingSeconds } from '../../hooks/use-remaining-seconds';
import { formatClock } from '../../utils/time';

interface AttemptTimerProps {
  /** When the attempt ends (ISO, server clock). */
  deadlineAt: string;
  /** Server clock minus device clock (ms), so a wrong clock on the device does not change the countdown. */
  clockOffsetMs: number;
  /** Called once when the countdown reaches zero (also right away if the deadline already passed). */
  onExpire: () => void;
}

/**
 * Countdown of a timed attempt (Figma "02:44"). It turns red for the last minute, says so in a polite
 * live region (the clock itself is not announced every second), and ends the attempt at zero.
 */
export function AttemptTimer({ deadlineAt, clockOffsetMs, onExpire }: AttemptTimerProps) {
  const copy = t.learning.attempt;
  const remaining = useRemainingSeconds(deadlineAt, clockOffsetMs) ?? 0;
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    if (remaining === 0) expire();
  }, [remaining]);

  const warning = remaining > 0 && remaining <= TIMER_WARNING_SECONDS;
  const message = remaining === 0 ? copy.timerOver : warning ? copy.timerWarning : '';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        role="timer"
        aria-label={copy.timerLabel}
        className={cn(
          'text-body-lg flex items-center gap-2 font-bold tabular-nums',
          warning || remaining === 0 ? 'text-destructive' : 'text-primary',
        )}
      >
        <Clock className="size-5" aria-hidden />
        {formatClock(remaining)}
      </span>
      <p role="status" aria-live="polite" className="text-body-sm text-destructive font-medium">
        {message}
      </p>
    </div>
  );
}
