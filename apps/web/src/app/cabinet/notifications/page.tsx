import type { Metadata } from 'next';

import { NotificationsPage } from '@/features/notifications/components/notifications-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.notifications.page.title };

export default function CabinetNotificationsPage() {
  return <NotificationsPage />;
}
