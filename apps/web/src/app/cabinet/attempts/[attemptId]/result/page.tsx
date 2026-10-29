import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ResultScreen } from '@/features/learning/components/result/result-screen';
import { isUuid } from '@/features/learning/utils/ids';
import { safeOrigin } from '@/features/learning/utils/paths';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.result.pageTitle };

interface ResultPageProps {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const [{ attemptId }, { from }] = await Promise.all([params, searchParams]);
  if (!isUuid(attemptId)) notFound();

  return (
    <ResultScreen attemptId={attemptId} from={safeOrigin(typeof from === 'string' ? from : null)} />
  );
}
