'use client';

import { useRouter } from 'next/navigation';

import { t } from '@/locales';

import { ProfileForm } from './profile-form';

/** "Tell us about yourself" step shown once after sign-up. It can be skipped. */
export function OnboardingCard({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const copy = t.profile.onboarding;

  return (
    <div className="bg-card flex w-full max-w-150 flex-col gap-6 rounded-2xl p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-body-xl text-foreground font-bold">{copy.title}</h1>
        <p className="text-body-md text-input-placeholder">{copy.subtitle}</p>
      </div>
      <ProfileForm onboarding onDone={() => router.replace(redirectTo)} />
    </div>
  );
}
