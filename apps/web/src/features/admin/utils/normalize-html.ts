/**
 * Brings html to one canonical spelling, so two texts that only differ in how the markup is
 * written compare as equal. The api sanitizer writes `<br />` and `<img ... />`, while the editor
 * writes `<br>` and `<img ...>`; without this, a saved description would look "changed" again.
 * The browser parser decides the canonical form. Outside the browser the text is returned as is.
 */
export function normalizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html;
  return new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
}
