import type { Metadata } from 'next';

import { TestimonialsAdminPage } from '@/features/testimonials/components/testimonials-admin-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.testimonials.admin.title };

export default function AdminTestimonialsPage() {
  return <TestimonialsAdminPage />;
}
