import { env } from './env';

/**
 * Address of an uploaded file (avatar, question image, video, document). The api checks the
 * session cookie on every request, so this works in `<img>`, `<video>` and links.
 */
export function fileUrl(fileId: string): string {
  return `${env.NEXT_PUBLIC_API_URL}/v1/files/${fileId}`;
}

/**
 * Address of the profile picture shown with a PUBLISHED testimonial. Anyone may open it, so it
 * works on the landing page for visitors who are not signed in.
 */
export function testimonialAvatarUrl(testimonialId: string): string {
  return `${env.NEXT_PUBLIC_API_URL}/v1/testimonials/${testimonialId}/avatar`;
}

const SIZE_UNITS = ['Б', 'КБ', 'МБ', 'ГБ'] as const;

/** `1536` -> `1,5 КБ`. */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? String(Math.round(value)) : value.toFixed(1).replace('.', ',');
  return `${rounded} ${SIZE_UNITS[unit]}`;
}
