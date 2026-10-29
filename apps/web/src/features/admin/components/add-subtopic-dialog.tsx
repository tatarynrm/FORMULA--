'use client';

import { useState } from 'react';

import { format } from '@/lib/format';
import { t } from '@/locales';

import type { SubtopicInput } from '../api/catalog-api';
import { FreeSubtopicSwitch } from './free-subtopic-switch';
import { TextFieldDialog } from './text-field-dialog';

interface AddSubtopicDialogProps {
  /** Shown under the title, so the admin sees which topic the subtopic goes into. */
  topicTitle: string;
  onSubmit: (input: SubtopicInput) => Promise<unknown>;
  onClose: () => void;
}

/** "Нова підтема": a title and the "free subtopic" switch. Mount it only while it is open. */
export function AddSubtopicDialog({ topicTitle, onSubmit, onClose }: AddSubtopicDialogProps) {
  const copy = t.adminContent.subtopics;
  const [isFree, setIsFree] = useState(false);

  return (
    <TextFieldDialog
      title={copy.addTitle}
      description={format(copy.addIn, { topic: topicTitle })}
      label={copy.label}
      placeholder={copy.placeholder}
      submitLabel={t.adminContent.common.add}
      errorFallback={copy.addError}
      onSubmit={(title) => onSubmit({ title, isFree })}
      onClose={onClose}
    >
      <FreeSubtopicSwitch checked={isFree} onCheckedChange={setIsFree} />
    </TextFieldDialog>
  );
}
