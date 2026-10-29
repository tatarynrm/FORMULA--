import type { Metadata } from 'next';

import { NewsPage } from '@/features/notifications/components/news-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.notifications.news.pageTitle };

export default function AdminNewsPage() {
  return <NewsPage />;
}
