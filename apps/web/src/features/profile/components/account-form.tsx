'use client';

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
import { Input } from '@/components/ui/input';
import { t } from '@/locales';

import { useUpdateProfile } from '../hooks/use-profile';
import { type AccountFormValues, accountFormSchema } from '../schemas';

interface AccountFormProps {
  name: string;
  surname: string;
  email: string;
}

/** Name and surname are editable; the email is shown but cannot be changed yet. */
export function AccountForm({ name, surname, email }: AccountFormProps) {
  const copy = t.profile.account;
  const update = useUpdateProfile();
  const [saved, setSaved] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name, surname },
  });

  function onSubmit(values: AccountFormValues) {
    setSaved(false);
    update.mutate(values, { onSuccess: () => setSaved(true) });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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

        <div className="flex flex-col gap-1">
          <label htmlFor="profile-email" className="text-body-md text-foreground font-medium">
            {copy.email}
          </label>
          <Input id="profile-email" value={email} readOnly disabled autoComplete="email" />
          <p className="text-body-xs text-muted-foreground">{copy.emailHint}</p>
        </div>

        {update.isError ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {t.profile.saveError}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-body-sm text-success">
            {t.profile.saved}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={update.isPending || !form.formState.isDirty}
          className="self-start"
        >
          {update.isPending ? t.common.loading : t.profile.save}
        </Button>
      </form>
    </Form>
  );
}
