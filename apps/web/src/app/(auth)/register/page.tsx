import type { Metadata } from 'next';

import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';
import { getSafeRedirect } from '@/features/auth/utils';
import { createPageMetadata } from '@/lib/seo';
import { t } from '@/locales';

// Not indexed (see the auth layout), but people share these links, so the preview matters.
export const metadata: Metadata = createPageMetadata({
  title: t.auth.tabs.register,
  description: t.meta.register.description,
  path: '/register',
  index: false,
});

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
