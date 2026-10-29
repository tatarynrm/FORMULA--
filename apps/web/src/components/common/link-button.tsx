import Link from 'next/link';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'asChild'> & {
  href: ComponentProps<typeof Link>['href'];
};

/** Brand button rendered as a Next.js link (keeps client-side navigation and prefetch). */
export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  return (
    <Button asChild {...props}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
