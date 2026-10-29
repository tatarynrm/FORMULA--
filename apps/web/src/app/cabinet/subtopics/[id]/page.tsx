import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SubtopicScreen } from '@/features/learning/components/subtopic/subtopic-screen';
import { isUuid } from '@/features/learning/utils/ids';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.subtopic.pageTitle };

interface SubtopicPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function SubtopicPage({ params, searchParams }: SubtopicPageProps) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();

  // `?tab=tests` opens the tests tab, which is where "back to subtopic" from a test result leads.
  return <SubtopicScreen subtopicId={id} initialTab={tab === 'tests' ? 'tests' : 'materials'} />;
}
