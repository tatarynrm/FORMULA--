import type { Metadata } from 'next';

import { TestListPage } from '@/features/admin/components/test-list-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.tests.amps };

export default function AdminAmpsPage() {
  return (
    <TestListPage title={t.admin.tests.amps} collection="amps" filters="full" idPrefix="amps" />
  );
}
