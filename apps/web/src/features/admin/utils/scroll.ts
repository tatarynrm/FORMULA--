/**
 * Smoothly brings an element on the page into view and moves the keyboard focus to it (the element
 * needs `tabIndex={-1}` to take focus). Respects the "reduce motion" setting of the visitor.
 */
export function scrollToElement(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
}
