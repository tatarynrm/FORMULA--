'use client';

import { EmptyState } from '@/components/common/empty-state';
import { LogoLoader } from '@/components/common/logo-loader';
import { RichTextContent } from '@/components/common/rich-text/rich-text-content';
import { t } from '@/locales';

import { useMenuPage } from '../hooks/use-menu';

/**
 * A page that the superadmin added to a menu: a title and a text written in the rich text editor.
 * The api only returns it to people who may open that menu item.
 */
export function MenuPageView({ itemId }: { itemId: string }) {
  const { data: page, isPending, isError } = useMenuPage(itemId);

  if (isPending) return <LogoLoader size="lg" fill />;
  if (isError || !page) return <EmptyState title={t.menuPage.loadError} />;

  return (
    <article className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-title text-foreground">{page.title}</h1>
      {page.bodyHtml ? (
        <RichTextContent html={page.bodyHtml} />
      ) : (
        <p className="text-body-md text-muted-foreground">{t.menuPage.empty}</p>
      )}
    </article>
  );
}
