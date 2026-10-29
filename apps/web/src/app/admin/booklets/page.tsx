import type { Metadata } from 'next';

import { TestListPage } from '@/features/admin/components/test-list-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.tests.booklets };

export default function AdminBookletsPage() {
  return (
    <TestListPage
      title={t.admin.tests.booklets}
      collection="booklet"
      filters="full"
      idPrefix="booklets"
    />
  );
}
