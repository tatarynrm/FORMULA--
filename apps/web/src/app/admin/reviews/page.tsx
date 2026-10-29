import type { Metadata } from 'next';

import { ReviewQueue } from '@/features/admin/components/review-queue';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.reviews.pageTitle };

export default function AdminReviewsPage() {
  return <ReviewQueue />;
}
