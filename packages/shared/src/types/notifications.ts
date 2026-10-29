import type { NotificationType } from '../constants/index.js';

/** One entry of the bell. Stored by the api; the same shape goes to future channels (Telegram, email). */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Path inside the site the notification leads to, e.g. `/cabinet/attempts/<id>/result`. */
  link: string | null;
  /** Type-specific details (ids), for the client and for future channels. */
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

/** Numbers for the bell: unread notifications plus, for admins, the queues they may handle. */
export interface NotificationSummary {
  unread: number;
  /** Situational attempts waiting for a review; `null` when the user has no `reviews` section. */
  pendingReviews: number | null;
  /** Support conversations with unread student messages; `null` without the `support` section. */
  unreadChats: number | null;
  /**
   * Unread support chat MESSAGES for the badge next to «Підтримка» in the menu: a student's count
   * is the answers of the team they have not read; an admin with the `support` section gets the
   * unread messages of all students. `null` for an admin without that section.
   */
  chatUnread: number | null;
  /** Testimonials waiting for moderation; `null` when the admin lacks the `testimonials` section. */
  pendingTestimonials: number | null;
}

/** A news item an admin sent to every student (kept for the history page). */
export interface NotificationBroadcast {
  id: string;
  title: string;
  body: string;
  link: string | null;
  /** How many students received it. */
  recipients: number;
  sentAt: string;
  sentBy: { id: string; name: string } | null;
}

export interface SendBroadcastInput {
  title: string;
  body: string;
  link?: string | null;
}
