'use client';

import type { NotificationBroadcast } from '@formula/shared';
import Link from 'next/link';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { Button } from '@/components/ui/button';
import { isApiStatus } from '@/features/admin/utils/api-error';
import { formatDateTime } from '@/features/admin/utils/format-date';
import { format, pluralizeUk } from '@/lib/format';
import { t } from '@/locales';

import { useNewsHistory } from '../hooks/use-news';

function NewsCard({ item }: { item: NotificationBroadcast }) {
  const copy = t.notifications.news.history;

  return (
    <article className="bg-surface-raised border-input flex flex-col gap-2 rounded-2xl border p-4 md:p-5">
      <h3 className="text-body-md text-foreground font-bold break-words">{item.title}</h3>
      <p className="text-body-sm text-text-secondary line-clamp-3 break-words whitespace-pre-line">
        {item.body}
      </p>
      {item.link ? (
        <Link
          href={item.link}
          className="text-body-sm text-primary w-fit break-all hover:underline"
        >
          {copy.link}: {item.link}
        </Link>
      ) : null}
      <p className="text-body-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <time dateTime={item.sentAt}>{formatDateTime(item.sentAt)}</time>
        {item.sentBy ? <span>{format(copy.sentBy, { name: item.sentBy.name })}</span> : null}
        <span>
          {format(copy.recipients, {
            count: item.recipients,
            noun: pluralizeUk(item.recipients, copy.recipientsForms),
          })}
        </span>
      </p>
    </article>
  );
}

/** News sent so far, newest first, with a "show more" button for older pages. */
export function NewsHistory() {
  const copy = t.notifications.news.history;
  const history = useNewsHistory();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3 text-foreground">{copy.title}</h2>

      {history.isError ? (
        <EmptyState
          title={isApiStatus(history.error, 403) ? copy.forbidden : copy.loadError}
          action={
            isApiStatus(history.error, 403) ? undefined : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void history.refetch()}
              >
                {t.notifications.list.retry}
              </Button>
            )
          }
        />
      ) : history.isPending ? (
        <LogoLoader size="lg" className="py-12" />
      ) : history.items.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyHint} />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {history.items.map((item) => (
              <li key={item.id}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
          {history.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void history.fetchNextPage()}
                disabled={history.isFetchingNextPage}
              >
                {history.isFetchingNextPage ? t.notifications.list.loadingMore : copy.loadMore}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
