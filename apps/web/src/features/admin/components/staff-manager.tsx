'use client';

import type { StaffMember } from '@formula/shared';
import { Plus, ShieldCheck, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMenuEditor } from '@/features/menu/hooks/use-menu';
import { t } from '@/locales';

import { useStaff, useStaffMutations } from '../hooks/use-staff';
import { AdminPageHeader } from './admin-page-header';
import { StaffDialog } from './staff-dialog';

/** Team page: every admin, their level and (for subadmins) the sections they may use. */
export function StaffManager() {
  const copy = t.admin.staff;
  const { data: staff, isPending, isError } = useStaff();
  const sections = useMenuEditor('admin');
  const { remove } = useStaffMutations();

  // `dialogMember` is `undefined` while closed, `null` when adding.
  const [dialogMember, setDialogMember] = useState<StaffMember | null | undefined>(undefined);
  const [toRemove, setToRemove] = useState<StaffMember | null>(null);

  const sectionLabels = new Map((sections.data ?? []).map((item) => [item.key, item.label]));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={copy.title}
        actions={
          <Button onClick={() => setDialogMember(null)}>
            <Plus />
            {copy.add}
          </Button>
        }
      />
      <p className="text-body-md text-text-secondary">{copy.intro}</p>

      {isError ? (
        <EmptyState title={copy.loadError} />
      ) : isPending ? (
        <LogoLoader size="lg" fill />
      ) : staff.length === 0 ? (
        <EmptyState title={copy.empty} />
      ) : (
        <ul className="flex flex-col gap-2">
          {staff.map((member) => (
            <li
              key={member.id}
              className="bg-surface-raised border-input flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-body-md text-foreground font-bold">
                    {member.name} {member.surname}
                  </p>
                  <Badge variant={member.adminLevel === 'superadmin' ? 'brand' : 'secondary'}>
                    {member.adminLevel === 'superadmin' ? <ShieldCheck /> : null}
                    {copy.levels[member.adminLevel]}
                  </Badge>
                </div>
                <p className="text-body-sm text-muted-foreground truncate">{member.email}</p>
                <p className="text-body-sm text-text-secondary">
                  {member.adminLevel === 'superadmin'
                    ? copy.allSections
                    : member.permissions.length === 0
                      ? copy.noSections
                      : member.permissions.map((key) => sectionLabels.get(key) ?? key).join(', ')}
                </p>
              </div>

              {member.adminLevel === 'subadmin' ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setDialogMember(member)}>
                    <SquarePen />
                    {copy.editPermissions}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={copy.remove}
                    className="text-text-secondary"
                    onClick={() => setToRemove(member)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {dialogMember !== undefined ? (
        <StaffDialog
          // A new key per target resets the form state.
          key={dialogMember?.id ?? 'new'}
          member={dialogMember}
          open
          onOpenChange={(open) => {
            if (!open) setDialogMember(undefined);
          }}
        />
      ) : null}

      <AlertDialog open={toRemove !== null} onOpenChange={(open) => !open && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.removeDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toRemove) remove.mutate(toRemove.id);
              }}
            >
              {copy.removeConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
