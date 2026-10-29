import { PageHeader } from '@/components/common/page-header';
import { t } from '@/locales';

import { NewsComposer } from './news-composer';
import { NewsHistory } from './news-history';

/** `/admin/news`: write a news item for every student, then see what was sent before. */
export function NewsPage() {
  const copy = t.notifications.news;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={copy.pageTitle} description={copy.intro} />
      <NewsComposer />
      <NewsHistory />
    </div>
  );
}
