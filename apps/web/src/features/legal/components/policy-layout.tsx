import Link from 'next/link';
import type { ReactNode } from 'react';

import { Reveal } from '@/components/common/reveal';

import type { PolicyTocItem } from '../types';
import { PolicyToc } from './policy-toc';

interface PolicyLayoutProps {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  updatedIso: string;
  updatedDisplay: string;
  intro: readonly string[];
  summary?: { title: string; items: readonly string[] };
  breadcrumb: { label: string; homeLabel: string };
  toc: { title: string; navLabel: string; items: readonly PolicyTocItem[] };
  /** Section cards, rendered in the main column. */
  children: ReactNode;
}

/** Page frame for legal documents: breadcrumb, hero card, table of contents and the content column. */
export function PolicyLayout({
  eyebrow,
  title,
  updatedLabel,
  updatedIso,
  updatedDisplay,
  intro,
  summary,
  breadcrumb,
  toc,
  children,
}: PolicyLayoutProps) {
  return (
    <article className="flex flex-col gap-6 lg:gap-8">
      <Reveal>
        <header className="bg-card flex flex-col gap-6 rounded-3xl p-6 md:p-10">
          <nav aria-label={breadcrumb.label}>
            <ol className="text-body-sm text-text-secondary flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-primary focus-visible:ring-ring rounded-sm underline underline-offset-4 transition-colors outline-none focus-visible:ring-2"
                >
                  {breadcrumb.homeLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground font-medium">
                {title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col items-start gap-4">
            <p className="bg-surface-soft text-body-sm text-foreground rounded-full px-4 py-1.5 font-medium">
              {eyebrow}
            </p>
            <h1 className="text-h1 text-foreground">{title}</h1>
            <p className="text-body-md text-text-secondary">
              {updatedLabel}: <time dateTime={updatedIso}>{updatedDisplay}</time>
            </p>
          </div>

          <div className="text-body-lg text-text-secondary flex max-w-3xl flex-col gap-4">
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {summary && (
            <section
              aria-labelledby="policy-summary-title"
              className="bg-surface-soft flex flex-col gap-4 rounded-2xl p-5 md:p-6"
            >
              <h2 id="policy-summary-title" className="text-h3 text-foreground">
                {summary.title}
              </h2>
              <ul className="text-body-md text-text-secondary marker:text-primary flex list-disc flex-col gap-2 pl-5">
                {summary.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </header>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-32">
          <PolicyToc title={toc.title} navLabel={toc.navLabel} items={toc.items} />
        </aside>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </article>
  );
}
