'use client';

import { MESSENGER_LINK, type MessengerBotLink, type MessengerBotStatus } from '@formula/shared';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ApiClientError } from '@/lib/api-client';
import { format } from '@/lib/format';
import { t } from '@/locales';

import {
  useBotNotifications,
  useCreateBotLink,
  useMessengerBot,
  useUnlinkBot,
} from '../hooks/use-messenger-bot';

const PROVIDER = 'telegram' as const;

/** The address of the bot itself, for a person who already pressed "Start" and only owes the phone. */
function botUrl(status: MessengerBotStatus): string | null {
  return status.botUsername ? `https://t.me/${status.botUsername}` : null;
}

/**
 * The Telegram bot "Formula" in the profile. The person asks for a one-time link, opens the bot,
 * presses Start and shares their phone (the bot requires it); until then the card waits and then
 * switches by itself. Afterwards it shows who is connected and lets them mute or disconnect.
 */
export function TelegramBotCard() {
  const copy = t.contacts.bot;
  const [link, setLink] = useState<MessengerBotLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = useMessengerBot(PROVIDER, link !== null);
  const createLink = useCreateBotLink(PROVIDER);
  const unlink = useUnlinkBot(PROVIDER);
  const notifications = useBotNotifications(PROVIDER);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  function failure(cause: unknown): string {
    return cause instanceof ApiClientError && cause.statusCode === 503
      ? copy.unavailable
      : copy.actionError;
  }

  function connect() {
    setError(null);
    createLink.mutate(undefined, {
      onSuccess: setLink,
      onError: (cause) => setError(failure(cause)),
    });
  }

  if (status.isPending) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }
  if (status.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-body-sm text-destructive">{copy.loadError}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void status.refetch()}>
          {copy.retry}
        </Button>
      </div>
    );
  }

  const bot = status.data;
  // The link is only useful until the person is connected.
  const waitingLink = bot.linked && !bot.awaitingPhone ? null : link;

  return (
    <div className="bg-surface-soft border-border flex flex-col gap-4 rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          <Send className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body-md text-foreground font-bold">{copy.title}</h3>
            {bot.linked && !bot.awaitingPhone ? (
              <Badge className="bg-success-soft text-success border-transparent">
                {copy.connected}
              </Badge>
            ) : null}
          </div>
          <p className="text-body-sm text-muted-foreground">{copy.description}</p>
        </div>
      </div>

      {!bot.configured ? (
        <p role="status" className="text-body-sm text-muted-foreground">
          {copy.notConfigured}
        </p>
      ) : bot.linked && !bot.awaitingPhone ? (
        <>
          <ul className="text-body-sm text-text-secondary flex flex-col gap-1">
            {bot.username ? <li>{format(copy.account, { name: bot.username })}</li> : null}
            {bot.phone ? <li>{format(copy.phone, { phone: bot.phone })}</li> : null}
          </ul>
          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-body-md text-foreground font-medium">{copy.notifications}</span>
              <span className="text-body-xs text-muted-foreground">{copy.notificationsHint}</span>
            </span>
            <Switch
              checked={bot.notificationsEnabled}
              disabled={notifications.isPending}
              onCheckedChange={(enabled) => {
                setError(null);
                notifications.mutate(enabled, { onError: (cause) => setError(failure(cause)) });
              }}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={unlink.isPending}
            onClick={() => setConfirmUnlink(true)}
          >
            {copy.disconnect}
          </Button>
        </>
      ) : (
        <>
          {bot.linked && bot.awaitingPhone ? (
            <p role="status" className="text-body-sm text-foreground">
              {copy.awaitingPhone}
            </p>
          ) : (
            <p className="text-body-sm text-muted-foreground">{copy.phoneRequired}</p>
          )}

          {waitingLink ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild>
                  <a href={waitingLink.url} target="_blank" rel="noopener noreferrer">
                    <Send />
                    {copy.openBot}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={createLink.isPending}
                  onClick={connect}
                >
                  {copy.newLink}
                </Button>
              </div>
              <p className="text-body-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {copy.waiting}{' '}
                {format(copy.linkHint, { minutes: MESSENGER_LINK.TOKEN_TTL_MINUTES })}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {bot.linked && botUrl(bot) ? (
                <Button asChild>
                  <a href={botUrl(bot) ?? '#'} target="_blank" rel="noopener noreferrer">
                    <Send />
                    {copy.openBot}
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                variant={bot.linked ? 'secondary' : 'default'}
                disabled={createLink.isPending}
                onClick={connect}
              >
                {createLink.isPending ? copy.connecting : bot.linked ? copy.newLink : copy.connect}
              </Button>
            </div>
          )}
        </>
      )}

      {error ? (
        <p role="alert" className="text-body-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AlertDialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.disconnectTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.disconnectDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setError(null);
                setLink(null);
                unlink.mutate(undefined, { onError: (cause) => setError(failure(cause)) });
              }}
            >
              {copy.disconnect}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
