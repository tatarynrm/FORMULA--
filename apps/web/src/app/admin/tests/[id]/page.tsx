import type { Metadata } from 'next';

import { TestEditor } from '@/features/admin/components/test-editor';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.testEditor.pageTitle };

interface TestPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTestPage({ params }: TestPageProps) {
  const { id } = await params;
  return <TestEditor id={id} />;
}
