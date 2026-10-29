'use client';

import type { StaffMember } from '@formula/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError } from '@/lib/api-client';
import { useMenuEditor } from '@/features/menu/hooks/use-menu';
import { t } from '@/locales';

import { useStaffMutations } from '../hooks/use-staff';

interface StaffDialogProps {
  /** `null` adds a new subadmin, a member edits their sections. */
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Add a subadmin or change which sections one may use. Sections are the admin menu items. */
export function StaffDialog({ member, open, onOpenChange }: StaffDialogProps) {
  const copy = t.admin.staff.dialog;
  const editing = member !== null;
  const sections = useMenuEditor('admin');
  const { create, updatePermissions } = useStaffMutations();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(member?.permissions));

  const mutation = editing ? updatePermissions : create;
  const grantable = (sections.data ?? []).filter((item) => !item.superadminOnly);

  function toggle(key: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function submit() {
    const permissions = [...selected];
    const options = { onSuccess: () => onOpenChange(false) };

    if (editing) {
      updatePermissions.mutate({ id: member.id, permissions }, options);
      return;
    }
    create.mutate(
      {
        email,
        permissions,
        ...(name ? { name } : {}),
        ...(surname ? { surname } : {}),
        ...(password ? { password } : {}),
      },
      options,
    );
  }

  const error = mutation.error;
  const errorMessage =
    error instanceof ApiClientError && error.statusCode === 400 && !editing
      ? `${copy.error}. ${copy.needDetails}`
      : error
        ? copy.error
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `${copy.editTitle}: ${member.name} ${member.surname}` : copy.addTitle}
          </DialogTitle>
          {!editing ? <DialogDescription>{copy.addHint}</DialogDescription> : null}
        </DialogHeader>

        <form
          method="post"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {!editing ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-email">{copy.email}</Label>
                <Input
                  id="staff-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="staff-name">{copy.name}</Label>
                  <Input
                    id="staff-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="staff-surname">{copy.surname}</Label>
                  <Input
                    id="staff-surname"
                    value={surname}
                    onChange={(event) => setSurname(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-password">{copy.password}</Label>
                <Input
                  id="staff-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-body-md text-foreground mb-1 font-bold">{copy.sections}</legend>
            {grantable.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <Checkbox
                  id={`section-${item.key}`}
                  checked={selected.has(item.key)}
                  onCheckedChange={(checked) => toggle(item.key, checked === true)}
                />
                <Label htmlFor={`section-${item.key}`} className="text-body-md font-normal">
                  {item.label}
                </Label>
              </div>
            ))}
          </fieldset>

          {errorMessage ? (
            <p role="alert" className="text-body-sm text-input-error-text">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={mutation.isPending || (!editing && !email)}>
              {mutation.isPending ? t.common.loading : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
