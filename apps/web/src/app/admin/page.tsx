import type { Metadata } from 'next';

import { SubjectsList } from '@/features/admin/components/subjects-list';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.subjects.title };

export default function AdminSubjectsPage() {
  return <SubjectsList />;
}
