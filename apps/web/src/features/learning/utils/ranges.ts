/**
 * Writes question numbers compactly: `[1, 2, 3, 5, 6, 9]` -> `1–3, 5, 6, 9`.
 * A run of three or more becomes a range; two neighbours stay separate numbers.
 */
export function formatNumberRanges(numbers: readonly number[]): string {
  const sorted = [...new Set(numbers)].sort((left, right) => left - right);
  const parts: string[] = [];

  let index = 0;
  while (index < sorted.length) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1] === (sorted[end] ?? 0) + 1) end += 1;

    const first = sorted[index] ?? 0;
    const last = sorted[end] ?? first;
    if (end - index >= 2) parts.push(`${first}–${last}`);
    else
      for (let position = index; position <= end; position += 1)
        parts.push(String(sorted[position]));

    index = end + 1;
  }

  return parts.join(', ');
}
