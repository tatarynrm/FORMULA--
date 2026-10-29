import { PRESENCE, type PresenceSession, type UserPresence } from '@formula/shared';

import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { formatDate } from '../utils/format-date';
import { formatDuration, formatLastSeen, formatTime } from '../utils/presence-format';

interface PresenceStatusProps {
  presence: UserPresence;
  /** The current time, so every row of a list reads the same clock. */
  now: number;
  className?: string;
}

/** Green dot and "Онлайн", or when the student was last seen, or that they never signed in. */
export function PresenceStatus({ presence, now, className }: PresenceStatusProps) {
  const copy = t.adminContent.students;

  if (presence.online) {
    return (
      <span className={cn('text-success inline-flex items-center gap-2 font-medium', className)}>
        <span className="bg-success size-2.5 shrink-0 rounded-full" aria-hidden />
        {copy.online}
      </span>
    );
  }

  return (
    <span className={cn('text-text-secondary', className)}>
      {presence.lastSeenAt
        ? format(copy.lastSeen, { time: formatLastSeen(presence.lastSeenAt, now) })
        : copy.never}
    </span>
  );
}

interface SessionsListProps {
  sessions: PresenceSession[];
  activeDaysLast30: number;
}

/** Active days of the last month and the sessions (newest first), each with date, time and length. */
export function SessionsList({ sessions, activeDaysLast30 }: SessionsListProps) {
  const copy = t.adminContent.students;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-muted-foreground">
        {copy.activeDays}: <span className="text-foreground font-semibold">{activeDaysLast30}</span>
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-body-md text-foreground font-semibold">{copy.sessions}</h3>
          <p className="text-body-xs text-muted-foreground">
            {format(copy.sessionsHint, { minutes: PRESENCE.SESSION_GAP_SECONDS / 60 })}
          </p>
        </div>
        {sessions.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{copy.noSessions}</p>
        ) : (
          <ul className="border-input flex max-h-80 flex-col overflow-y-auto rounded-xl border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="text-body-sm border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-3 py-2 last:border-b-0"
              >
                <span className="text-foreground font-medium">{formatDate(session.startedAt)}</span>
                <span className="text-text-secondary">
                  {format(copy.timeRange, {
                    from: formatTime(session.startedAt),
                    to: formatTime(session.lastSeenAt),
                  })}
                </span>
                <span className="text-muted-foreground">
                  {formatDuration(session.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
