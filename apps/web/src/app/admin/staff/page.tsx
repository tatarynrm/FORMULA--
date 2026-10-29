import type { Metadata } from 'next';

import { StaffManager } from '@/features/admin/components/staff-manager';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.staff.title };

export default function AdminStaffPage() {
  return <StaffManager />;
}
