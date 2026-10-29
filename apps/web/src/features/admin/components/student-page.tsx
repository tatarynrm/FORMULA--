'use client';

import type {
  StudentAttemptItem,
  StudentDetail,
  SubjectGrant,
  SubtopicGrant,
} from '@formula/shared';
import { KeyRound, SquarePen, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { StatCard } from '@/components/common/stat-card';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useActionNotice } from '../hooks/use-action-notice';
import { useNow } from '../hooks/use-now';
import { useAccessMutations } from '../hooks/use-student-access';
import { useStudent, useStudentAttempts, useStudentMutations } from '../hooks/use-students';
import { isApiStatus } from '../utils/api-error';
import { formatDate, formatDateTime } from '../utils/format-date';
import { formatContentPath } from '../utils/format-path';
import { AdminPageHeader } from './admin-page-header';
import { ConfirmDialog } from './confirm-dialog';
import { ErrorNotice } from './error-notice';
import { SectionCard } from './section-card';
import { StudentAccessDialog } from './student-access-dialog';
import { GrantRow } from './student-access/grant-row';
import { StudentNameDialog } from './student-name-dialog';
import { PresenceStatus, SessionsList } from './student-presence';
import { TestKindBadge } from './test-kind-badge';

const NO_VALUE = '–';

type Revoke = { type: 'subject'; grant: SubjectGrant } | { type: 'subtopic'; grant: SubtopicGrant };

