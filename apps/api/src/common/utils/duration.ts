const UNIT_MS = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

type Unit = keyof typeof UNIT_MS;

/** Parses strings like `15m`, `7d`, `30s` into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${value}". Use a number and a unit: ms, s, m, h or d (e.g. 15m).`,
    );
  }
  return Number(match[1]) * UNIT_MS[match[2] as Unit];
}
