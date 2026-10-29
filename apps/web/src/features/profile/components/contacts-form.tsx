'use client';

import {
  MESSENGERS,
  type Messenger,
  type Profile,
  UA_PHONE_PATTERN,
  normalizeTelegramUsername,
} from '@formula/shared';
import { useState } from 'react';

import { PhoneInput } from '@/components/common/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessengerBot } from '@/features/messengers/hooks/use-messenger-bot';
import { format } from '@/lib/format';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useUpdateProfile } from '../hooks/use-profile';

interface ContactsFormProps {
  profile: Profile;
  /** Kept by the parent: after a save the form is rebuilt from the new values, and would forget it. */
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
}

/** A phone and the messengers a person uses; for a Telegram user also the nickname. */
export function ContactsForm({ profile, saved, onSavedChange }: ContactsFormProps) {
  const copy = t.contacts;
  const update = useUpdateProfile();
  const bot = useMessengerBot('telegram');

  const savedNick = profile.messengers.find((item) => item.kind === 'telegram')?.username ?? '';
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [selected, setSelected] = useState<readonly Messenger[]>(
    profile.messengers.map((item) => item.kind),
  );
  const [nick, setNick] = useState(savedNick);
  const [touched, setTouched] = useState(false);

  const usesTelegram = selected.includes('telegram');
  const nickText = nick.trim();
  const nickValue = nickText === '' ? null : normalizeTelegramUsername(nickText);
  const phoneInvalid = phone !== '' && !UA_PHONE_PATTERN.test(phone);
  const nickInvalid = usesTelegram && nickText !== '' && nickValue === null;
  const dirty =
    phone !== (profile.phone ?? '') ||
    nickText !== savedNick ||
    selected.length !== profile.messengers.length ||
    selected.some((kind) => !profile.messengers.some((item) => item.kind === kind));

  function toggle(kind: Messenger) {
    onSavedChange(false);
    setSelected((current) =>
      current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
    );
  }

  function submit() {
    setTouched(true);
    if (phoneInvalid || nickInvalid) return;
    onSavedChange(false);
    update.mutate(
      {
        phone: phone === '' ? null : phone,
        messengers: selected.map((kind) => ({
          kind,
          username: kind === 'telegram' ? nickValue : null,
        })),
      },
      { onSuccess: () => onSavedChange(true) },
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="contacts-phone" className="text-body-md text-foreground font-medium">
          {copy.phone.label}{' '}
          <span className="text-muted-foreground font-normal">({copy.phone.optional})</span>
        </label>
        <PhoneInput
          id="contacts-phone"
          value={phone}
          onChange={(value) => {
            onSavedChange(false);
            setPhone(value);
          }}
          aria-invalid={touched && phoneInvalid ? true : undefined}
          aria-describedby="contacts-phone-hint"
        />
        <p
          id="contacts-phone-hint"
          className={cn(
            'text-body-xs',
            touched && phoneInvalid ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {touched && phoneInvalid ? copy.phone.invalid : copy.phone.hint}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span id="contacts-messengers" className="text-body-md text-foreground font-medium">
          {copy.messengers.label}
        </span>
        <div role="group" aria-labelledby="contacts-messengers" className="flex flex-wrap gap-2">
          {MESSENGERS.map((kind) => {
            const on = selected.includes(kind);
            return (
              <button
                key={kind}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(kind)}
                className={cn(
                  'text-body-md rounded-full border px-5 py-2.5 font-medium transition-colors',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-surface-raised text-text-secondary hover:border-primary hover:text-primary',
                )}
              >
                {copy.messengers.options[kind]}
              </button>
            );
          })}
        </div>
      </div>

      {usesTelegram ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="contacts-telegram" className="text-body-md text-foreground font-medium">
            {copy.telegramNick.label}{' '}
            <span className="text-muted-foreground font-normal">
              ({copy.telegramNick.optional})
            </span>
          </label>
          <Input
            id="contacts-telegram"
            value={nick}
            placeholder={copy.telegramNick.placeholder}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={touched && nickInvalid ? true : undefined}
            aria-describedby="contacts-telegram-hint"
            onChange={(event) => {
              onSavedChange(false);
              setNick(event.target.value);
            }}
          />
          <p
            id="contacts-telegram-hint"
            className={cn(
              'text-body-xs',
              touched && nickInvalid ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {touched && nickInvalid ? copy.telegramNick.invalid : copy.telegramNick.hint}
            {/* Someone who connected the bot has a nickname there already. */}
            {bot.data?.username && nickText === ''
              ? ` ${format(copy.telegramNick.fromBot, { name: bot.data.username })}`
              : null}
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={update.isPending || !dirty} className="self-start">
          {update.isPending ? copy.saving : copy.save}
        </Button>
        {saved && !dirty ? (
          <span role="status" className="text-body-sm text-success">
            {copy.saved}
          </span>
        ) : null}
      </div>
      {update.isError ? (
        <p role="alert" className="text-body-sm text-destructive">
          {copy.saveError}
        </p>
      ) : null}
    </form>
  );
}
