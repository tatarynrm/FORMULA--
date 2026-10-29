'use client';

import { PageHeader } from '@/components/common/page-header';
import { t } from '@/locales';

import { STUDENT_THREAD_SCOPE } from '../hooks/thread-scope';
import { ChatThread } from './chat-thread';

/**
 * The student's "Підтримка" page: the title and the thread filling the rest of the viewport
 * (the dashboard chrome above and below is subtracted), so the message box always stays in view
 * and only the messages scroll.
 */
export function StudentSupportChat() {
  const copy = t.chat.student;

  return (
    <div className="flex h-[calc(100dvh-(var(--spacing)*28))] min-h-96 flex-col gap-6 md:h-[calc(100dvh-(var(--spacing)*34))] lg:h-[calc(100dvh-(var(--spacing)*30))]">
      <PageHeader title={copy.title} description={copy.subtitle} />
      <ChatThread
        scope={STUDENT_THREAD_SCOPE}
        empty={{ title: copy.emptyTitle, description: copy.emptyDescription }}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
