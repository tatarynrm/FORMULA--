'use client';

import type { StudentListItem, StudentListQuery } from '@formula/shared';
import { ChevronLeft, ChevronRight, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { SearchField } from '@/components/common/search-field';
import { SegmentedControl } from '@/components/common/segmented-control';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useNow } from '../hooks/use-now';
import { useStudents } from '../hooks/use-students';
import { formatDate } from '../utils/format-date';
import { StudentAccessDialog } from './student-access-dialog';
import { PresenceStatus } from './student-presence';

type Scope = 'all' | 'online';
type Sort = NonNullable<StudentListQuery['sort']>;

const SORTS: readonly Sort[] = ['newest', 'name', 'lastSeen'];
const isSort = (value: string): value is Sort => (SORTS as readonly string[]).includes(value);

/** "Студент · Крок": what the student said about themselves, in one pill. */
function profileLabel(student: StudentListItem): string | null {
  const parts = [student.profile.statusLabel, student.profile.goalLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** "Весь предмет ×1 · підтем: 3", or that there is nothing. */
function accessLabel(student: StudentListItem): string {
  const copy = t.adminContent.students.accessSummary;
  const parts: string[] = [];
  if (student.stats.subjectGrants > 0) {
    parts.push(format(copy.subjects, { count: student.stats.subjectGrants }));
  }
  if (student.stats.subtopicGrants > 0) {
    parts.push(format(copy.subtopics, { count: student.stats.subtopicGrants }));
  }
  return parts.length > 0 ? parts.join(' · ') : copy.none;
}

interface StudentCardProps {
  student: StudentListItem;
  now: number;
  onAccess: () => void;
}

/** One student of the list: who they are, whether they are online, their numbers, and the doors. */
function StudentCard({ student, now, onAccess }: StudentCardProps) {
  const copy = t.adminContent.students;
  const fullName = `${student.name} ${student.surname}`.trim();
  const profile = profileLabel(student);

  return (
    <li className="bg-surface-raised border-input flex flex-col gap-4 rounded-2xl border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <Link
          href={`/admin/students/${student.id}`}
          aria-label={format(copy.openFor, { name: fullName })}
          className="group flex min-w-0 flex-1 basis-64 items-center gap-3"
        >
          <UserAvatar name={student.name} fileId={student.avatarFileId} size="lg" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body-lg text-foreground group-hover:text-primary font-bold wrap-anywhere transition-colors">
              {fullName}
            </span>
            <span className="text-body-sm text-text-secondary wrap-anywhere">{student.email}</span>
          </span>
        </Link>
        <PresenceStatus presence={student.presence} now={now} className="text-body-sm" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {profile ? (
          <Badge variant="secondary">{profile}</Badge>
        ) : (
          <span className="text-body-xs text-muted-foreground">{copy.noProfile}</span>
        )}
        {student.googleLinked ? <Badge variant="outline">{copy.google}</Badge> : null}
        {student.role !== 'student' ? (
          <Badge variant="brand">{t.cabinet.userCard.roles[student.role]}</Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="text-body-sm flex flex-col gap-1">
          <dl className="flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <dt className="sr-only">{copy.progress.testsPassed}</dt>
              <dd className="text-foreground font-medium">
                {format(copy.tests, { count: student.stats.testsPassed })}
              </dd>
            </div>
            <div>
              <dt className="sr-only">{copy.progress.average}</dt>
              <dd className="text-foreground font-medium">
                {student.stats.averagePercent === null
                  ? copy.averageNone
                  : format(copy.average, { percent: student.stats.averagePercent })}
              </dd>
            </div>
            <div>
              <dt className="sr-only">{copy.sections.access}</dt>
              <dd className="text-text-secondary">{accessLabel(student)}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground">
            {format(copy.registered, { date: formatDate(student.createdAt) })}
          </p>
        </div>
        {/* Admins open every subtopic, so a grant only makes sense for students. */}
        {student.role === 'student' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={format(t.adminContent.access.openFor, { name: fullName })}
            onClick={onAccess}
          >
            <KeyRound />
            {t.adminContent.access.open}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Registered users: search, "online only", sort, one card per student (linking to their page),
 * the quick "Доступи" door, and page navigation. Data comes from the admin-only `/admin/students`.
 */
export function StudentsList() {
  const copy = t.adminContent.students;
  const listCopy = t.admin.students;
  const sortId = useId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [accessFor, setAccessFor] = useState<StudentListItem | null>(null);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isPending, isError, isFetching } = useStudents({
    page,
    q: q || undefined,
    online: scope === 'online' || undefined,
    sort,
  });
  const now = useNow();
  const filtered = q !== '' || scope === 'online';

  // Any change of the search, the filter or the sort starts from the first page again.
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeScope = (value: Scope) => {
    setScope(value);
    setPage(1);
  };
  const changeSort = (value: string) => {
    if (!isSort(value)) return;
    setSort(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField
          aria-label={copy.search}
          placeholder={copy.searchPlaceholder}
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          className="min-w-0 flex-1"
        />
        <SegmentedControl
          items={[
            { id: 'all', label: copy.filter.all },
            { id: 'online', label: copy.filter.online },
          ]}
          value={scope}
          onValueChange={changeScope}
          label={copy.filter.label}
          className="lg:w-64"
        />
        <Select value={sort} onValueChange={changeSort}>
          <SelectTrigger
            id={sortId}
            aria-label={copy.sort.label}
            className="bg-surface-raised border-input text-body-md text-foreground w-full rounded-full px-5 shadow-none data-[size=default]:h-13 lg:w-56"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((option) => (
              <SelectItem key={option} value={option}>
                {copy.sort[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <EmptyState title={listCopy.loadError} />
      ) : isPending ? (
        <LogoLoader size="lg" fill />
      ) : data.items.length === 0 ? (
        filtered ? (
          <EmptyState title={copy.noMatches} description={copy.noMatchesHint} />
        ) : (
          <EmptyState title={listCopy.empty} />
        )
      ) : (
        <>
          <p className="text-body-sm text-muted-foreground" role="status">
            {format(listCopy.total, { count: data.meta.total })}
          </p>

          <ul className="flex flex-col gap-3" aria-label={listCopy.title} aria-busy={isFetching}>
            {data.items.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                now={now}
                onAccess={() => setAccessFor(student)}
              />
            ))}
          </ul>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                aria-label={t.common.previous}
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-body-sm text-text-secondary">
                {format(listCopy.page, { page: data.meta.page, pages: data.meta.totalPages })}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label={t.common.next}
                disabled={page >= data.meta.totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          ) : null}
        </>
      )}

      {accessFor ? (
        <StudentAccessDialog student={accessFor} onClose={() => setAccessFor(null)} />
      ) : null}
    </div>
  );
}
