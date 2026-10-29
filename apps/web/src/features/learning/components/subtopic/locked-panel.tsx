import { Lock } from 'lucide-react';

import { LinkButton } from '@/components/common/link-button';
import { t } from '@/locales';

import { LEARNING_ROUTES } from '../../utils/paths';

/**
 * Shown instead of the materials and tests of a subtopic the student has no access to. Access is given
 * by an admin for now, so there is nothing to click except the way back (no payment button yet).
 */
export function LockedPanel({ subjectId }: { subjectId: string }) {
  const copy = t.learning.subtopic.locked;

  return (
    <div
      role="status"
      className="border-border bg-surface-raised rounded-base flex flex-col items-center gap-4 border border-dashed px-6 py-16 text-center"
    >
      <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
        <Lock className="size-8" aria-hidden />
      </span>
      <h2 className="text-h3 text-foreground">{copy.title}</h2>
      <p className="text-body-md text-muted-foreground max-w-md">{copy.description}</p>
      <LinkButton href={LEARNING_ROUTES.subject(subjectId)} variant="secondary">
        {copy.backToSubject}
      </LinkButton>
    </div>
  );
}
