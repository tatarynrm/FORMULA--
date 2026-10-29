import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SubjectScreen } from '@/features/learning/components/subject/subject-screen';
import { isUuid } from '@/features/learning/utils/ids';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.subject.pageTitle };

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  return <SubjectScreen subjectId={id} />;
}
