import { parseDurationMs } from './duration.js';

describe('parseDurationMs', () => {
  it('parses supported units', () => {
    expect(parseDurationMs('500ms')).toBe(500);
    expect(parseDurationMs('30s')).toBe(30_000);
    expect(parseDurationMs('15m')).toBe(900_000);
    expect(parseDurationMs('2h')).toBe(7_200_000);
    expect(parseDurationMs('7d')).toBe(604_800_000);
  });

  it('rejects malformed values', () => {
    expect(() => parseDurationMs('soon')).toThrow();
    expect(() => parseDurationMs('15')).toThrow();
  });
});
