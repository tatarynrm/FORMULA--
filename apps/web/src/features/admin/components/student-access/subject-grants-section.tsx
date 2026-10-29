'use client';

import type { SubjectGrant } from '@formula/shared';
import { useMemo, useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../../hooks/use-action-notice';
import { useAccessMutations, useSubjectGrants } from '../../hooks/use-student-access';
import { useSubjects } from '../../hooks/use-subjects';
import { ConfirmDialog } from '../confirm-dialog';
import { ErrorNotice } from '../error-notice';
import { GrantRow } from './grant-row';

interface SubjectGrantsSectionProps {
  userId: string;
  studentName: string;
}

/**
 * "Весь предмет": opens every subtopic of a subject for the student, including subtopics added
 * later. Lists the subjects already opened (with revoke) and offers the rest in a picker.
 */
export function SubjectGrantsSection({ userId, studentName }: SubjectGrantsSectionProps) {
  const copy = t.adminContent.access.subject;
  const grants = useSubjectGrants(userId, true);
  const subjects = useSubjects();
  const { grantSubject, revokeSubject } = useAccessMutations(userId);
  const { notice, run } = useActionNotice();
  const [selected, setSelected] = useState('');
  const [toRevoke, setToRevoke] = useState<SubjectGrant | null>(null);

  const available = useMemo(() => {
    const granted = new Set((grants.data ?? []).map((grant) => grant.subjectId));
    return (subjects.data ?? []).filter((subject) => !granted.has(subject.id));
  }, [grants.data, subjects.data]);
  // A subject that was just opened leaves the picker, so the old choice is dropped.
  const selectedValue = available.some((subject) => subject.id === selected) ? selected : '';

  return (
    <section
      aria-labelledby="access-subject-title"
      className="bg-background border-input flex flex-col gap-3 rounded-2xl border p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="access-subject-title" className="text-body-lg text-foreground font-bold">
          {copy.title}
        </h3>
        <p className="text-body-sm text-text-secondary">{copy.hint}</p>
      </div>

      {grants.isError || subjects.isError ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {t.adminContent.access.loadError}
        </p>
      ) : grants.isPending || subjects.isPending ? (
        <LogoLoader size="sm" className="py-4" />
      ) : (
        <>
          <ErrorNotice message={notice} />

          <div className="flex flex-col gap-2">
            <h4 className="text-body-md text-foreground font-semibold">{copy.current}</h4>
            {grants.data.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">{copy.none}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {grants.data.map((grant) => (
                  <GrantRow
                    key={grant.subjectId}
                    title={grant.subjectTitle}
                    subtitle={copy.covers}
                    source={grant.source}
                    createdAt={grant.createdAt}
                    revokeLabel={format(copy.revokeFor, { title: grant.subjectTitle })}
                    onRevoke={() => setToRevoke(grant)}
                  />
                ))}
              </ul>
            )}
          </div>

          {subjects.data.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{copy.noSubjects}</p>
          ) : available.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{copy.nothingToAdd}</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="access-subject">{copy.pick}</Label>
                <Select value={selectedValue} onValueChange={setSelected}>
                  <SelectTrigger
                    id="access-subject"
                    className="bg-surface-raised border-input text-body-md text-foreground w-full rounded-full px-4 shadow-none data-[size=default]:h-12"
                  >
                    <SelectValue placeholder={copy.pickPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.status === 'draft'
                          ? `${subject.title} · ${copy.draft}`
                          : subject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                disabled={selectedValue === '' || grantSubject.isPending}
                onClick={() => {
                  void run(async () => {
                    await grantSubject.mutateAsync(selectedValue);
                    setSelected('');
                  }, copy.grantError);
                }}
              >
                {grantSubject.isPending ? copy.granting : copy.grant}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setToRevoke(null);
        }}
        title={copy.revokeTitle}
        description={format(copy.revokeDescription, {
          name: studentName,
          title: toRevoke?.subjectTitle ?? '',
        })}
        confirmLabel={copy.revokeConfirm}
        onConfirm={() => {
          if (toRevoke) {
            void run(() => revokeSubject.mutateAsync(toRevoke.subjectId), copy.revokeError);
          }
        }}
      />
    </section>
  );
}
