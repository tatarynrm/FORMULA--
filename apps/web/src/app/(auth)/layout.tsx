import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Container } from '@/components/common/container';
import { SiteHeader } from '@/features/site/components/site-header';

// Sign-in and sign-up pages have no value in search results (and are disallowed in robots.txt).
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-10 pb-20">
        <Container className="flex justify-center">{children}</Container>
      </main>
    </>
  );
}
