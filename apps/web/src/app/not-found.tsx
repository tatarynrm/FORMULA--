import type { Metadata } from 'next';

import { LinkButton } from '@/components/common/link-button';
import { NotFoundIllustration } from '@/components/common/status-illustrations';
import { StatusScene } from '@/components/common/status-scene';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.errors.notFoundTitle,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusScene
      eyebrow={t.errors.notFoundEyebrow}
      title={t.errors.notFoundTitle}
      description={t.errors.notFoundDescription}
      illustration={<NotFoundIllustration />}
      actions={
        <>
          <LinkButton href="/">{t.errors.notFoundCta}</LinkButton>
          <LinkButton href="/cabinet" variant="secondary">
            {t.errors.notFoundSecondaryCta}
          </LinkButton>
        </>
      }
    />
  );
}
