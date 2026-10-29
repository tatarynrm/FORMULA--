/**
 * `items` in the order of `ids`; items that are not listed keep their order, after the listed ones.
 * Used to show a new order before the server has confirmed it.
 */
export function sortByIds<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[],
): T[] {
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (left, right) =>
      (position.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (position.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}
