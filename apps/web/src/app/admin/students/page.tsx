import type { Metadata } from 'next';

import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { StudentsList } from '@/features/admin/components/students-list';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.students.title };

// No Figma frame exists for this screen yet; it follows the styling of the other admin lists.
export default function AdminStudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t.admin.students.title} />
      <StudentsList />
    </div>
  );
}
