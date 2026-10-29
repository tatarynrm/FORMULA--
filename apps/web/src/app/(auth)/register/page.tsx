import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';
import { getSafeRedirect } from '@/features/auth/utils';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.auth.tabs.register };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthCard active="register" title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <RegisterForm redirectTo={getSafeRedirect(next)} />
    </AuthCard>
  );
}
