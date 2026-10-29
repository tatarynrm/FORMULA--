'use client';

import { TESTS } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { type NameFormValues, nameFormSchema } from '../schemas';
import { describeApiError } from '../utils/api-error';
import { ErrorNotice } from './error-notice';

interface TextFieldDialogProps {
  title: string;
  /** One line under the title, e.g. which topic a subtopic is added to. */
  description?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel: string;
  /** Said when the request fails, e.g. "Не вдалося додати тему". */
  errorFallback: string;
  /** More form fields under the name (for example the "free subtopic" switch). */
  children?: ReactNode;
  /** Sends the name. The dialog closes when this resolves and shows the error when it rejects. */
  onSubmit: (value: string) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Small modal with one required name field: add a topic or subtopic, rename a topic, subtopic or
 * material. Mount it only while it is open, so every opening starts with a clean form.
 */
export function TextFieldDialog({
  title,
  description,
  label,
  placeholder,
  initialValue = '',
  submitLabel,
  errorFallback,
  children,
  onSubmit,
  onClose,
}: TextFieldDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<NameFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { title: initialValue },
  });
  const { isSubmitting } = form.formState;

  async function submit(values: NameFormValues) {
    setSubmitError(null);
    try {
      await onSubmit(values.title);
      onClose();
    } catch (error) {
      setSubmitError(describeApiError(error, errorFallback));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      {/* Without a description Radix would warn about a missing `aria-describedby`. */}
      <DialogContent {...(description ? {} : { 'aria-describedby': undefined })}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={placeholder}
                      maxLength={TESTS.TITLE_MAX_LENGTH}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {children}

            <ErrorNotice message={submitError} />

            <DialogFooter>
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
                {t.adminContent.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.adminContent.common.saving : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
