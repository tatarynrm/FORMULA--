'use client';

import type { StudentTestSummary } from '@formula/shared';
import { Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useToggleFavorite } from '../../hooks/use-tests';

interface FavoriteButtonProps {
  test: Pick<StudentTestSummary, 'id' | 'title' | 'isFavorite'>;
  className?: string;
}

/** Bookmark that saves a test to "Збережені" and back. The change shows at once. */
export function FavoriteButton({ test, className }: FavoriteButtonProps) {
  const toggle = useToggleFavorite();
  const copy = t.learning.tests.favorite;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={test.isFavorite}
      aria-label={`${copy.add}: ${test.title}`}
      title={test.isFavorite ? copy.remove : copy.add}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ testId: test.id, favorite: !test.isFavorite })}
      className={cn('text-text-secondary shrink-0', className)}
    >
      <Bookmark className={cn(test.isFavorite && 'fill-primary text-primary')} aria-hidden />
    </Button>
  );
}
