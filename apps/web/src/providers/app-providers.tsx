import type { ReactNode } from 'react';

import { NavigationLoader } from '@/components/common/navigation-loader';
import { CookieConsent } from '@/features/consent/components/cookie-consent';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryProvider>
        {children}
        <NavigationLoader />
        <CookieConsent />
      </QueryProvider>
    </ThemeProvider>
  );
}
