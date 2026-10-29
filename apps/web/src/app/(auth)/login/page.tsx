import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { getSafeRedirect } from '@/features/auth/utils';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.auth.tabs.login };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  // The api sends the browser here with `?error=google` when a Google sign-in did not go through.
  const notice = error === 'google' ? t.auth.errors.google : null;

  return (
    <AuthCard active="login" title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <LoginForm redirectTo={getSafeRedirect(next)} notice={notice} />
    </AuthCard>
  );
}
