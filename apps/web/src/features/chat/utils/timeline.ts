import type { ChatSenderRole } from '@formula/shared';

import type { StatusNotice, ThreadData, ThreadMessage } from '../types';
import { dayKey, formatDayLabel } from './time';

/** Messages of one sender closer than this are shown as one group (avatar and name once). */
const GROUP_GAP_MS = 5 * 60_000;

export interface MessageGroup {
  kind: 'group';
  key: string;
  /** Written by this side of the conversation (shown on the right). */
  own: boolean;
  senderId: string | null;
  senderRole: ChatSenderRole;
  senderName: string;
  messages: ThreadMessage[];
}

export interface NoticeItem {
  kind: 'notice';
  key: string;
  notice: StatusNotice;
}

export type TimelineItem = MessageGroup | NoticeItem;

export interface DaySection {
  key: string;
  label: string;
  items: TimelineItem[];
}

type Entry = { at: number; message: ThreadMessage } | { at: number; notice: StatusNotice };

/**
 * Splits the thread into days, and the messages of a day into groups: consecutive messages of
 * the same sender within five minutes. System rows (closed, reopened) break a group.
 */
export function buildTimeline(data: ThreadData, side: ChatSenderRole, now: number): DaySection[] {
  const entries: Entry[] = [
    ...data.messages.map((message) => ({ at: new Date(message.createdAt).getTime(), message })),
    ...data.notices.map((notice) => ({ at: new Date(notice.at).getTime(), notice })),
  ].sort((left, right) => left.at - right.at);

  const sections: DaySection[] = [];
  let lastAt = 0;

  for (const entry of entries) {
    const iso = 'message' in entry ? entry.message.createdAt : entry.notice.at;
    const key = dayKey(iso);
    let section = sections.at(-1);
    if (!section || section.key !== key) {
      section = { key, label: formatDayLabel(iso, now), items: [] };
      sections.push(section);
    }

    if ('notice' in entry) {
      section.items.push({ kind: 'notice', key: entry.notice.id, notice: entry.notice });
      lastAt = entry.at;
      continue;
    }

    const { message } = entry;
    const last = section.items.at(-1);
    const continues =
      last?.kind === 'group' &&
      last.senderRole === message.senderRole &&
      last.senderId === message.senderId &&
      entry.at - lastAt < GROUP_GAP_MS;

    if (continues) {
      last.messages.push(message);
    } else {
      section.items.push({
        kind: 'group',
        key: message.id,
        own: message.senderRole === side,
        senderId: message.senderId,
        senderRole: message.senderRole,
        senderName: message.senderName,
        messages: [message],
      });
    }
    lastAt = entry.at;
  }

  return sections;
}

/** The last message written by this side: the one that carries the read receipt. */
export function lastOwnMessage(data: ThreadData, side: ChatSenderRole): ThreadMessage | undefined {
  for (let index = data.messages.length - 1; index >= 0; index -= 1) {
    const message = data.messages[index];
    if (message && message.senderRole === side) return message;
  }
  return undefined;
}
