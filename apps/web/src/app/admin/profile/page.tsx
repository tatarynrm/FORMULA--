import type { Metadata } from 'next';

import { ProfilePage } from '@/features/profile/components/profile-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.profile.page.title };

export default function AdminProfilePage() {
  return <ProfilePage />;
}
