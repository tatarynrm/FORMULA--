'use client';

import { useEffect } from 'react';

import { LinkButton } from '@/components/common/link-button';
import { ErrorIllustration } from '@/components/common/status-illustrations';
import { StatusScene } from '@/components/common/status-scene';
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
    <StatusScene
      eyebrow={t.errors.genericEyebrow}
      title={t.errors.genericTitle}
      description={t.errors.genericDescription}
      illustration={<ErrorIllustration />}
      actions={
        <>
          <Button onClick={reset}>{t.errors.retry}</Button>
          <LinkButton href="/" variant="secondary">
            {t.errors.home}
          </LinkButton>
        </>
      }
      note={
        error.digest ? (
          <p className="text-muted-foreground text-xs">
            {t.errors.genericCode}: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null
      }
    />
  );
}
