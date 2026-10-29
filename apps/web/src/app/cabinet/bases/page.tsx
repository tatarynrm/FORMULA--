import type { Metadata } from 'next';

import { TestCollectionScreen } from '@/features/learning/components/lists/test-collection-screen';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.collections.base.pageTitle };

export default function BasesPage() {
  return <TestCollectionScreen collection="base" />;
}
