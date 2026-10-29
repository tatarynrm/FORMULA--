'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';

import { MaskIcon } from '@/components/common/mask-icon';
import { UserAvatar } from '@/components/common/user-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogout } from '@/features/auth/hooks/use-auth-mutations';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { t } from '@/locales';

/** Profile card at the bottom of the sidebar: avatar, name, role and a gear (opens the profile and its settings) and logout (with a confirmation modal). */
export function UserCard() {
  const { data: user, isPending } = useCurrentUser();
  const logout = useLogout();
  const dialog = t.common.logoutDialog;

  return (
    <div className="bg-card flex flex-col gap-4 rounded-2xl p-4">
      <Link
        href={user?.role === 'admin' ? '/admin/profile' : '/cabinet/profile'}
        aria-label={t.profile.page.title}
        className="group flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <UserAvatar name={user?.name ?? ''} fileId={user?.avatarFileId} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {isPending || !user ? (
            <>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <p className="text-body-sm text-foreground truncate font-bold">
                {user.name} {user.surname}
              </p>
              <p className="text-muted-foreground truncate text-xs font-medium">
                {user.adminLevel
                  ? t.cabinet.userCard.adminLevels[user.adminLevel]
                  : t.cabinet.userCard.roles[user.role]}
              </p>
            </>
          )}
        </div>
        {/* The gear tells people the profile and its settings are behind this card. */}
        <span className="bg-accent text-muted-foreground group-hover:text-primary flex size-8 shrink-0 items-center justify-center rounded-full transition-colors">
          <Settings
            className="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-90"
            aria-hidden
          />
        </span>
      </Link>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="secondary" className="w-full" disabled={logout.isPending}>
            <MaskIcon src="/cabinet/icon-log-out.svg" className="size-6" />
            {t.common.logout}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dialog.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => logout.mutate()}>{dialog.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
