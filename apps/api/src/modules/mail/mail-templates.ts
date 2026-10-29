/**
 * The emails the platform sends. Plain HTML with inline styles (mail clients ignore stylesheets)
 * plus a text version. The texts are Ukrainian on purpose and live here, the same way the
 * notification texts live in the notifications module.
 */

// Email clients cannot read the site's CSS variables, so the brand colours are repeated here.
const COLORS = {
  page: '#d9e9f5',
  card: '#ffffff',
  text: '#25283a',
  muted: '#6f7896',
  primary: '#e4739f',
  primaryDark: '#be3b6e',
  primarySoft: '#fdeaf1',
  divider: '#e7e8eb',
  onPrimary: '#ffffff',
} as const;

const FONT = "'Onest','DM Sans',Arial,Helvetica,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain text to paragraphs: a blank line starts a new one, a single line break stays. */
function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (part) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${COLORS.text};">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:999px;background:${COLORS.primary};"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:${COLORS.onPrimary};text-decoration:none;font-family:${FONT};">${escapeHtml(label)}</a></td></tr></table>`;
}

interface LayoutInput {
  /** The grey line some clients show next to the subject. */
  preheader: string;
  content: string;
  /** Small print under the card. */
  footer: string;
  /** A picture across the top of the card; it carries the logo, so the plain wordmark is skipped. */
  banner?: { url: string; alt: string };
}

function layout({ preheader, content, footer, banner }: LayoutInput): string {
  const wordmark = banner
    ? ''
    : `<tr><td style="padding:0 8px 16px;font-size:22px;font-weight:700;color:${COLORS.text};font-family:${FONT};">Formula</td></tr>`;
  const bannerRow = banner
    ? `<tr><td style="font-size:0;line-height:0;"><img src="${escapeHtml(banner.url)}" alt="${escapeHtml(banner.alt)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:24px 24px 0 0;"></td></tr>`
    : '';
  const cardRadius = banner ? '0 0 24px 24px' : '24px';

  return `<!doctype html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
${wordmark}${bannerRow}
<tr><td style="background:${COLORS.card};border-radius:${cardRadius};padding:32px;font-family:${FONT};">${content}</td></tr>
<tr><td style="padding:16px 8px 0;font-size:13px;line-height:1.5;color:${COLORS.muted};font-family:${FONT};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const WELCOME_STEPS = [
  {
    title: 'Заповніть профіль',
    text: 'Розкажіть про себе й про цілі: так навчання буде зручнішим.',
  },
  {
    title: 'Дочекайтеся доступу до предметів',
    text: 'Команда Formula відкриває предмети й теми, а про кожен новий доступ ви отримаєте сповіщення в кабінеті.',
  },
  {
    title: 'Навчайтеся й дивіться прогрес',
    text: 'Проходьте тести, повертайтеся до матеріалів і ставте питання в чаті підтримки.',
  },
] as const;

function steps(): string {
  return WELCOME_STEPS.map(
    (step, index) =>
      `<tr><td width="44" valign="top" style="padding:0 0 18px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="32" height="32" align="center" valign="middle" style="width:32px;height:32px;border-radius:16px;background:${COLORS.primarySoft};color:${COLORS.primaryDark};font-size:15px;font-weight:700;font-family:${FONT};">${index + 1}</td></tr></table></td><td valign="top" style="padding:0 0 18px;font-family:${FONT};"><div style="font-size:16px;font-weight:700;color:${COLORS.text};margin:0 0 2px;">${escapeHtml(step.title)}</div><div style="font-size:15px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(step.text)}</div></td></tr>`,
  ).join('');
}

export function welcomeEmail(input: {
  name: string;
  /** The address the person signed up with: it is their login. */
  email: string;
  cabinetUrl: string;
  bannerUrl: string;
  privacyUrl: string;
  supportEmail: string | null;
}): RenderedEmail {
  const subject = 'Реєстрацію завершено: ласкаво просимо до Formula';
  const heading = `Вітаємо, ${input.name}!`;
  const lead =
    'Ваш акаунт створено, реєстрація пройшла успішно. Formula допоможе підготуватися до НМТ: теми, тести й матеріали зібрані в одному кабінеті.';
  const stepsTitle = 'З чого почати';
  const cta = 'Відкрити кабінет';
  const login = `Ваш логін: ${input.email}`;
  const help = input.supportEmail
    ? `Є питання? Просто дайте відповідь на цей лист або напишіть на ${input.supportEmail}.`
    : 'Є питання? Напишіть нам у чаті підтримки в кабінеті.';
  const privacy = 'Політика конфіденційності';

  const content = `<h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:${COLORS.text};">${escapeHtml(heading)}</h1>${paragraphs(lead)}${button(cta, input.cabinetUrl)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:${COLORS.page};border-radius:16px;padding:14px 18px;font-size:14px;color:${COLORS.text};font-family:${FONT};">${escapeHtml(login)}</td></tr></table>
