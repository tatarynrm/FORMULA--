import sanitizeHtml from 'sanitize-html';

/** Images in rich text may only point to our own file endpoint (relative or absolute). */
const OWN_FILE_URL = /^(https?:\/\/[^/\s]+)?\/api\/v1\/files\/[0-9a-f-]{36}$/i;

/**
 * Cleans the HTML written in the rich text editor before it is stored (and later rendered with
 * `dangerouslySetInnerHTML`). Only formatting the editor can produce is kept: no scripts, styles,
 * event handlers or foreign images.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'hr',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'sub',
      'sup',
      'mark',
      'code',
      'pre',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !OWN_FILE_URL.test(frame.attribs['src'] ?? ''),
  });
}
