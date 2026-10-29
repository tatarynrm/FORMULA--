'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { LinkButton } from '@/components/common/link-button';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { useSubjectMutations } from '../hooks/use-subjects';
import { type SubjectFormValues, subjectFormSchema } from '../schemas';
import { describeApiError } from '../utils/api-error';
import { AdminPageHeader } from './admin-page-header';
import { ErrorNotice } from './error-notice';
import { SubjectForm } from './subject-form';

/** "New subject" page: a title and an optional description; creating it opens the subject page. */
export function NewSubjectForm() {
  const copy = t.adminContent.subjects.form;
  const router = useRouter();
  const { create } = useSubjectMutations();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Keeps the button disabled while the browser navigates to the new subject.
  const [created, setCreated] = useState(false);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: { title: '', description: '' },
  });

  async function submit(values: SubjectFormValues) {
    setSubmitError(null);
    try {
      const subject = await create.mutateAsync({
        title: values.title,
        ...(values.description ? { description: values.description } : {}),
      });
      setCreated(true);
      router.replace(`/admin/subjects/${subject.id}`);
    } catch (error) {
      setSubmitError(describeApiError(error, copy.error));
    }
  }

  const busy = form.formState.isSubmitting || created;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t.admin.subjects.newTitle} backHref="/admin" />

      <div className="bg-surface-raised border-input flex max-w-2xl flex-col gap-4 rounded-3xl border p-4 md:p-6">
        <p className="text-body-sm text-text-secondary">{copy.hint}</p>
        <SubjectForm
          form={form}
          onSubmit={form.handleSubmit(submit)}
          className="flex flex-col gap-4"
        >
          <ErrorNotice message={submitError} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? t.adminContent.common.creating : copy.submit}
            </Button>
            <LinkButton href="/admin" variant="secondary">
              {t.adminContent.common.cancel}
            </LinkButton>
          </div>
        </SubjectForm>
      </div>
    </div>
  );
}
