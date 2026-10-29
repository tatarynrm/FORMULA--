'use client';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import type { ContentStatus } from '../types';

interface StatusToggleButtonProps {
  status: ContentStatus;
  onToggle: (next: ContentStatus) => void;
  disabled?: boolean;
}

/** "Опублікувати" for a draft, "Зняти з публікації" for a published item. */
export function StatusToggleButton({ status, onToggle, disabled }: StatusToggleButtonProps) {
  const published = status === 'published';

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onToggle(published ? 'draft' : 'published')}
    >
      {published ? <EyeOff /> : <Eye />}
      {published ? t.adminContent.common.unpublish : t.adminContent.common.publish}
    </Button>
  );
}
