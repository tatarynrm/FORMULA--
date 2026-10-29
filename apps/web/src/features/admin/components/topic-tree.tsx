'use client';

import type { AdminSubtopicSummary, AdminTopic, ContentStatus } from '@formula/shared';
import { File, Plus, SquareCheckBig } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { DragHandle } from '@/components/common/sortable/drag-handle';
import { SortableList } from '@/components/common/sortable/sortable-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useTopicMutations } from '../hooks/use-subjects';
import { AddSubtopicDialog } from './add-subtopic-dialog';
import { ContentRow } from './content-row';
import { CountChip } from './count-chip';
import { ErrorNotice } from './error-notice';
import type { RowAction } from './row-actions';
import { TextFieldDialog } from './text-field-dialog';

type TreeDialog =
  | { type: 'rename-topic'; topic: AdminTopic }
  | { type: 'add-subtopic'; topic: AdminTopic }
  | { type: 'rename-subtopic'; subtopic: AdminSubtopicSummary };

interface TopicTreeProps {
  /** The subject the topics belong to (its tree is the one that is reordered). */
  subjectId: string;
  topics: AdminTopic[];
  /** Used by the empty state, which offers to add the first topic. */
  onAddTopic: () => void;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function TopicMeta({ topic }: { topic: AdminTopic }) {
  const copy = t.adminContent;
  const count = topic.subtopics.length;

  return (
    <>
      <span>
        {count === 0
          ? copy.topics.noSubtopics
          : format('{count} {word}', {
              count,
              word: pluralizeUk(count, copy.topics.subtopicsCount),
            })}
      </span>
      <CountChip
        icon={File}
        label={copy.subtopics.materials}
        count={sum(topic.subtopics.map((subtopic) => subtopic.materialCount))}
      />
      <CountChip
        icon={SquareCheckBig}
        label={copy.subtopics.tests}
        count={sum(topic.subtopics.map((subtopic) => subtopic.testCount))}
      />
    </>
  );
}

function SubtopicMeta({ subtopic }: { subtopic: AdminSubtopicSummary }) {
  const copy = t.adminContent.subtopics;

  return (
    <>
      <Badge variant={subtopic.isFree ? 'brand' : 'secondary'}>
        {subtopic.isFree ? copy.free : copy.paid}
      </Badge>
      <CountChip icon={File} label={copy.materials} count={subtopic.materialCount} />
      <CountChip icon={SquareCheckBig} label={copy.tests} count={subtopic.testCount} />
    </>
  );
}

/**
 * Topics of a subject with their subtopics as nested rows (Figma "course-card"). Every row can be
 * renamed, published or unpublished and deleted; "+" on a topic adds a subtopic; a subtopic row
 * opens the subtopic editor.
 */
export function TopicTree({ subjectId, topics, onAddTopic }: TopicTreeProps) {
  const copy = t.adminContent;
  const {
    updateTopic,
    removeTopic,
    createSubtopic,
    updateSubtopic,
    removeSubtopic,
    reorderTopics,
    reorderSubtopics,
  } = useTopicMutations();
  const { notice, run } = useActionNotice();
  const [dialog, setDialog] = useState<TreeDialog | null>(null);

  const statusAction = (
    status: ContentStatus,
    toggle: (next: ContentStatus) => Promise<unknown>,
    fallback: string,
  ): RowAction => {
    const next: ContentStatus = status === 'published' ? 'draft' : 'published';
    return {
      key: 'status',
      label: status === 'published' ? copy.common.unpublish : copy.common.publish,
      onSelect: () => void run(() => toggle(next), fallback),
    };
  };

  if (topics.length === 0) {
    return (
      <EmptyState
        title={copy.topics.empty}
        description={copy.topics.emptyHint}
        action={
          <Button onClick={onAddTopic}>
            <Plus />
            {copy.topics.add}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ErrorNotice message={notice} className="mb-2" />

      <SortableList
        items={topics}
        className="flex flex-col gap-2"
        overlayClassName="rounded-3xl"
        getLabel={(topic) => topic.title}
        onReorder={(ids) =>
          run(() => reorderTopics.mutateAsync({ subjectId, ids }), copy.common.reorderError)
        }
        renderItem={(topic, { overlay }) => (
          <ContentRow
            title={topic.title}
            status={topic.status}
            meta={<TopicMeta topic={topic} />}
            handle={<DragHandle />}
            // The lifted copy of a topic is folded: it carries the topic, not its whole list.
            defaultOpen={!overlay}
            onRename={() => setDialog({ type: 'rename-topic', topic })}
            onAdd={() => setDialog({ type: 'add-subtopic', topic })}
            addLabel={`${copy.subtopics.add}: ${topic.title}`}
            actions={[
              statusAction(
                topic.status,
                (next) => updateTopic.mutateAsync({ id: topic.id, patch: { status: next } }),
                copy.topics.publishError,
              ),
              {
                key: 'delete',
                label: copy.topics.delete,
                destructive: true,
                confirm: {
                  title: copy.topics.deleteTitle,
                  description: format(copy.topics.deleteDescription, { title: topic.title }),
                  confirmLabel: copy.common.delete,
                  requireText: { value: topic.title, kind: copy.common.typeToConfirm.kinds.title },
                },
                onSelect: () =>
                  void run(() => removeTopic.mutateAsync(topic.id), copy.topics.deleteError),
              },
            ]}
          >
            {topic.subtopics.length > 0 ? (
              <SortableList
                items={topic.subtopics}
                className="flex flex-col gap-2"
                overlayClassName="rounded-2xl"
                getLabel={(subtopic) => subtopic.title}
                onReorder={(ids) =>
                  run(
                    () => reorderSubtopics.mutateAsync({ subjectId, topicId: topic.id, ids }),
                    copy.common.reorderError,
                  )
                }
                renderItem={(subtopic) => (
                  <ContentRow
                    nested
                    title={subtopic.title}
                    href={`/admin/subtopics/${subtopic.id}`}
                    status={subtopic.status}
                    meta={<SubtopicMeta subtopic={subtopic} />}
                    handle={<DragHandle />}
                    onRename={() => setDialog({ type: 'rename-subtopic', subtopic })}
                    actions={[
                      statusAction(
                        subtopic.status,
                        (next) =>
                          updateSubtopic.mutateAsync({ id: subtopic.id, patch: { status: next } }),
                        copy.subtopics.publishError,
                      ),
                      {
                        key: 'delete',
                        label: copy.subtopics.delete,
                        destructive: true,
                        confirm: {
                          title: copy.subtopics.deleteTitle,
                          description: format(copy.subtopics.deleteDescription, {
                            title: subtopic.title,
                          }),
                          confirmLabel: copy.common.delete,
                          requireText: {
                            value: subtopic.title,
                            kind: copy.common.typeToConfirm.kinds.title,
                          },
                        },
                        onSelect: () =>
                          void run(
                            () => removeSubtopic.mutateAsync(subtopic.id),
                            copy.subtopics.deleteError,
                          ),
                      },
                    ]}
                  />
                )}
              />
            ) : undefined}
          </ContentRow>
        )}
      />

      {dialog?.type === 'rename-topic' ? (
        <TextFieldDialog
          title={copy.topics.renameTitle}
          label={copy.topics.label}
          initialValue={dialog.topic.title}
          submitLabel={copy.common.save}
          errorFallback={copy.topics.renameError}
          onSubmit={(title) => updateTopic.mutateAsync({ id: dialog.topic.id, patch: { title } })}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.type === 'rename-subtopic' ? (
        <TextFieldDialog
          title={copy.subtopics.renameTitle}
          label={copy.subtopics.label}
          initialValue={dialog.subtopic.title}
          submitLabel={copy.common.save}
          errorFallback={copy.subtopics.renameError}
          onSubmit={(title) =>
            updateSubtopic.mutateAsync({ id: dialog.subtopic.id, patch: { title } })
          }
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.type === 'add-subtopic' ? (
        <AddSubtopicDialog
          topicTitle={dialog.topic.title}
          onSubmit={(input) => createSubtopic.mutateAsync({ topicId: dialog.topic.id, input })}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
