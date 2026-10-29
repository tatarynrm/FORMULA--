import type { Metadata } from 'next';

import { NewSubjectForm } from '@/features/admin/components/new-subject-form';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.subjects.newTitle };

export default function NewSubjectPage() {
  return <NewSubjectForm />;
}
