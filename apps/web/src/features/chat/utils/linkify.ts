export type TextPart =
  { kind: 'text'; value: string } | { kind: 'link'; value: string; href: string };

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'«»]+/gi;
/** Punctuation that usually ends a sentence rather than belongs to the address. */
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Splits a message into plain text and links, so the text can be rendered as text (never as
 * html) with the addresses turned into anchors. Links without a scheme get `https://`.
 */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index;
    let value = match[0].replace(TRAILING, '');
    // Keep a closing bracket when the address opened one: "(https://a.b/c)" vs "https://a.b/c(d)".
    const opened = (value.match(/\(/g) ?? []).length;
    const closed = (value.match(/\)/g) ?? []).length;
    if (match[0][value.length] === ')' && opened > closed) value += ')';

    if (start > cursor) parts.push({ kind: 'text', value: text.slice(cursor, start) });
    parts.push({
      kind: 'link',
      value,
      href: /^https?:\/\//i.test(value) ? value : `https://${value}`,
    });
    cursor = start + value.length;
  }

  if (cursor < text.length) parts.push({ kind: 'text', value: text.slice(cursor) });
  return parts;
}
