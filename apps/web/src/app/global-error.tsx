'use client';

import { useEffect } from 'react';

import { ErrorIllustration } from '@/components/common/status-illustrations';
import { StatusScene } from '@/components/common/status-scene';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Last resort: replaces the root layout when it fails, so it brings its own <html> and styles. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // TODO: report to the error tracking service once one is chosen.
    console.error(error);
  }, [error]);

  return (
    <html lang="uk">
      <body>
        <StatusScene
          showLogo={false}
          eyebrow={t.errors.genericEyebrow}
          title={t.errors.genericTitle}
          description={t.errors.genericDescription}
          illustration={<ErrorIllustration />}
          actions={
            <>
              <Button onClick={reset}>{t.errors.retry}</Button>
              {/* A full page load on purpose: the router may be the very thing that broke. */}
              <Button
                variant="secondary"
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                onClick={() => (window.location.href = '/')}
              >
                {t.errors.home}
              </Button>
            </>
          }
        />
      </body>
    </html>
  );
}
