'use client';

import type { CatalogSubtopic } from '@formula/shared';
import { useId, useMemo, useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { SearchField } from '@/components/common/search-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../../hooks/use-action-notice';
import {
  useAccessMutations,
  useCatalogSubtopics,
  useStudentGrants,
} from '../../hooks/use-student-access';
import {
  type AccessTopic,
  buildAccessTree,
  filterAccessTree,
  sameIds,
} from '../../utils/access-tree';
import { ErrorNotice } from '../error-notice';
import { UnsavedBadge } from '../unsaved-badge';

interface SubtopicGrantsSectionProps {
  userId: string;
}

interface SubtopicRowProps {
  subtopic: CatalogSubtopic;
  checked: boolean;
  /** The grant came from a payment: worth a tag, since taking it away is a different matter. */
  paid: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/** One subtopic of the tree: a checkbox, or a "free" tag when it is open to everyone anyway. */
function SubtopicRow({ subtopic, checked, paid, disabled, onToggle }: SubtopicRowProps) {
  const copy = t.adminContent.access.subtopic;
  const id = useId();

  if (subtopic.isFree) {
    return (
      <li className="text-body-sm text-muted-foreground flex min-h-8 items-center gap-2 pl-6">
        <span className="wrap-anywhere">{subtopic.title}</span>
        <Badge variant="secondary">{copy.free}</Badge>
      </li>
    );
  }

  return (
    <li className="flex min-h-8 items-center gap-2">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={onToggle} />
      <label htmlFor={id} className="text-body-sm text-foreground cursor-pointer wrap-anywhere">
        {subtopic.title}
      </label>
      {paid ? <Badge variant="brand">{copy.paid}</Badge> : null}
    </li>
  );
}

interface TopicRowProps {
  topic: AccessTopic;
  selected: ReadonlySet<string>;
  paidIds: ReadonlySet<string>;
  disabled: boolean;
  onToggleSubtopic: (id: string) => void;
  onToggleTopic: (ids: string[], checked: boolean) => void;
}

/** A topic with a tri-state checkbox over its (paid) subtopics, then the subtopics themselves. */
function TopicRow({
  topic,
  selected,
  paidIds,
  disabled,
  onToggleSubtopic,
  onToggleTopic,
}: TopicRowProps) {
  const copy = t.adminContent.access.subtopic;
  const id = useId();
  const ids = topic.subtopics.filter((subtopic) => !subtopic.isFree).map((subtopic) => subtopic.id);
  const chosen = ids.filter((subtopicId) => selected.has(subtopicId)).length;
  const state: boolean | 'indeterminate' =
    chosen === 0 ? false : chosen === ids.length ? true : 'indeterminate';

  return (
    <li className="flex flex-col gap-1">
      <div className="flex min-h-8 items-center gap-2">
        {ids.length > 0 ? (
          <Checkbox
            id={id}
            checked={state}
            disabled={disabled}
            aria-label={format(copy.topicAll, { title: topic.title })}
            onCheckedChange={() => onToggleTopic(ids, state !== true)}
          />
        ) : (
          <span className="size-4 shrink-0" aria-hidden />
        )}
        <label htmlFor={id} className="text-body-md text-foreground cursor-pointer font-semibold">
          {topic.title}
        </label>
      </div>
      <ul className="flex flex-col gap-1 pl-6">
        {topic.subtopics.map((subtopic) => (
          <SubtopicRow
            key={subtopic.id}
            subtopic={subtopic}
            checked={selected.has(subtopic.id)}
            paid={paidIds.has(subtopic.id)}
            disabled={disabled}
            onToggle={() => onToggleSubtopic(subtopic.id)}
          />
        ))}
      </ul>
    </li>
  );
}

/**
 * "Окремі підтеми": a checkbox tree (subject > topic > subtopics) of everything the student may
 * open on its own. The current grants are pre-checked; "Зберегти" sends the whole set at once.
 */
export function SubtopicGrantsSection({ userId }: SubtopicGrantsSectionProps) {
  const copy = t.adminContent.access.subtopic;
  const grants = useStudentGrants(userId, true);
  const subtopics = useCatalogSubtopics(true);
  const { setGrants } = useAccessMutations(userId);
  const { notice, run } = useActionNotice();
  const [query, setQuery] = useState('');
  // The edited set, or `null` while nothing was touched since the last load or save.
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const granted = useMemo(
    () => new Set((grants.data ?? []).map((grant) => grant.subtopicId)),
    [grants.data],
  );
  const paidIds = useMemo(
    () =>
      new Set(
        (grants.data ?? [])
          .filter((grant) => grant.source === 'payment')
          .map((grant) => grant.subtopicId),
      ),
    [grants.data],
  );
  const tree = useMemo(() => buildAccessTree(subtopics.data ?? []), [subtopics.data]);
  const visible = useMemo(() => filterAccessTree(tree, query), [tree, query]);
  const countable = useMemo(
    () => new Set((subtopics.data ?? []).filter((item) => !item.isFree).map((item) => item.id)),
    [subtopics.data],
  );

  const selected = draft ?? granted;
  const dirty = draft !== null && !sameIds(draft, granted);
  const count = [...selected].filter((id) => countable.has(id)).length;
  const busy = setGrants.isPending;

  function edit(change: (next: Set<string>) => void) {
    setJustSaved(false);
    setDraft((current) => {
      const next = new Set(current ?? granted);
      change(next);
      return next;
    });
  }

  function save() {
    void run(async () => {
      await setGrants.mutateAsync([...selected]);
      setDraft(null);
      setJustSaved(true);
    }, copy.saveError);
  }

  return (
    <section
      aria-labelledby="access-subtopic-title"
      className="bg-background border-input flex flex-col gap-3 rounded-2xl border p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="access-subtopic-title" className="text-body-lg text-foreground font-bold">
          {copy.title}
        </h3>
        <p className="text-body-sm text-text-secondary">{copy.hint}</p>
      </div>

      {grants.isError || subtopics.isError ? (
        <p role="alert" className="text-body-sm text-input-error-text">
          {t.adminContent.access.loadError}
        </p>
      ) : grants.isPending || subtopics.isPending ? (
        <LogoLoader size="sm" className="py-4" />
      ) : subtopics.data.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{copy.noSubtopics}</p>
      ) : (
        <>
          <SearchField
            aria-label={copy.search}
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-body-sm text-foreground font-medium">
                {format(copy.selected, {
                  count,
                  word: pluralizeUk(count, copy.selectedWord),
                })}
              </p>
              {dirty ? (
                <UnsavedBadge />
              ) : justSaved ? (
                <p role="status" className="text-body-sm text-success">
                  {copy.saved}
                </p>
              ) : null}
            </div>
            <Button type="button" size="sm" disabled={!dirty || busy} onClick={save}>
              {busy ? copy.saving : copy.save}
            </Button>
          </div>

          <ErrorNotice message={notice} />

          {visible.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{copy.noMatches}</p>
          ) : (
            <ul className="border-input flex max-h-96 flex-col gap-4 overflow-y-auto rounded-xl border p-3">
              {visible.map((subject) => (
                <li key={subject.id} className="flex flex-col gap-2">
                  <h4 className="text-body-xs text-muted-foreground font-semibold tracking-wide uppercase">
                    {subject.title}
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {subject.topics.map((topic) => (
                      <TopicRow
                        key={topic.id}
                        topic={topic}
                        selected={selected}
                        paidIds={paidIds}
                        disabled={busy}
                        onToggleSubtopic={(id) =>
                          edit((next) => {
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                          })
                        }
                        onToggleTopic={(ids, checked) =>
                          edit((next) => {
                            for (const id of ids) {
                              if (checked) next.add(id);
                              else next.delete(id);
                            }
                          })
                        }
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
