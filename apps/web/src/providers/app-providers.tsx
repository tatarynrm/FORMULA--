import type { ReactNode } from 'react';

import { NavigationLoader } from '@/components/common/navigation-loader';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryProvider>
        {children}
        <NavigationLoader />
      </QueryProvider>
    </ThemeProvider>
  );
}
