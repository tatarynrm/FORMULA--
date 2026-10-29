/**
 * Titles and bodies of the notifications the api writes. They are stored with the notification
 * (Telegram and email will send the same text), so they live here in Ukrainian on purpose, the
 * same way the built-in menu labels live in the migrations.
 */

const PREVIEW_LENGTH = 140;

/** First line of a message, shortened, for list previews. */
export function previewOf(body: string, hasImage: boolean): string {
  const line = body.trim().split('\n')[0] ?? '';
  if (!line) return hasImage ? '📷 Фото' : '';
  const text = line.length > PREVIEW_LENGTH ? `${line.slice(0, PREVIEW_LENGTH - 1)}…` : line;
  return hasImage ? `📷 ${text}` : text;
}

export const NOTIFICATION_TEXTS = {
  reviewPending: (student: string, test: string, subject: string | null) => ({
    title: 'Нова робота на перевірку',
    body: `${student}: ${test}${subject ? ` (${subject})` : ''}`,
  }),
  reviewDone: (test: string, score: number, maxScore: number) => ({
    title: 'Тест перевірено',
    body: `${test}: ${score} з ${maxScore} балів`,
  }),
  accessSubject: (subject: string) => ({
    title: 'Відкрито доступ до предмета',
    body: subject,
  }),
  accessSubtopics: (titles: string[]) => {
    if (titles.length === 1) {
      return { title: 'Відкрито доступ до підтеми', body: titles[0] ?? '' };
    }
    const shown = titles.slice(0, 5).join(', ');
    const rest = titles.length - 5;
    return {
      title: `Відкрито доступ до підтем: ${titles.length}`,
      body: rest > 0 ? `${shown} та ще ${rest}` : shown,
    };
  },
  chatFromStudent: (student: string, preview: string) => ({
    title: 'Нове повідомлення в підтримці',
    body: `${student}: ${preview}`,
  }),
  testimonialPending: (author: string, preview: string) => ({
    title: 'Новий відгук на перевірку',
    body: `${author}: ${preview}`,
  }),
  testimonialApproved: {
    title: 'Відгук опубліковано',
    body: 'Дякуємо! Ваш відгук тепер на сайті.',
  },
  testimonialRejected: {
    title: 'Відгук не опубліковано',
    body: 'Адміністратор не прийняв цей відгук. Ви можете написати новий.',
  },
  chatFromSupport: (preview: string) => ({
    title: 'Відповідь підтримки',
    body: preview,
  }),
} as const;
