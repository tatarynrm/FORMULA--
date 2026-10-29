import type { Metadata } from 'next';

import { OnboardingCard } from '@/features/profile/components/onboarding-card';
import { getSafeRedirect } from '@/features/auth/utils';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.profile.onboarding.title };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return <OnboardingCard redirectTo={getSafeRedirect(next) ?? '/cabinet'} />;
}
