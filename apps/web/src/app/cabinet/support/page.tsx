import type { Metadata } from 'next';

import { StudentSupportChat } from '@/features/chat/components/student-support-chat';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.chat.student.title };

export default function CabinetSupportPage() {
  return <StudentSupportChat />;
}
