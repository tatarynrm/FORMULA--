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

import { useRegister } from '../hooks/use-auth-mutations';
import { type RegisterFormValues, registerFormSchema } from '../schemas';
import { getAuthErrorMessage } from '../utils';
import { FormDivider } from './auth-card';
import { GoogleButton } from './google-button';
import { PasswordInput } from './password-input';

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const register = useRegister(redirectTo);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', surname: '', email: '', password: '', acceptTerms: false },
  });

  const errorMessage = getAuthErrorMessage(register.error);

  function onSubmit({ name, surname, email, password }: RegisterFormValues) {
    register.mutate({ name, surname, email, password });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.auth.nameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="given-name"
                      placeholder={t.auth.namePlaceholder}
                      {...field}
                    />
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
                  <FormLabel>{t.auth.surnameLabel}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="family-name"
                      placeholder={t.auth.surnamePlaceholder}
                      {...field}
                    />
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
                    autoComplete="new-password"
                    placeholder={t.auth.passwordPlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="text-input-placeholder text-body-xs font-normal">
                  {t.auth.acceptTerms}
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={register.isPending} className="w-full">
          {register.isPending ? t.common.loading : t.auth.registerSubmit}
        </Button>

        <FormDivider />
        <GoogleButton next={redirectTo} />

        <p className="text-body-sm text-input-placeholder text-center">
          {t.auth.hasAccount}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t.auth.loginSubmit}
          </Link>
        </p>
      </form>
    </Form>
  );
}
