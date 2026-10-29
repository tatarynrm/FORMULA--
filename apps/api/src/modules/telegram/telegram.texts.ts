/** What the bot says. Ukrainian, plain text (no markup: names and titles come from people). */

export const SHARE_PHONE_BUTTON = '📱 Поділитися номером телефону';

export const TELEGRAM_TEXTS = {
  /** After the person opened the bot with a connection link. */
  askPhone:
    'Вітаю! Це бот Formula 👋\n\n' +
    'Щоб завершити підключення, потрібно поділитися своїм номером телефону: це обов’язково. ' +
    'Натисніть кнопку «Поділитися номером телефону» внизу екрана.',
  /** The person writes something while the phone is still missing. */
  needPhone:
    'Для підключення потрібен ваш номер телефону. Натисніть кнопку «Поділитися номером телефону» внизу екрана.',
  notYourNumber:
    'Надішліть, будь ласка, власний номер: натисніть кнопку «Поділитися номером телефону». Чужий контакт не підходить.',
  done:
    '✅ Готово! Telegram підключено до вашого акаунту Formula.\n\n' +
    'Сюди приходитимуть сповіщення: результати перевірок, відкриті доступи, відповіді підтримки й новини. ' +
    'Вимкнути їх можна командою /stop або в профілі на сайті.',
  alreadyLinked:
    'Ви вже підключені ✅ Сповіщення Formula приходять сюди. Вимкнути їх можна командою /stop.',
  stopped: 'Сповіщення вимкнено. Щоб увімкнути їх знову, надішліть /start.',
  resumed: 'Сповіщення знову увімкнено ✅',
  tokenInvalid:
    'Це посилання застаріло або вже використане. Створіть нове: у профілі на сайті Formula натисніть «Підключити Telegram».',
  tokenTaken:
    'Цей Telegram уже підключено до іншого акаунту Formula. Відключіть його там, у профілі на сайті, і спробуйте ще раз.',
  notLinked: (profileUrl: string) =>
    `Щоб підключити бота, відкрийте свій профіль на сайті Formula й натисніть «Підключити Telegram»:\n${profileUrl}`,
  idle: 'Я надсилаю сповіщення Formula. Керувати ними можна командами /stop та /start або в профілі на сайті.',
  help: (profileUrl: string) =>
    'Я бот Formula й надсилаю сповіщення з платформи.\n\n' +
    '/start — підключити акаунт або знову увімкнути сповіщення\n' +
    '/stop — вимкнути сповіщення\n' +
    '/help — ця підказка\n\n' +
    `Профіль на сайті: ${profileUrl}`,
  /** Sent when the person disconnects Telegram on the site. */
  unlinked:
    'Telegram відключено від акаунту Formula. Щоб підключити знову, відкрийте профіль на сайті.',
} as const;

/** The commands of the menu next to the message box in Telegram. */
export const TELEGRAM_COMMANDS = [
  { command: 'start', description: 'Підключити акаунт Formula' },
  { command: 'stop', description: 'Вимкнути сповіщення' },
  { command: 'help', description: 'Допомога' },
];
