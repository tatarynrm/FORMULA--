import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface LogoProps {
  href?: string;
  /** `lg` is the footer variant, `xl` the dashboard sidebar variant. */
  size?: 'md' | 'lg' | 'xl';
  /**
   * The same logo with a light "electric current" running along the bonds (an SVG with its own
   * CSS animation; it stops by itself when the visitor prefers reduced motion). Used on the
   * public pages; the cabinet and the admin keep the static logo.
   */
  animated?: boolean;
  className?: string;
}

const LOGO_SRC = {
  still: { default: '/landing/logo.svg', footer: '/landing/logo-footer.svg' },
  animated: { default: '/landing/logo-live.svg', footer: '/landing/logo-footer-live.svg' },
} as const;

export function Logo({ href = '/', size = 'md', animated = false, className }: LogoProps) {
  const variant = animated ? LOGO_SRC.animated : LOGO_SRC.still;

  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', size === 'xl' ? 'gap-3.5' : 'gap-3', className)}
    >
      <Image
        src={size === 'lg' ? variant.footer : variant.default}
        alt=""
        // The animated files carry 4 px of empty room on every side, so the glow of the outer
        // hearts is not cut off by the image box; the negative margin gives that room back.
        width={animated ? 52 : 44}
        height={animated ? 41 : 33}
        unoptimized
        priority={size !== 'lg'}
        // `xl` scales the logo to 40 px high (x1.21), so its box and the margin that gives the
        // padding back scale too: 41 units = 3.1 rem, 4 units = 0.3 rem.
        className={cn(
          size === 'xl' && (animated ? 'h-[3.1rem] w-auto' : 'h-10 w-auto'),
          animated && (size === 'xl' ? '-m-[0.3rem]' : '-m-1'),
        )}
      />
      <span
        className={cn(
          'text-foreground',
          size === 'md' && 'text-h3',
          size === 'lg' && 'text-body-xl font-semibold',
          size === 'xl' && 'text-body-xl font-bold',
        )}
      >
        {t.brand.name}
      </span>
    </Link>
  );
}
