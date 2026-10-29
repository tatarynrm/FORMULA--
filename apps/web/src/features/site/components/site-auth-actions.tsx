'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { LinkButton } from '@/components/common/link-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '@/features/auth/api/auth-api';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

interface SiteAuthActionsProps {
  /** `row` in the header (hidden below `md`), `column` in the mobile sheet. */
  layout: 'row' | 'column';
  onNavigate?: () => void;
  className?: string;
}

/**
 * Auth buttons of the public header. A guest sees "sign in / register"; a signed-in user sees the
 * way into their cabinet (or admin panel) and a sign-out button that keeps them on the page.
 */
export function SiteAuthActions({ layout, onNavigate, className }: SiteAuthActionsProps) {
  const { data: user, isPending } = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const copy = t.site.nav;

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.refresh();
      onNavigate?.();
    },
  });

  const row = layout === 'row';
  const buttonClass = row ? 'px-9' : undefined;

  if (isPending) {
    return (
      <div className={cn(row ? 'flex items-center gap-2' : 'flex flex-col gap-2', className)}>
        <Skeleton className={row ? 'h-11 w-28 rounded-full' : 'h-11 w-full rounded-full'} />
        <Skeleton className={row ? 'h-11 w-40 rounded-full' : 'h-11 w-full rounded-full'} />
      </div>
    );
  }

  if (user) {
    const isAdmin = user.role === 'admin';
    return (
      <div className={cn(row ? 'flex items-center gap-2' : 'flex flex-col gap-2', className)}>
        <Button
          type="button"
          variant="secondary"
          className={buttonClass}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {copy.logout}
        </Button>
        <LinkButton href={isAdmin ? '/admin' : '/cabinet'} onClick={onNavigate}>
          {isAdmin ? copy.adminPanel : copy.cabinet}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className={cn(row ? 'flex items-center gap-2' : 'flex flex-col gap-2', className)}>
      <LinkButton href="/login" variant="secondary" className={buttonClass} onClick={onNavigate}>
        {copy.login}
      </LinkButton>
      <LinkButton href="/register" onClick={onNavigate}>
        {copy.register}
      </LinkButton>
    </div>
  );
}
