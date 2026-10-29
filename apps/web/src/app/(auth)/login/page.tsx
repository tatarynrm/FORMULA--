import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { getSafeRedirect } from '@/features/auth/utils';
import { createPageMetadata } from '@/lib/seo';
import { t } from '@/locales';

// Not indexed (see the auth layout), but people share these links, so the preview matters.
export const metadata: Metadata = createPageMetadata({
  title: t.auth.tabs.login,
  description: t.meta.login.description,
  path: '/login',
  index: false,
});

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
