import type { Metadata } from 'next';

import { SavedScreen } from '@/features/learning/components/lists/saved-screen';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.learning.saved.title };

export default function SavedPage() {
  return <SavedScreen />;
}
