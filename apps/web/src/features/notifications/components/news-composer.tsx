'use client';

import { NOTIFICATIONS, type NotificationBroadcast } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { describeApiError } from '@/features/admin/utils/api-error';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useSendNews } from '../hooks/use-news';
import { type NewsFormValues, newsFormSchema } from '../schemas';

const EMPTY: NewsFormValues = { title: '', body: '', link: '' };

/** The "Нова новина" form: title, text, optional site link, confirmation, then the result. */
export function NewsComposer() {
  const copy = t.notifications.news;
  const send = useSendNews();
  const [confirming, setConfirming] = useState<NewsFormValues | null>(null);
  const [sent, setSent] = useState<NotificationBroadcast | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: EMPTY,
  });
  const [titleValue, bodyValue] = useWatch({ control: form.control, name: ['title', 'body'] });

  async function confirm() {
    const values = confirming;
    if (!values) return;
    setConfirming(null);
    setSent(null);
    setError(null);
    try {
      const broadcast = await send.mutateAsync({
        title: values.title,
        body: values.body,
        link: values.link === '' ? null : values.link,
      });
      setSent(broadcast);
      form.reset(EMPTY);
    } catch (failure) {
      setError(describeApiError(failure, copy.composer.error));
    }
  }

  const sentNotice = sent
    ? sent.recipients > 0
      ? format(copy.sent, {
          count: sent.recipients,
          noun: pluralizeUk(sent.recipients, copy.history.recipientsForms),
        })
      : copy.sentNobody
    : null;

  return (
    <section className="bg-surface-raised border-input flex flex-col gap-5 rounded-3xl border p-5 md:p-6">
      <h2 className="text-h3 text-foreground">{copy.composer.title}</h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => setConfirming(values))}
          className="flex flex-col gap-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.composer.titleLabel}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={copy.composer.titlePlaceholder}
                    maxLength={NOTIFICATIONS.TITLE_MAX_LENGTH}
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {format(copy.composer.counter, {
                    count: titleValue.length,
                    max: NOTIFICATIONS.TITLE_MAX_LENGTH,
                  })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.composer.bodyLabel}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={copy.composer.bodyPlaceholder}
                    maxLength={NOTIFICATIONS.BODY_MAX_LENGTH}
                    rows={5}
                    className="bg-surface-raised text-body-md text-foreground placeholder:text-input-placeholder min-h-32 rounded-2xl px-4 py-3 shadow-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {format(copy.composer.counter, {
                    count: bodyValue.length,
                    max: NOTIFICATIONS.BODY_MAX_LENGTH,
                  })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {copy.composer.linkLabel}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({t.adminContent.common.optional})
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={copy.composer.linkPlaceholder}
                    maxLength={NOTIFICATIONS.LINK_MAX_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{copy.composer.linkHint}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? (
            <p role="alert" className="text-body-sm text-input-error-text">
              {error}
            </p>
          ) : null}
          {sentNotice ? (
            <p
              role="status"
              className="bg-success-soft text-success text-body-sm rounded-2xl px-4 py-3 font-medium"
            >
              {sentNotice}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? copy.composer.sending : copy.composer.submit}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setConfirming(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.confirm.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirm()}>
              {copy.confirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
