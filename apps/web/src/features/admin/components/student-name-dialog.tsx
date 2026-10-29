'use client';

import { AUTH } from '@formula/shared';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { t } from '@/locales';

import { type StudentNameFormValues, studentNameFormSchema } from '../schemas';
import { describeApiError } from '../utils/api-error';
import { ErrorNotice } from './error-notice';

interface StudentNameDialogProps {
  name: string;
  surname: string;
  /** Sends the new name; the dialog closes when it resolves. */
  onSubmit: (values: StudentNameFormValues) => Promise<unknown>;
  onClose: () => void;
}

/** "Редагувати ім'я" of a student: first name and surname. Mount it only while it is open. */
export function StudentNameDialog({ name, surname, onSubmit, onClose }: StudentNameDialogProps) {
  const copy = t.adminContent.students;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<StudentNameFormValues>({
    resolver: zodResolver(studentNameFormSchema),
    defaultValues: { name, surname },
  });
  const busy = form.formState.isSubmitting;

  async function submit(values: StudentNameFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      setSubmitError(describeApiError(error, copy.editError));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.editTitle}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.nameLabel}</FormLabel>
                  <FormControl>
                    <Input maxLength={AUTH.NAME_MAX_LENGTH} autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.surnameLabel}</FormLabel>
                  <FormControl>
                    <Input maxLength={AUTH.SURNAME_MAX_LENGTH} autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ErrorNotice message={submitError} />

            <DialogFooter>
              <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                {t.adminContent.common.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? t.adminContent.common.saving : t.adminContent.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
