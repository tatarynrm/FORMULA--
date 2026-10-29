'use client';

import type { InstitutionKind, Profile, UpdateProfileInput } from '@formula/shared';
import { useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/locales';

import { useProfile, useProfileOptions, useUpdateProfile } from '../hooks/use-profile';
import { OptionPills } from './option-pills';

interface ProfileFormProps {
  /** Called after the profile was saved (or onboarding skipped). */
  onDone?: () => void;
  /** Shows "Skip" and finishes onboarding on save. */
  onboarding?: boolean;
}

/** Status, goal and institution. Used by the onboarding step after sign-up and by the profile page. */
export function ProfileForm({ onDone, onboarding = false }: ProfileFormProps) {
  const options = useProfileOptions();
  const profile = useProfile();

  if (options.isError || profile.isError) {
    return (
      <p role="alert" className="text-body-sm text-input-error-text">
        {t.profile.loadError}
      </p>
    );
  }
  if (!options.data || !profile.data) {
    return <LogoLoader size="md" className="min-h-60" />;
  }

  // Keyed by the saved profile so the fields reset from fresh server data, never from stale local state.
  return (
    <Fields options={options.data} initial={profile.data} onDone={onDone} onboarding={onboarding} />
  );
}

function Fields({
  options,
  initial,
  onDone,
  onboarding,
}: {
  options: {
    statuses: { code: string; label: string }[];
    goals: { code: string; label: string }[];
  };
  initial: Profile;
  onDone?: () => void;
  onboarding: boolean;
}) {
  const copy = t.profile;
  const update = useUpdateProfile();

  const [statusCode, setStatusCode] = useState(initial.statusCode);
  const [goalCode, setGoalCode] = useState(initial.goalCode);
  const [kind, setKind] = useState<InstitutionKind>(initial.institutionKind ?? 'university');
  const [institutionName, setInstitutionName] = useState(initial.institutionName ?? '');
  const [saved, setSaved] = useState(false);

  function submit(input: UpdateProfileInput) {
    setSaved(false);
    update.mutate(input, {
      onSuccess: () => {
        setSaved(true);
        onDone?.();
      },
    });
  }

  function save() {
    const name = institutionName.trim();
    submit({
      statusCode,
      goalCode,
      institutionKind: name ? kind : null,
      institutionName: name || null,
      completeOnboarding: onboarding || undefined,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-body-md text-foreground font-bold">{copy.status}</h2>
        <OptionPills
          label={copy.status}
          options={options.statuses}
          value={statusCode}
          onChange={setStatusCode}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body-md text-foreground font-bold">{copy.goal}</h2>
        <OptionPills
          label={copy.goal}
          options={options.goals}
          value={goalCode}
          onChange={setGoalCode}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body-md text-foreground font-bold">{copy.institution}</h2>
        <SegmentedControl
          label={copy.institution}
          value={kind}
          onValueChange={setKind}
          items={[
            { id: 'university', label: copy.institutionKinds.university },
            { id: 'other', label: copy.institutionKinds.other },
          ]}
        />
        <Input
          value={institutionName}
          onChange={(event) => setInstitutionName(event.target.value)}
          maxLength={200}
          aria-label={copy.institution}
          placeholder={copy.institutionPlaceholders[kind]}
        />
      </section>

      {update.isError ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {copy.saveError}
        </p>
      ) : null}
      {saved && !onboarding ? (
        <p role="status" className="text-body-sm text-success">
          {copy.saved}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={save} disabled={update.isPending} className="sm:flex-1">
          {update.isPending ? t.common.loading : onboarding ? copy.onboarding.submit : copy.save}
        </Button>
        {onboarding ? (
          <Button
            type="button"
            variant="secondary"
            disabled={update.isPending}
            onClick={() => submit({ completeOnboarding: true })}
          >
            {copy.onboarding.skip}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
