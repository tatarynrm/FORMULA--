'use client';

import { TESTS, type TestCollection } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
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

import { useTestMutations } from '../hooks/use-admin-tests';
import { type CreateTestFormValues, createTestFormSchema } from '../schemas';
import { describeApiError } from '../utils/api-error';
import { TEST_TEXT_LIMITS, parseYear } from '../utils/test-settings';
import { ErrorNotice } from './error-notice';
import { TestKindPicker } from './test-kind-picker';

interface CreateTestDialogProps {
  /** The list the test is added to. The two tests of a subtopic are created inside the subtopic. */
  collection: Exclude<TestCollection, 'subtopic'>;
  /** Values already used by other tests, offered as suggestions so the filters stay tidy. */
  categories?: readonly string[];
  specialties?: readonly string[];
  onClose: () => void;
}

/**
 * "Новий тест" of a base, booklet or AMPS list: the kind (fixed after creation), a title, the
 * category, year and specialty. Creating the test opens its editor. Mount it only while it is open.
 */
export function CreateTestDialog({
  collection,
  categories = [],
  specialties = [],
  onClose,
}: CreateTestDialogProps) {
  const copy = t.adminContent.tests.create;
  const router = useRouter();
  const { create } = useTestMutations();
  const listId = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Keeps the form locked while the browser opens the new test.
  const [created, setCreated] = useState(false);

  const form = useForm<CreateTestFormValues>({
    resolver: zodResolver(createTestFormSchema),
    defaultValues: { kind: 'choice', title: '', category: '', year: '', specialty: '' },
  });
  const busy = form.formState.isSubmitting || created;

  async function submit(values: CreateTestFormValues) {
    setSubmitError(null);
    try {
      const test = await create.mutateAsync({
        kind: values.kind,
        collection,
        title: values.title,
        category: values.category || null,
        year: parseYear(values.year) ?? null,
        specialty: values.specialty || null,
      });
      setCreated(true);
      router.push(`/admin/tests/${test.id}`);
    } catch (error) {
      setSubmitError(describeApiError(error, copy.error));
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
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.hint}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <TestKindPicker value={field.value} onChange={field.onChange} />
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.name}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={copy.namePlaceholder}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {copy.category}
                    <span className="text-muted-foreground font-normal">
                      ({t.adminContent.common.optional})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      list={`${listId}-categories`}
                      placeholder={copy.categoryPlaceholder}
                      maxLength={TEST_TEXT_LIMITS.category}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy.year}
                      <span className="text-muted-foreground font-normal">
                        ({t.adminContent.common.optional})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder={copy.yearPlaceholder}
                        maxLength={4}
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
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {copy.specialty}
                      <span className="text-muted-foreground font-normal">
                        ({t.adminContent.common.optional})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        list={`${listId}-specialties`}
                        placeholder={copy.specialtyPlaceholder}
                        maxLength={TEST_TEXT_LIMITS.specialty}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-body-xs text-muted-foreground">{copy.freeTextHint}</p>

            <datalist id={`${listId}-categories`}>
              {categories.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
            <datalist id={`${listId}-specialties`}>
              {specialties.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>

            <ErrorNotice message={submitError} />

            <DialogFooter>
              <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                {t.adminContent.common.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? t.adminContent.common.creating : copy.submit}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
