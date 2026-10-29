'use client';

import { ERROR_CODES } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/features/auth/components/password-input';
import { useChangePassword } from '@/features/auth/hooks/use-auth-mutations';
import { ApiClientError } from '@/lib/api-client';
import { t } from '@/locales';

import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

import { type PasswordFormValues, createPasswordFormSchema } from '../schemas';

const EMPTY: PasswordFormValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Change the password. The api ends the other sessions, so a stolen session stops working. */
export function PasswordForm() {
  const copy = t.profile.security;
  const changePassword = useChangePassword();
  const [done, setDone] = useState(false);
  // A Google account without a password sets its first one: no current password to ask for.
  const { data: user } = useCurrentUser();
  const hasPassword = user?.hasPassword ?? true;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(createPasswordFormSchema(hasPassword)),
    defaultValues: EMPTY,
  });

  function onSubmit({ currentPassword, newPassword }: PasswordFormValues) {
    setDone(false);
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setDone(true);
          form.reset(EMPTY);
        },
      },
    );
  }

  const error = changePassword.error;
  const errorMessage = !error
    ? null
    : error instanceof ApiClientError && error.code === ERROR_CODES.INVALID_CREDENTIALS
      ? copy.wrongCurrent
      : t.profile.saveError;

  return (
    <Form {...form}>
      <form
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {hasPassword ? (
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.currentPassword}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <p className="text-body-sm text-muted-foreground">{copy.noPasswordYet}</p>
        )}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.newPassword}</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t.auth.passwordPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.confirmPassword}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {errorMessage}
          </p>
        ) : null}
        {done ? (
          <p role="status" className="text-body-sm text-success">
            {copy.success}
          </p>
        ) : null}

        <Button type="submit" disabled={changePassword.isPending} className="self-start">
          {changePassword.isPending ? t.common.loading : hasPassword ? copy.submit : copy.setFirst}
        </Button>
      </form>
    </Form>
  );
}
