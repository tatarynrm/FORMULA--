import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/features/dashboard/components/dashboard-shell';
import { StartTestProvider } from '@/features/learning/components/start/start-test-provider';
import { AccessUnlockDialog } from '@/features/notifications/components/access-unlock-dialog';
import { RealtimeProvider } from '@/features/realtime/realtime-provider';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: { default: t.cabinet.nav.home, template: `%s | ${t.brand.name}` },
  // Private area: never show in search results.
  robots: { index: false, follow: false },
};

// Access is gated by `proxy.ts` (cookie present) and `SessionGuard` (session still valid).
// `StartTestProvider` hosts the one "start a test" dialog that every list and result can open.
// `RealtimeProvider` keeps the live stream (notifications, chat) open for the whole cabinet.
// `AccessUnlockDialog` celebrates a subject or subtopic the admin has just opened, on any page.
export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <DashboardShell homeHref="/cabinet">
        <StartTestProvider>{children}</StartTestProvider>
      </DashboardShell>
      <AccessUnlockDialog />
    </RealtimeProvider>
  );
}
