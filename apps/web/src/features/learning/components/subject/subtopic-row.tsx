import type { StudentSubtopicSummary } from '@formula/shared';
import { ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { LEARNING_ROUTES } from '../../utils/paths';

/**
 * One subtopic of a topic. An open one is a link to its page. A locked one explains why it is locked
 * (subtopics are opened by an admin for now) and is not clickable.
 */
export function SubtopicRow({ subtopic }: { subtopic: StudentSubtopicSummary }) {
  const common = t.learning.common;
  const testsText =
    subtopic.testCount > 0
      ? format(common.count, {
          count: subtopic.testCount,
          word: pluralizeUk(subtopic.testCount, common.tests),
        })
      : null;

  if (!subtopic.hasAccess) {
    return (
      <div className="text-muted-foreground flex items-center justify-between gap-3 rounded-xl px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-body-md break-words">{subtopic.title}</span>
          <span className="text-body-xs">{common.accessHint}</span>
        </div>
        <span className="text-body-sm flex shrink-0 items-center gap-1.5 font-medium">
          <Lock className="size-4" aria-hidden />
          {common.locked}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={LEARNING_ROUTES.subtopic(subtopic.id)}
      className="hover:bg-accent focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors outline-none focus-visible:ring-[3px]"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-body-md text-foreground break-words">{subtopic.title}</span>
        {testsText ? <span className="text-body-xs text-muted-foreground">{testsText}</span> : null}
      </span>
      <span className="text-muted-foreground flex shrink-0 items-center gap-3">
        {subtopic.isFree ? (
          <Badge variant="brand" className="text-primary">
            {common.free}
          </Badge>
        ) : null}
        <ChevronRight className="size-5" aria-hidden />
      </span>
    </Link>
  );
}
