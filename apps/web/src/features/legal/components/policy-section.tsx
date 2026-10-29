import { Reveal } from '@/components/common/reveal';

import type { PolicyItem, PolicySectionData } from '../types';

interface PolicySectionProps {
  section: PolicySectionData;
  /** 1-based position shown in the number badge. */
  number: number;
}

function PolicyListItem({ item }: { item: PolicyItem }) {
  if (typeof item === 'string') return <li>{item}</li>;
  return (
    <li>
      <strong className="text-foreground font-semibold">{item.term}:</strong> {item.text}
    </li>
  );
}

/** One numbered policy section rendered as a card. The `id` doubles as the anchor target. */
export function PolicySection({ section, number }: PolicySectionProps) {
  const { id, title, paragraphs, items, closing } = section;
  const headingId = `${id}-title`;

  return (
    <Reveal>
      <section
        id={id}
        aria-labelledby={headingId}
        className="bg-card flex scroll-mt-28 flex-col gap-5 rounded-3xl p-6 md:p-10"
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="bg-surface-soft text-foreground text-body-md flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
          >
            {number}
          </span>
          <h2 id={headingId} className="text-h3 text-foreground">
            {title}
          </h2>
        </div>

        <div className="text-body-md text-text-secondary flex flex-col gap-4">
          {paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {items && (
            <ul className="marker:text-primary flex list-disc flex-col gap-3 pl-5">
              {items.map((item) => (
                <PolicyListItem key={typeof item === 'string' ? item : item.term} item={item} />
              ))}
            </ul>
          )}
          {closing?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
