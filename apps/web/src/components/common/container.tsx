import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Page-width wrapper: 16px gutters on mobile, 24px from md. Content is 1224px wide on desktop (Figma). */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-318 px-4 md:px-6', className)} {...props} />;
}
