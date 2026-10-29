'use client';

import { TESTIMONIALS } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { PhoneInput } from '@/components/common/phone-input';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { ApiClientError } from '@/lib/api-client';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useMyTestimonials, useSubmitTestimonial } from '../hooks/use-testimonials';
import { type TestimonialFormValues, createTestimonialFormSchema } from '../schemas';
import { RatingInput } from './rating-input';

const EMPTY: TestimonialFormValues = {
  name: '',
  surname: '',
  email: '',
  phone: '',
  rating: 0,
  text: '',
  website: '',
};

/** The message for a failed submit, from the status of the api answer. */
function submitErrorMessage(error: unknown): string {
  const copy = t.testimonials.form.errors;
  if (error instanceof ApiClientError) {
    if (error.statusCode === 409) return copy.pending;
    if (error.statusCode === 429) return copy.tooMany;
  }
  return copy.generic;
}

interface TestimonialFormProps {
  /** Called when the person closes the "thank you" screen. */
  onDone?: () => void;
  /** Where to send a guest who wants to sign in first. */
  loginNext?: string;
}

/**
 * Write a testimonial. A signed-in author is shown as who they are (name and photo come from the
 * account, nothing to type); a guest types a name and a surname. Either way it goes to moderation.
 */
export function TestimonialForm({ onDone, loginNext = '/' }: TestimonialFormProps) {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label={t.common.loading}>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return <FormBody user={user ?? null} onDone={onDone} loginNext={loginNext} />;
}

interface FormBodyProps extends TestimonialFormProps {
  user: { name: string; surname: string; email: string; avatarFileId: string | null } | null;
}

function FormBody({ user, onDone, loginNext }: FormBodyProps) {
  const copy = t.testimonials.form;
  const requireName = user === null;
  const submit = useSubmitTestimonial();
  const mine = useMyTestimonials(!requireName);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(createTestimonialFormSchema(requireName)),
    defaultValues: EMPTY,
  });
  const typed = useWatch({ control: form.control, name: 'text' });
  const hasPending = mine.data?.some((item) => item.status === 'pending') ?? false;

  function onSubmit(values: TestimonialFormValues) {
    setError(null);
    submit.mutate(
      {
        text: values.text,
        rating: values.rating,
        website: values.website,
        ...(values.phone ? { phone: values.phone } : {}),
        // A signed-in author sends no name and no email: the api takes them from the account.
        ...(requireName ? { name: values.name, surname: values.surname, email: values.email } : {}),
      },
      {
        onSuccess: () => setSent(true),
        onError: (failure) => setError(submitErrorMessage(failure)),
      },
    );
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
        <CircleCheck className="text-success size-12" aria-hidden />
        <p className="text-h3 text-foreground">{copy.success.title}</p>
        <p className="text-body-md text-muted-foreground max-w-sm">{copy.success.description}</p>
        {onDone ? (
          <Button type="button" variant="secondary" onClick={onDone}>
            {copy.success.close}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {user ? (
          <div className="bg-surface-soft flex items-center gap-3 rounded-2xl p-4">
            <UserAvatar name={user.name} fileId={user.avatarFileId} size="md" />
            <div className="flex min-w-0 flex-col">
              <span className="text-body-xs text-muted-foreground">{copy.signedInAs}</span>
              <span className="text-body-md text-foreground truncate font-semibold">
                {user.name} {user.surname}
              </span>
              <span className="text-body-sm text-muted-foreground truncate">
                {copy.emailFromAccount}: {user.email}
              </span>
              <span className="text-body-xs text-muted-foreground">
                {copy.signedInHint} {user.avatarFileId ? copy.avatarHint : null}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-muted-foreground">
              {copy.guestHint}{' '}
              <Link
                href={`/login?next=${encodeURIComponent(loginNext ?? '/')}`}
                className="text-primary font-semibold underline-offset-4 hover:underline"
              >
                {copy.login}
              </Link>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.name}</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
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
                    <FormLabel>{copy.surname}</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.email}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" inputMode="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {copy.phone}{' '}
                <span className="text-muted-foreground font-normal">({copy.phoneOptional})</span>
              </FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                {copy.phoneHint}. {copy.contactsNote}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field, fieldState }) => (
            <FormItem>
              <span id="testimonial-rating-label" className="text-body-md font-medium">
                {copy.rating}
              </span>
              <RatingInput
                value={field.value}
                onChange={field.onChange}
                labelledBy="testimonial-rating-label"
                invalid={fieldState.invalid}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.text}</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  maxLength={TESTIMONIALS.TEXT_MAX_LENGTH}
                  placeholder={copy.textPlaceholder}
                  className="bg-surface-raised text-body-md text-foreground placeholder:text-input-placeholder min-h-32 rounded-2xl px-4 py-3 shadow-none"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right">
                {format(copy.counter, { count: typed.length, max: TESTIMONIALS.TEXT_MAX_LENGTH })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* A bot trap: invisible to people and to screen readers, but a script fills every input. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="sr-only"
          {...form.register('website')}
        />

        {hasPending ? (
          <p role="status" className="text-body-sm text-muted-foreground">
            {t.testimonials.feedbackPage.pendingNote}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-body-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={submit.isPending || hasPending}
          className="self-stretch sm:self-end"
        >
          {submit.isPending ? copy.submitting : copy.submit}
        </Button>
      </form>
    </Form>
  );
}
