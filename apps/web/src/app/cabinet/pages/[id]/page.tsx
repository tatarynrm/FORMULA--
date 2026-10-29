import type { Metadata } from 'next';

import { MenuPageView } from '@/features/menu/components/menu-page-view';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.menuPage.documentTitle };

/** A page the superadmin added to the student menu. */
export default async function CabinetCustomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MenuPageView itemId={id} />;
}
