import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AttemptScreen } from '@/features/learning/components/attempt/attempt-screen';
import { isUuid } from '@/features/learning/utils/ids';
import { safeOrigin } from '@/features/learning/utils/paths';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.attempt.pageTitle };

interface AttemptPageProps {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}

export default async function AttemptPage({ params, searchParams }: AttemptPageProps) {
  const [{ attemptId }, { from }] = await Promise.all([params, searchParams]);
  if (!isUuid(attemptId)) notFound();

  return (
    <AttemptScreen
      attemptId={attemptId}
      from={safeOrigin(typeof from === 'string' ? from : null)}
    />
  );
}
