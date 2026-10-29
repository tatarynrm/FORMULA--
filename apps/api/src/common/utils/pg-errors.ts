const POSTGRES_UNIQUE_VIOLATION = '23505';

/** True when `error` is a PostgreSQL unique-constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}
