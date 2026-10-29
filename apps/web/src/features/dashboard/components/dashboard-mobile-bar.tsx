'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';

import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { t } from '@/locales';

import { DashboardSidebar } from './dashboard-sidebar';

interface DashboardMobileBarProps {
  homeHref: string;
}

/** Top bar with a slide-out menu. Visible below the `lg` breakpoint, where the sidebar is hidden. */
export function DashboardMobileBar({ homeHref }: DashboardMobileBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-3 lg:hidden">
      <Logo href={homeHref} />
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t.common.openMenu}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-background w-72 p-4">
            <SheetHeader className="sr-only">
              <SheetTitle>{t.brand.name}</SheetTitle>
              <SheetDescription>{t.brand.tagline}</SheetDescription>
            </SheetHeader>
            <DashboardSidebar
              homeHref={homeHref}
              onNavigate={() => setOpen(false)}
              withBell={false}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
