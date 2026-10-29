import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface ProgressRingProps {
  /** 0 to 100 */
  value: number;
  className?: string;
}

const SIZE = 64;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 64px circular progress with the percentage in the middle (Figma "Counter"). */
export function ProgressRing({ value, className }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      role="progressbar"
      aria-label={t.cabinet.tests.progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn('relative size-16 shrink-0', className)}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border"
        />
        {clamped > 0 ? (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="stroke-primary"
          />
        ) : null}
      </svg>
      <span className="text-body-md text-primary absolute inset-0 flex items-center justify-center font-semibold">
        {clamped}%
      </span>
    </div>
  );
}
