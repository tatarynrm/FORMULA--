import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { LOGO_PATHS } from './logo-paths';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  /** Fills the available height and centers the logo (use inside a page or panel). */
  fill?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'w-11',
  md: 'w-20',
  lg: 'w-32',
} as const;

/**
 * Formula logo with light impulses running along its lines. Shown while we wait for data.
 * The animation lives in globals.css (`.logo-pulse`) and is off for reduced-motion visitors,
 * who just see the static logo.
 */
export function LogoLoader({ size = 'md', fill = false, className }: LogoLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t.common.loading}
      className={cn('flex items-center justify-center', fill && 'min-h-[60dvh] w-full', className)}
    >
      <svg
        viewBox="0 0 44 33"
        fill="none"
        aria-hidden
        className={cn('logo-loader overflow-visible', SIZES[size])}
      >
        {/* Base logo */}
        <g className="logo-breathe">
          {LOGO_PATHS.map((path, index) => (
            <path
              key={index}
              d={path.d}
              className={path.kind === 'atom' ? 'fill-primary/50' : 'fill-foreground'}
            />
          ))}
        </g>

        {/* Impulses: a short bright dash travels along the outline of every line */}
        <g className="logo-pulse-group">
          {LOGO_PATHS.map((path, index) =>
            path.kind === 'line' ? (
              <path
                key={index}
                d={path.d}
                pathLength={100}
                className="logo-pulse stroke-primary"
                strokeWidth={0.9}
                strokeLinecap="round"
                style={{ '--i': index } as CSSProperties}
              />
            ) : null,
          )}
        </g>
      </svg>
    </div>
  );
}
