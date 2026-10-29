const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** ISO string -> "14.10.2026". */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** ISO string -> "14.10.2026, 19:34". */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}
