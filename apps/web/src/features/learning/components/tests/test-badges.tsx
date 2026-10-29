import type { AttemptStatus, TestKind } from '@formula/shared';
import { Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { format, pluralizeUk } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { formatDuration } from '../../utils/time';

/** "З варіантами" or "Ситуаційний": tells the student what kind of answers the test expects. */
export function KindBadge({ kind }: { kind: TestKind }) {
  return (
    <span
      className={cn(
        'text-body-xs inline-flex items-center rounded-full px-3 py-1 font-medium whitespace-nowrap',
        kind === 'situational'
          ? 'bg-accent-blue/10 text-accent-blue'
          : 'bg-secondary text-text-secondary',
      )}
    >
      {t.learning.tests.kinds[kind]}
    </span>
  );
}

/** Time limit of a test, "Час: 10 хв". */
export function TimeLimitLabel({ seconds }: { seconds: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Clock className="size-4" aria-hidden />
      {format(t.learning.tests.timeLimit, { duration: formatDuration(seconds) })}
    </span>
  );
}

const STATUS_STYLES: Record<AttemptStatus, string> = {
  in_progress: 'bg-muted text-foreground',
  completed: 'bg-success-soft text-success',
  reviewed: 'bg-success-soft text-success',
  pending_review: 'bg-accent-blue/10 text-accent-blue',
};

/** State of one attempt: unfinished, finished, waiting for a review, reviewed. */
export function AttemptStatusPill({
  status,
  className,
}: {
  status: AttemptStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-body-xs inline-flex items-center rounded-full px-3 py-1 font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {t.learning.tests.history.statuses[status]}
    </span>
  );
}

interface MistakesBadgeProps {
  count: number;
  /** When set, the badge opens the result with the mistakes. */
  href?: string;
}

/** Pink pill with the number of questions answered wrong or skipped (Figma "mistakes"). */
export function MistakesBadge({ count, href }: MistakesBadgeProps) {
  const word = pluralizeUk(count, t.learning.common.questions);

  const content = (
    <>
      <Image src="/cabinet/icon-mistake.svg" alt="" width={36} height={36} unoptimized />
      <span className="flex flex-col whitespace-nowrap">
        <span className="text-body-md text-foreground truncate font-bold">
          {t.learning.tests.mistakes}
        </span>
        <span className="text-body-sm text-muted-foreground font-medium">
          {format(t.learning.common.count, { count, word })}
        </span>
      </span>
    </>
  );
  const className = 'bg-primary/10 flex items-center gap-2 rounded-full py-2 pr-6 pl-4';

  if (!href) return <div className={className}>{content}</div>;

  return (
    <Link
      href={href}
      aria-label={format(t.learning.tests.mistakesLink, { count, word })}
      className={cn(
        className,
        'hover:bg-primary/20 focus-visible:ring-ring transition-colors outline-none focus-visible:ring-[3px]',
      )}
    >
      {content}
    </Link>
  );
}

/** Replaces the ring while a written test waits for the review. */
export function PendingReviewBadge() {
  return (
    <span className="bg-accent-blue/10 text-accent-blue text-body-sm inline-flex items-center rounded-full px-4 py-2 font-medium whitespace-nowrap">
      {t.learning.tests.pendingReview}
    </span>
  );
}
