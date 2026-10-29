'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { t } from '@/locales';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // TODO: report to the error tracking service once one is chosen.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-h2 text-foreground">{t.errors.genericTitle}</h1>
      <p className="text-body-md text-muted-foreground max-w-md">{t.errors.genericDescription}</p>
      <Button onClick={reset}>{t.errors.retry}</Button>
    </main>
  );
}
