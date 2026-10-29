import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface LogoProps {
  href?: string;
  /** `lg` is the footer variant, `xl` the dashboard sidebar variant. */
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

export function Logo({ href = '/', size = 'md', className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', size === 'xl' ? 'gap-3.5' : 'gap-3', className)}
    >
      <Image
        src={size === 'lg' ? '/landing/logo-footer.svg' : '/landing/logo.svg'}
        alt=""
        width={44}
        height={33}
        unoptimized
        priority={size !== 'lg'}
        className={size === 'xl' ? 'h-10 w-auto' : undefined}
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
