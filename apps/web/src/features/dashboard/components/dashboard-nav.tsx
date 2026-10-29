'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MaskIcon } from '@/components/common/mask-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { getMenuIconSrc } from '@/features/menu/icons';
import { useMenu } from '@/features/menu/hooks/use-menu';
import { useNavBadges } from '@/features/notifications/hooks/use-nav-badges';
import { cn } from '@/lib/utils';
import { format } from '@/lib/format';
import { t } from '@/locales';

interface DashboardNavProps {
  onNavigate?: () => void;
}

const BADGE_CAP = 99;

/** What a menu key's badge counts, for the screen reader: «Непрочитаних повідомлень у підтримці: 3». */
const BADGE_LABELS: Readonly<Record<string, string>> = {
  support: t.chat.nav.unread,
  testimonials: t.testimonials.nav.pending,
};

/** The round counter at the end of a menu row. */
function NavBadge({ menuKey, count }: { menuKey: string; count: number }) {
  return (
    <span
      role="status"
      aria-label={format(BADGE_LABELS[menuKey] ?? '{count}', { count })}
      className="bg-primary text-primary-foreground text-body-xs ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-semibold tabular-nums"
    >
      {count > BADGE_CAP ? `${BADGE_CAP}+` : count}
    </span>
  );
}

/** Sidebar links. The items come from the api, so each user sees only the sections they may use. */
export function DashboardNav({ onNavigate }: DashboardNavProps) {
  const pathname = usePathname();
  const { data: items, isPending } = useMenu();
  const badges = useNavBadges();

  if (isPending || !items) {
    return (
      <div className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-2">
      {items.map(({ id, key, href, label, icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        const badge = badges[key] ?? 0;

        return (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'text-body-sm flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors',
              isActive
                ? 'bg-card text-primary'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            <MaskIcon src={getMenuIconSrc(icon)} />
            {label}
            {badge > 0 ? <NavBadge menuKey={key} count={badge} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
