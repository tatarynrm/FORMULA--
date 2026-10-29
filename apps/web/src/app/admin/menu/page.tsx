import type { Metadata } from 'next';

import { MenuEditor } from '@/features/admin/components/menu-editor';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.admin.menu.title };

export default function AdminMenuPage() {
  return <MenuEditor />;
}
