import { Fragment, useMemo } from 'react';

import { splitLinks } from '../utils/linkify';

/**
 * The body of a message, rendered as text (never as html) with web addresses turned into links
 * that open in a new tab. Line breaks are kept; long words and addresses wrap.
 */
export function MessageText({ text }: { text: string }) {
  const parts = useMemo(() => splitLinks(text), [text]);

  return (
    <p className="text-body-md wrap-anywhere whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.kind === 'link' ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-current/50 underline-offset-2 hover:decoration-current"
          >
            {part.value}
          </a>
        ) : (
          <Fragment key={index}>{part.value}</Fragment>
        ),
      )}
    </p>
  );
}
