import type { Metadata } from 'next';

import { TestCollectionScreen } from '@/features/learning/components/lists/test-collection-screen';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.collections.booklet.pageTitle };

export default function BookletsPage() {
  return <TestCollectionScreen collection="booklet" />;
}
