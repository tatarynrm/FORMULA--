import type { Metadata } from 'next';

import { ReviewEditor } from '@/features/admin/components/review-editor';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.adminContent.reviews.pageTitle };

interface ReviewPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function AdminReviewPage({ params }: ReviewPageProps) {
  const { attemptId } = await params;
  return <ReviewEditor attemptId={attemptId} />;
}
