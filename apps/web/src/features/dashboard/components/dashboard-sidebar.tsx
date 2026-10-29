import { Logo } from '@/components/common/logo';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

import { DashboardNav } from './dashboard-nav';
import { UserCard } from './user-card';

interface DashboardSidebarProps {
  homeHref: string;
  onNavigate?: () => void;
  /** The mobile bar has its own bell, so the copy inside the slide-out menu goes without one. */
  withBell?: boolean;
}

export function DashboardSidebar({ homeHref, onNavigate, withBell = true }: DashboardSidebarProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-9">
      <div className="flex flex-col gap-9">
        <div className="flex items-center justify-between gap-3">
          <Logo href={homeHref} size="xl" animated />
          {withBell ? <NotificationBell /> : null}
        </div>
        <DashboardNav onNavigate={onNavigate} />
      </div>
      <UserCard />
    </div>
  );
}
