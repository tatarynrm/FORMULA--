const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids in the address are checked here so a mistyped one shows "not found" instead of an api error. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
