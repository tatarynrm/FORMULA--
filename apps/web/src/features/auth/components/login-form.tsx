'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import { useLogin } from '../hooks/use-auth-mutations';
import { type LoginFormValues, loginFormSchema } from '../schemas';
import { getAuthErrorMessage } from '../utils';
import { FormDivider } from './auth-card';
import { GoogleButton } from './google-button';
import { PasswordInput } from './password-input';

interface LoginFormProps {
  redirectTo?: string;
  /** Message to show at once, e.g. after a Google sign-in that did not go through. */
  notice?: string | null;
}

export function LoginForm({ redirectTo, notice }: LoginFormProps) {
  const login = useLogin(redirectTo);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const errorMessage = getAuthErrorMessage(login.error) ?? notice ?? null;

  function onSubmit({ email, password }: LoginFormValues) {
    // TODO: honor rememberMe (session cookie vs. persistent cookie) once it is needed.
    login.mutate({ email, password });
  }

  return (
    <Form {...form}>
      {/* method="post": if the form is submitted before the page is interactive, the browser must
          never put the email and password into the address bar (a GET would). */}
      <form
        method="post"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.auth.emailLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t.auth.emailPlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.auth.passwordLabel}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder={t.auth.passwordPlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="text-input-placeholder text-body-xs font-normal">
                  {t.auth.rememberMe}
                </FormLabel>
              </FormItem>
            )}
          />
          {/* TODO: password reset flow (needs email sending). */}
          <Link href="#" className="text-primary text-body-xs hover:underline">
            {t.auth.forgotPassword}
          </Link>
        </div>

        {errorMessage ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? t.common.loading : t.auth.loginSubmit}
        </Button>

        <FormDivider />
        <GoogleButton next={redirectTo} />

        <p className="text-body-sm text-input-placeholder text-center">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="text-primary hover:underline">
            {t.auth.registerSubmit}
          </Link>
        </p>
      </form>
    </Form>
  );
}
