import type { Metadata } from 'next';

import { SubtopicEditor } from '@/features/admin/components/subtopic-editor';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.subtopicEditor.pageTitle };

interface SubtopicPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSubtopicPage({ params }: SubtopicPageProps) {
  const { id } = await params;
  return <SubtopicEditor id={id} />;
}