<h2 style="margin:0 0 16px;font-size:18px;color:${COLORS.text};">${stepsTitle}</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps()}</table>
<div style="height:1px;background:${COLORS.divider};margin:8px 0 20px;"></div>
${paragraphs(help)}`;

  return {
    subject,
    html: layout({
      preheader: 'Реєстрацію завершено. Ось із чого почати навчання.',
      banner: { url: input.bannerUrl, alt: 'Реєстрація успішна' },
      content,
      footer: `Ви отримали цей лист, бо зареєструвалися на Formula. Це службове повідомлення, його не можна вимкнути. <a href="${escapeHtml(input.privacyUrl)}" style="color:${COLORS.muted};">${privacy}</a>.`,
    }),
    text: [
      heading,
      '',
      lead,
      '',
      `${cta}: ${input.cabinetUrl}`,
      login,
      '',
      `${stepsTitle}:`,
      ...WELCOME_STEPS.map((step, index) => `${index + 1}. ${step.title}. ${step.text}`),
      '',
      help,
      '',
      `${privacy}: ${input.privacyUrl}`,
      '',
    ].join('\n'),
  };
}

export function newsEmail(input: {
  title: string;
  body: string;
  /** Full address the news leads to, if any. */
  url: string | null;
  unsubscribeUrl: string;
}): RenderedEmail {
  const cta = 'Перейти на сайт';
  const unsubscribe = 'Відписатися від новин';

  return {
    subject: input.title,
    html: layout({
      preheader: input.body.split('\n')[0] ?? '',
      content: `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${COLORS.text};">${escapeHtml(input.title)}</h1>${paragraphs(input.body)}${input.url ? button(cta, input.url) : ''}`,
      footer: `Ви отримали цей лист, бо навчаєтеся на Formula. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${COLORS.muted};">${unsubscribe}</a>.`,
    }),
    text: `${input.title}\n\n${input.body}\n${input.url ? `\n${cta}: ${input.url}\n` : ''}\n${unsubscribe}: ${input.unsubscribeUrl}\n`,
  };
}

/** The small pages of the unsubscribe link (opened in a browser from the email). */
export function unsubscribePage(input: {
  kind: 'confirm' | 'done' | 'invalid';
  /** Where the confirm button posts to. */
  action?: string;
  siteUrl: string;
}): string {
  const texts = {
    confirm: {
      title: 'Відписатися від новин?',
      body: 'Ми більше не надсилатимемо новини Formula на вашу пошту. Важливі службові листи (наприклад, про пароль) ви отримуватимете й надалі.',
    },
    done: {
      title: 'Готово, ви відписані',
      body: 'Новини Formula більше не надходитимуть на вашу пошту. Передумаєте? Скажіть нам у підтримці.',
    },
    invalid: {
      title: 'Посилання недійсне',
      body: 'Схоже, посилання пошкоджене. Спробуйте відкрити його з листа ще раз.',
    },
  }[input.kind];

  const action =
    input.kind === 'confirm' && input.action
      ? `<form method="post" action="${escapeHtml(input.action)}"><button type="submit" style="border:0;border-radius:999px;background:${COLORS.primary};color:${COLORS.onPrimary};padding:14px 28px;font:700 16px ${FONT};cursor:pointer;">Так, відписатися</button></form>`
      : `<a href="${escapeHtml(input.siteUrl)}" style="color:${COLORS.primary};font-weight:700;">На сайт</a>`;

  return `<!doctype html>
<html lang="uk">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(texts.title)}</title></head>
<body style="margin:0;background:${COLORS.page};font-family:${FONT};color:${COLORS.text};">
<main style="max-width:480px;margin:12vh auto;padding:0 16px;">
<div style="background:${COLORS.card};border-radius:24px;padding:32px;">
<h1 style="margin:0 0 12px;font-size:24px;">${escapeHtml(texts.title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(texts.body)}</p>
${action}
</div>
</main>
</body>
</html>`;
}
