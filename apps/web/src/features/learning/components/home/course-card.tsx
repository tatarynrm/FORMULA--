import type { SubjectProgress } from '@formula/shared';
import { Lock, LockOpen } from 'lucide-react';

import { LinkButton } from '@/components/common/link-button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { LEARNING_ROUTES } from '../../utils/paths';

/** Subject tile of the home screen: subtopics counter, progress bar and a link to the subject (Figma "course-card"). */
export function CourseCard({ course }: { course: SubjectProgress }) {
  const copy = t.learning.home.course;
  const hasAccess = course.subtopicsAccessible > 0;
  const hasLocked = course.subtopicsAccessible < course.subtopicsTotal;

  return (
    <article className="bg-surface-raised border-input flex flex-col gap-4 rounded-2xl border p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-h3 text-foreground line-clamp-2 min-w-0 flex-1 font-bold break-words">
          {course.title}
        </h3>
        {hasAccess ? (
          <Badge variant="brand" className="px-4">
            {format(copy.subtopicsBadge, {
              done: course.subtopicsDone,
              total: course.subtopicsAccessible,
            })}
          </Badge>
        ) : null}
      </div>

      {course.description ? (
        <p className="text-body-sm text-muted-foreground line-clamp-2">{course.description}</p>
      ) : null}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-body-xs text-muted-foreground font-medium">{copy.progressLabel}</p>
          <p className="text-body-md text-foreground font-semibold">{course.percent}%</p>
        </div>
        <Progress value={course.percent} aria-label={copy.progressLabel} />
      </div>

      {course.hasFullAccess ? (
        <p className="text-body-xs text-primary flex items-center gap-1.5 font-medium">
          <LockOpen className="size-4 shrink-0" aria-hidden />
          {copy.allOpen}
        </p>
      ) : null}

      {hasLocked ? (
        <p className="text-body-xs text-muted-foreground flex items-center gap-1.5">
          <Lock className="size-4 shrink-0" aria-hidden />
          {hasAccess
            ? format(copy.accessible, {
                accessible: course.subtopicsAccessible,
                total: course.subtopicsTotal,
              })
            : copy.noAccess}
        </p>
      ) : null}

      <LinkButton href={LEARNING_ROUTES.subject(course.subjectId)} className="w-full">
        {copy.goToStudy}
      </LinkButton>
    </article>
  );
}