/** "Хто / Мета / Навчальний заклад / Онбординг" as a definition list. */
function ProfileSection({ student }: { student: StudentDetail }) {
  const copy = t.adminContent.students.profile;
  const { profile } = student;
  const institution = [
    profile.institutionKind ? copy.institutionKinds[profile.institutionKind] : null,
    profile.institutionName,
  ]
    .filter(Boolean)
    .join(': ');
  const contacts = t.contacts.admin;
  const bot = profile.bots.find((item) => item.provider === 'telegram');
  const botState = !bot
    ? contacts.botStates.none
    : bot.awaitingPhone
      ? contacts.botStates.awaitingPhone
      : bot.notificationsEnabled
        ? contacts.botStates.active
        : contacts.botStates.muted;
  const rows: [string, ReactNode][] = [
    [
      contacts.phone,
      profile.phone ? (
        <a
          href={`tel:${profile.phone.replace(/\s/g, '')}`}
          className="hover:text-primary whitespace-nowrap transition-colors"
        >
          {profile.phone}
        </a>
      ) : (
        contacts.none
      ),
    ],
    [
      contacts.messengers,
      profile.messengers.length > 0 ? (
        <span className="flex flex-wrap gap-1.5">
          {profile.messengers.map((item) => (
            <Badge key={item.kind} variant="secondary">
              {t.contacts.messengers.options[item.kind]}
              {item.username ? ` @${item.username}` : ''}
            </Badge>
          ))}
        </span>
      ) : (
        contacts.none
      ),
    ],
    [
      contacts.bot,
      bot ? (
        <span className="flex flex-col">
          <span>{botState}</span>
          {bot.username || bot.phone ? (
            <span className="text-muted-foreground text-body-xs">
              {[bot.username ? `@${bot.username}` : null, bot.phone].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </span>
      ) : (
        botState
      ),
    ],
    [copy.status, profile.statusLabel ?? copy.empty],
    [copy.goal, profile.goalLabel ?? copy.empty],
    [copy.institution, institution || copy.empty],
    [copy.onboarding, profile.onboardingCompleted ? copy.onboardingDone : copy.onboardingSkipped],
  ];

  return (
    <dl className="text-body-sm grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The result column of one attempt: the score, or what is still missing. */
function AttemptResult({ attempt }: { attempt: StudentAttemptItem }) {
  const copy = t.adminContent.students.attempts;

  if (attempt.status === 'in_progress') {
    return <span className="text-muted-foreground">{copy.inProgress}</span>;
  }
  if (attempt.status === 'pending_review') {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="bg-accent-blue/10 text-accent-blue text-body-xs inline-flex items-center rounded-full px-3 py-1 font-medium whitespace-nowrap">
          {copy.pending}
        </span>
        <Link
          href={`/admin/reviews/${attempt.id}`}
          aria-label={format(copy.reviewFor, { test: attempt.test.title })}
          className={buttonVariants({ variant: 'default', size: 'sm' })}
        >
          {copy.review}
        </Link>
      </span>
    );
  }
  if (attempt.percent === null) {
    return <span className="text-muted-foreground">{copy.noResult}</span>;
  }
  return (
    <span className="flex flex-col">
      <span className="text-foreground font-semibold">{attempt.percent}%</span>
      {attempt.score !== null && attempt.maxScore !== null ? (
        <span className="text-body-xs text-muted-foreground">
          {format(copy.result, { score: attempt.score, max: attempt.maxScore })}
        </span>
      ) : null}
    </span>
  );
}

function AttemptsTable({ attempts }: { attempts: StudentAttemptItem[] }) {
  const copy = t.adminContent.students.attempts;

  return (
    <div className="border-input relative overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-160 text-left">
        <thead>
          <tr className="text-body-sm text-muted-foreground border-border border-b">
            <th scope="col" className="px-4 py-3 font-medium">
              {copy.columns.date}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {copy.columns.test}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {copy.columns.kind}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {copy.columns.result}
            </th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => {
            const where =
              attempt.test.collection === 'subtopic'
                ? formatContentPath([attempt.test.subjectTitle, attempt.test.subtopicTitle])
                : copy.collections[attempt.test.collection];

            return (
              <tr
                key={attempt.id}
                className="border-border text-body-sm text-foreground border-b last:border-b-0"
              >
                <td className="text-text-secondary px-4 py-3 whitespace-nowrap">
                  {formatDateTime(attempt.finishedAt ?? attempt.startedAt)}
                </td>
                <td className="min-w-48 px-4 py-3 break-words">
                  <p className="font-medium">{attempt.test.title}</p>
                  {where ? <p className="text-body-xs text-muted-foreground">{where}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <TestKindBadge kind={attempt.test.kind} />
                </td>
                <td className="px-4 py-3">
                  <AttemptResult attempt={attempt} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StudentView({ student }: { student: StudentDetail }) {
  const copy = t.adminContent.students;
  const accessCopy = t.adminContent.access;
  const router = useRouter();
  const now = useNow();
  const attempts = useStudentAttempts(student.id);
  const { rename, remove } = useStudentMutations(student.id);
  const { revoke, revokeSubject } = useAccessMutations(student.id);
  const { notice, run } = useActionNotice();
  const [renaming, setRenaming] = useState(false);
  const [access, setAccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toRevoke, setToRevoke] = useState<Revoke | null>(null);
  const fullName = `${student.name} ${student.surname}`.trim();
  const { progress } = student;
  const hasGrants = student.subjectGrants.length > 0 || student.subtopicGrants.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/students"
        title={<p className="text-h3 text-muted-foreground">{copy.pageTitle}</p>}
        actions={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRenaming(true)}>
              <SquarePen />
              {copy.edit}
            </Button>
            {student.role === 'student' ? (
              <Button type="button" size="sm" onClick={() => setAccess(true)}>
                <KeyRound />
                {accessCopy.open}
              </Button>
            ) : null}
          </>
        }
      />

      <header className="bg-surface-raised border-input flex flex-col gap-4 rounded-3xl border p-4 md:flex-row md:items-center md:gap-6 md:p-6">
        <UserAvatar name={student.name} fileId={student.avatarFileId} size="xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-title text-foreground wrap-anywhere">{fullName}</h1>
            <p className="text-body-md text-text-secondary wrap-anywhere">{student.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PresenceStatus presence={student.presence} now={now} className="text-body-sm" />
            {student.googleLinked ? <Badge variant="outline">{copy.google}</Badge> : null}
            {student.hasPassword ? <Badge variant="outline">{copy.password}</Badge> : null}
            {student.role !== 'student' ? (
              <Badge variant="brand">{t.cabinet.userCard.roles[student.role]}</Badge>
            ) : null}
          </div>
          <p className="text-body-sm text-muted-foreground">
            {format(copy.registered, { date: formatDate(student.createdAt) })}
            {' · '}
            {student.lastLoginAt
              ? format(copy.lastLogin, { date: formatDateTime(student.lastLoginAt) })
              : copy.lastLoginNever}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive self-start md:self-center"
          disabled={remove.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
          {copy.delete}
        </Button>
      </header>

      <ErrorNotice message={notice} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={copy.sections.profile}>
          <ProfileSection student={student} />
        </SectionCard>

        <SectionCard title={copy.sections.progress}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              value={String(progress.testsPassed)}
              label={copy.progress.testsPassed}
              highlighted
            />
            <StatCard
              value={progress.averagePercent === null ? NO_VALUE : `${progress.averagePercent}%`}
              label={copy.progress.average}
            />
            <StatCard value={String(progress.mistakes)} label={copy.progress.mistakes} />
            <StatCard
              value={String(progress.subtopicsDone)}
              suffix={`/${progress.subtopicsTotal}`}
              label={copy.progress.subtopics}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={copy.sections.access}
        actions={
          student.role === 'student' ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setAccess(true)}>
              <KeyRound />
              {copy.accessSection.manage}
            </Button>
          ) : undefined
        }
      >
        {!hasGrants ? (
          <p className="text-body-sm text-muted-foreground">{copy.accessSection.none}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {student.subjectGrants.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-body-md text-foreground font-semibold">
                  {copy.accessSection.subjects}
                </h3>
                <ul className="flex flex-col gap-2">
                  {student.subjectGrants.map((grant) => (
                    <GrantRow
                      key={grant.subjectId}
                      title={grant.subjectTitle}
                      subtitle={accessCopy.subject.covers}
                      source={grant.source}
                      createdAt={grant.createdAt}
                      revokeLabel={format(accessCopy.subject.revokeFor, {
                        title: grant.subjectTitle,
                      })}
                      onRevoke={() => setToRevoke({ type: 'subject', grant })}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
            {student.subtopicGrants.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-body-md text-foreground font-semibold">
                  {copy.accessSection.subtopics}
                </h3>
                <ul className="flex flex-col gap-2">
                  {student.subtopicGrants.map((grant) => (
                    <GrantRow
                      key={grant.subtopicId}
                      title={grant.subtopicTitle}
                      subtitle={
                        formatContentPath([grant.subjectTitle, grant.topicTitle]) ??
                        accessCopy.subtopic.title
                      }
                      source={grant.source}
                      createdAt={grant.createdAt}
                      revokeLabel={format(accessCopy.subtopic.revokeFor, {
                        title: grant.subtopicTitle,
                      })}
                      onRevoke={() => setToRevoke({ type: 'subtopic', grant })}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard title={copy.sections.attempts}>
        {attempts.isError ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {copy.attempts.loadError}
          </p>
        ) : attempts.isPending ? (
          <LogoLoader size="sm" className="py-6" />
        ) : attempts.data.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{copy.attempts.empty}</p>
        ) : (
          <AttemptsTable attempts={attempts.data} />
        )}
      </SectionCard>

      <SectionCard
        title={copy.sections.activity}
        actions={<PresenceStatus presence={student.presence} now={now} className="text-body-sm" />}
      >
        <SessionsList sessions={student.sessions} activeDaysLast30={student.activeDaysLast30} />
      </SectionCard>

      {renaming ? (
        <StudentNameDialog
          name={student.name}
          surname={student.surname}
          onSubmit={(values) => rename.mutateAsync(values)}
          onClose={() => setRenaming(false)}
        />
      ) : null}

      {access ? <StudentAccessDialog student={student} onClose={() => setAccess(false)} /> : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={copy.deleteTitle}
        description={format(copy.deleteDescription, { name: fullName, email: student.email })}
        confirmLabel={t.adminContent.common.delete}
        requireText={{
          value: student.email,
          kind: t.adminContent.common.typeToConfirm.kinds.studentEmail,
        }}
        onConfirm={() =>
          void run(async () => {
            await remove.mutateAsync();
            router.replace('/admin/students');
          }, copy.deleteError)
        }
      />

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setToRevoke(null);
        }}
        title={
          toRevoke?.type === 'subject'
            ? accessCopy.subject.revokeTitle
            : accessCopy.subtopic.revokeTitle
        }
        description={
          toRevoke?.type === 'subject'
            ? format(accessCopy.subject.revokeDescription, {
                name: fullName,
                title: toRevoke.grant.subjectTitle,
              })
            : format(accessCopy.subtopic.revokeDescription, {
                name: fullName,
                title: toRevoke?.grant.subtopicTitle ?? '',
              })
        }
        confirmLabel={
          toRevoke?.type === 'subject'
            ? accessCopy.subject.revokeConfirm
            : accessCopy.subtopic.revokeConfirm
        }
        onConfirm={() => {
          if (!toRevoke) return;
          if (toRevoke.type === 'subject') {
            const { subjectId } = toRevoke.grant;
            void run(() => revokeSubject.mutateAsync(subjectId), accessCopy.subject.revokeError);
          } else {
            const { subtopicId } = toRevoke.grant;
            void run(() => revoke.mutateAsync(subtopicId), accessCopy.subtopic.revokeError);
          }
        }}
      />
    </div>
  );
}

/** The page of one student: who they are, what they may open, what they did, when they were here. */
export function StudentPage({ id }: { id: string }) {
  const copy = t.adminContent.students;
  const { data: student, isPending, isError, error } = useStudent(id);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <AdminPageHeader title={t.admin.students.title} backHref="/admin/students" />
        <EmptyState
          title={isApiStatus(error, 404) ? copy.notFound : copy.loadError}
          action={
            <LinkButton href="/admin/students" variant="secondary">
              {copy.backToList}
            </LinkButton>
          }
        />
      </div>
    );
  }

  if (isPending) return <LogoLoader size="lg" fill />;

  return <StudentView student={student} />;
}
