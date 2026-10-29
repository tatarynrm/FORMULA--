import type { Metadata } from 'next';

import { SubjectEditor } from '@/features/admin/components/subject-editor';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.subject.pageTitle };

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubjectPage({ params }: SubjectPageProps) {
  const { id } = await params;
  return <SubjectEditor id={id} />;
}
