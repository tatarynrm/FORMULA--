'use client';

import { TESTS } from '@formula/shared';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

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

import { SUBJECT_DESCRIPTION_MAX, type SubjectFormValues } from '../schemas';
import { AdminTextarea } from './admin-textarea';

interface SubjectFormProps {
  form: UseFormReturn<SubjectFormValues>;
  onSubmit: () => void;
  /** Buttons and messages under the two fields. */
  children: ReactNode;
  className?: string;
}

/** Title and description of a subject, shared by the "new subject" page and the edit dialog. */
export function SubjectForm({ form, onSubmit, children, className }: SubjectFormProps) {
  const copy = t.adminContent.subjects.form;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className={className} noValidate>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.title}</FormLabel>
              <FormControl>
                <Input
                  placeholder={copy.titlePlaceholder}
                  maxLength={TESTS.TITLE_MAX_LENGTH}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {copy.description}
                <span className="text-muted-foreground font-normal">
                  ({t.adminContent.common.optional})
                </span>
              </FormLabel>
              <FormControl>
                <AdminTextarea
                  placeholder={copy.descriptionPlaceholder}
                  maxLength={SUBJECT_DESCRIPTION_MAX}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {children}
      </form>
    </Form>
  );
}
