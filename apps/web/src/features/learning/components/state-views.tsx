import { EmptyState } from '@/components/common/empty-state';
import { LinkButton } from '@/components/common/link-button';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

import { LEARNING_ROUTES } from '../utils/paths';

/** Logo with pulses while a screen waits for its data. */
export function PageLoading({ className }: { className?: string }) {
  return <LogoLoader fill className={className} />;
}

interface LoadErrorStateProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

/** The api could not be reached or answered with an error. */
export function LoadErrorState({
  onRetry,
  title = t.learning.common.loadErrorTitle,
  description = t.learning.common.loadErrorDescription,
}: LoadErrorStateProps) {
  return (
    <div role="alert">
      <EmptyState
        title={title}
        description={description}
        action={
          onRetry ? (
            <Button type="button" variant="secondary" onClick={onRetry}>
              {t.learning.common.retry}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

interface NotFoundStateProps {
  title: string;
  description: string;
  href?: string;
  label?: string;
}

/** The api answered 404: the item does not exist, is not published, or belongs to someone else. */
export function NotFoundState({
  title,
  description,
  href = LEARNING_ROUTES.home,
  label = t.learning.common.backHome,
}: NotFoundStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={<LinkButton href={href}>{label}</LinkButton>}
    />
  );
}
