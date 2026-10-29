/** Whether a user is on the site right now, and when they were last seen. */
export interface UserPresence {
  /** Seen within the online window (see `PRESENCE.ONLINE_WINDOW_SECONDS`). */
  online: boolean;
  /** Last request of the user (ISO), `null` for an account that never signed in. */
  lastSeenAt: string | null;
}

/** One stretch of activity: from the first request to the last one before a long pause. */
export interface PresenceSession {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  durationSeconds: number;
}

/** The activity history of one student, newest session first. */
export interface StudentPresenceHistory extends UserPresence {
  sessions: PresenceSession[];
  /** Days with at least one session in the last 30 days. */
  activeDaysLast30: number;
}
