'use client';

import type { StudentTopic } from '@formula/shared';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { SubtopicRow } from './subtopic-row';

interface TopicSectionProps {
  topic: StudentTopic;
  /** Keeps the topic open while a search shows its matching subtopics. */
  forceOpen?: boolean;
}

/** A topic as an expandable card with its subtopics (Figma "subject" screen). */
export function TopicSection({ topic, forceOpen = false }: TopicSectionProps) {
  const [open, setOpen] = useState(true);
  const expanded = forceOpen || open;

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setOpen}
      className="bg-surface-raised border-input rounded-2xl border"
    >
      <h2 className="text-body-lg text-foreground font-semibold">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="focus-visible:ring-ring flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-[3px]"
          >
            <span className="min-w-0 break-words">{topic.title}</span>
            <ChevronDown
              className={cn(
                'text-muted-foreground size-5 shrink-0 transition-transform',
                expanded && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
      </h2>

      <CollapsibleContent>
        {topic.subtopics.length === 0 ? (
          <p className="text-body-sm text-muted-foreground px-5 pb-4">
            {t.learning.subject.noSubtopics}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 px-2 pb-3">
            {topic.subtopics.map((subtopic) => (
              <li key={subtopic.id}>
                <SubtopicRow subtopic={subtopic} />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
