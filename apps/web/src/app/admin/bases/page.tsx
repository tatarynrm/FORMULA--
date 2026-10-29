import type { Metadata } from 'next';

import { TestListPage } from '@/features/admin/components/test-list-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.tests.bases };

export default function AdminBasesPage() {
  return (
    <TestListPage
      title={t.admin.tests.bases}
      collection="base"
      filters="category"
      idPrefix="bases"
    />
  );
}
