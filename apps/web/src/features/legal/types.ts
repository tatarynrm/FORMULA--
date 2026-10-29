/** A list entry: plain text, or a bold lead-in term followed by an explanation. */
export type PolicyItem = string | { readonly term: string; readonly text: string };

export interface PolicySectionData {
  /** URL-safe slug (latin, kebab-case): used as the anchor and in `aria-labelledby`. */
  readonly id: string;
  readonly title: string;
  /** Paragraphs shown before the list. */
  readonly paragraphs?: readonly string[];
  readonly items?: readonly PolicyItem[];
  /** Paragraphs shown after the list. */
  readonly closing?: readonly string[];
}

export interface PolicyTocItem {
  readonly id: string;
  readonly title: string;
}
