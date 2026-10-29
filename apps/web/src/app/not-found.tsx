import { LinkButton } from '@/components/common/link-button';
import { t } from '@/locales';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-stat text-primary">404</p>
      <h1 className="text-h2 text-foreground">{t.errors.notFoundTitle}</h1>
      <p className="text-body-md text-muted-foreground max-w-md">{t.errors.notFoundDescription}</p>
      <LinkButton href="/">{t.errors.notFoundCta}</LinkButton>
    </main>
  );
}
