import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface PageBackHeaderProps {
  title: string;
  /** Muted line under the title (for example the topic the test belongs to). */
  subtitle?: string;
  /** Shows a back arrow that links here. */
  backHref?: string;
  /** Shows a back arrow that runs this instead of navigating (used to confirm leaving a test). */
  onBack?: () => void;
  backLabel?: string;
  /** Right-aligned controls. */
  actions?: ReactNode;
  className?: string;
}

const ARROW_CLASS = 'text-foreground hover:text-primary shrink-0 rounded-full transition-colors';

/** Title row of the learning screens (Figma "title-bar"): back arrow, title, subtitle and actions. */
export function PageBackHeader({
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = t.learning.common.back,
  actions,
  className,
}: PageBackHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label={backLabel} className={ARROW_CLASS}>
            <ChevronLeft className="size-7" aria-hidden />
          </button>
        ) : backHref ? (
          <Link href={backHref} aria-label={backLabel} className={ARROW_CLASS}>
            <ChevronLeft className="size-7" aria-hidden />
          </Link>
        ) : null}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-title text-foreground break-words">{title}</h1>
          {subtitle ? <p className="text-body-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
