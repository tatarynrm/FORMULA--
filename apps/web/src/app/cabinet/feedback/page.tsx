import type { Metadata } from 'next';

import { FeedbackPage } from '@/features/testimonials/components/feedback-page';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.testimonials.feedbackPage.title };

export default function CabinetFeedbackPage() {
  return <FeedbackPage />;
}
