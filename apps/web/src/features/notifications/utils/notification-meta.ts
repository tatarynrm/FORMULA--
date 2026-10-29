import type { NotificationType } from '@formula/shared';
import {
  CheckCircle2,
  ClipboardList,
  Info,
  KeyRound,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Star,
} from 'lucide-react';

export interface NotificationMeta {
  icon: LucideIcon;
  /** Classes of the icon bubble (text colour on a soft background), design tokens only. */
  accent: string;
}

/** How each notification type looks. A new type: add it to `NOTIFICATION_TYPES` in shared, then here. */
const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  review_pending: { icon: ClipboardList, accent: 'bg-accent text-accent-blue' },
  review_done: { icon: CheckCircle2, accent: 'bg-success-soft text-success' },
  access_granted: { icon: KeyRound, accent: 'bg-secondary text-primary' },
  news: { icon: Megaphone, accent: 'bg-secondary text-primary' },
  chat_message: { icon: MessageCircle, accent: 'bg-accent text-accent-blue' },
  testimonial_pending: { icon: Star, accent: 'bg-secondary text-primary' },
  testimonial_result: { icon: Star, accent: 'bg-success-soft text-success' },
  system: { icon: Info, accent: 'bg-muted text-muted-foreground' },
};

/** Icon and accent of a type; a type this build does not know yet looks like `system`. */
export function getNotificationMeta(type: string): NotificationMeta {
  return (
    (NOTIFICATION_META as Record<string, NotificationMeta | undefined>)[type] ??
    NOTIFICATION_META.system
  );
}

/** "99+" when the count does not fit on the badge. */
export function formatBadge(count: number, overflow: string): string {
  return count > 99 ? overflow : String(count);
}
