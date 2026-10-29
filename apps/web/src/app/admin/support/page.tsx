import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminSupport } from '@/features/chat/components/admin-support';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.chat.admin.title };

// AdminSupport reads ?conversation=<id> (the deep link used by notifications), which needs a Suspense boundary.
export default function AdminSupportPage() {
  return (
    <Suspense>
      <AdminSupport />
    </Suspense>
  );
}
