import type { Metadata } from 'next';

import { StudentPage } from '@/features/admin/components/student-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.students.pageTitle };

interface AdminStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudentPage({ params }: AdminStudentPageProps) {
  const { id } = await params;
  return <StudentPage id={id} />;
}
