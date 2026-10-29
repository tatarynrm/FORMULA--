/**
 * Texts of the contacts in the profile (a phone, the messengers a person uses) and of the Telegram
 * bot connection. Registered as `t.contacts`.
 */
export const contacts = {
  title: 'Контакти',
  hint: 'Телефон і месенджери, у яких вам зручно спілкуватися. Їх бачить лише адміністрація.',

  phone: {
    label: 'Телефон',
    optional: 'необов’язково',
    hint: 'Формат: +380 98 938 55 85',
    invalid: 'Введіть номер у форматі +380 98 938 55 85',
  },

  messengers: {
    label: 'Месенджери, якими ви користуєтесь',
    options: { viber: 'Viber', whatsapp: 'WhatsApp', telegram: 'Telegram' },
  },

  telegramNick: {
    label: 'Нікнейм у Telegram',
    optional: 'необов’язково',
    placeholder: '@nickname',
    hint: 'Необов’язково: латиниця, цифри й «_», від 5 до 32 символів.',
    invalid: 'Нікнейм: від 5 до 32 символів, латиниця, цифри й «_», починається з літери',
    fromBot: 'З бота: @{name}',
  },

  save: 'Зберегти',
  saving: 'Зберігаємо...',
  saved: 'Збережено',
  saveError: 'Не вдалося зберегти контакти. Спробуйте ще раз.',

  /** The Telegram bot card in the profile. */
  bot: {
    title: 'Telegram-бот Formula',
    description:
      'Отримуйте сповіщення просто в Telegram: результати перевірок, відкриті доступи, відповіді підтримки й новини.',
    phoneRequired:
      'У боті потрібно поділитися номером телефону: без цього підключення не завершиться.',
    notConfigured: 'Бот поки що не налаштований. Підключення з’явиться, щойно його запустять.',
    loadError: 'Не вдалося дізнатися стан бота',
    retry: 'Спробувати ще раз',
    connect: 'Підключити Telegram',
    connecting: 'Створюємо посилання...',
    openBot: 'Відкрити бота',
    linkHint:
      'У Telegram натисніть «Start», а потім кнопку «Поділитися номером телефону». Посилання діє {minutes} хв.',
    waiting: 'Чекаємо підтвердження в Telegram...',
    newLink: 'Створити нове посилання',
    awaitingPhone:
      'Бота підключено, але ви ще не поділилися номером. Відкрийте бота й натисніть кнопку «Поділитися номером телефону»: без цього сповіщення не надсилаються.',
    connected: 'Telegram підключено',
    account: 'Акаунт: @{name}',
    phone: 'Номер у боті: {phone}',
    notifications: 'Надсилати сповіщення в Telegram',
    notificationsHint: 'Також їх можна вимкнути командою /stop у боті.',
    disconnect: 'Відключити',
    disconnectTitle: 'Відключити Telegram?',
    disconnectDescription:
      'Бот перестане надсилати вам сповіщення. Підключити його знову можна будь-коли.',
    cancel: 'Скасувати',
    actionError: 'Не вдалося виконати дію. Спробуйте ще раз.',
    unavailable: 'Бот тимчасово недоступний. Спробуйте пізніше.',
  },

  /** How the admin sees the contacts of a student. */
  admin: {
    title: 'Контакти',
    phone: 'Телефон',
    messengers: 'Месенджери',
    none: 'Не вказано',
    bot: 'Telegram-бот',
    botStates: {
      none: 'Не підключено',
      awaitingPhone: 'Підключено, чекає номер',
      active: 'Підключено',
      muted: 'Підключено, сповіщення вимкнено',
    },
  },
} as const;
