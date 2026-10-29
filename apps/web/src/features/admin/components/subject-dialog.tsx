'use client';

import type { AdminSubject } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { t } from '@/locales';

import { useSubjectMutations } from '../hooks/use-subjects';
import { type SubjectFormValues, subjectFormSchema } from '../schemas';
import { describeApiError } from '../utils/api-error';
import { ErrorNotice } from './error-notice';
import { SubjectForm } from './subject-form';

interface SubjectDialogProps {
  subject: AdminSubject;
  onClose: () => void;
}

/** Edit the title and the description of a subject. Mount it only while it is open. */
export function SubjectDialog({ subject, onClose }: SubjectDialogProps) {
  const copy = t.adminContent.subject;
  const { update } = useSubjectMutations();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: { title: subject.title, description: subject.description ?? '' },
  });
  const { isSubmitting } = form.formState;

  async function submit(values: SubjectFormValues) {
    setSubmitError(null);
    try {
      await update.mutateAsync({
        id: subject.id,
        // An empty description clears it.
        patch: { title: values.title, description: values.description || null },
      });
      onClose();
    } catch (error) {
      setSubmitError(describeApiError(error, copy.editError));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{copy.editTitle}</DialogTitle>
        </DialogHeader>

        <SubjectForm
          form={form}
          onSubmit={form.handleSubmit(submit)}
          className="flex flex-col gap-4"
        >
          <ErrorNotice message={submitError} />
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
              {t.adminContent.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.adminContent.common.saving : t.adminContent.common.save}
            </Button>
          </DialogFooter>
        </SubjectForm>
      </DialogContent>
    </Dialog>
  );
}
