/**
 * Texts of the cookie notice and the cookie settings (`features/consent`). Registered as
 * `t.consent`. The cookie texts below must match `COOKIE_CATALOG` and the privacy policy.
 */
export const consent = {
  banner: {
    region: 'Повідомлення про cookie',
    title: 'Ми використовуємо cookie',
    noticeText:
      'Сайт використовує лише необхідні cookie: вони потрібні для входу в кабінет і безпеки. Рекламних та аналітичних cookie й трекерів немає.',
    choiceText:
      'Необхідні cookie потрібні для роботи сайту. Інші ми вмикаємо лише за вашою згодою, і ви можете змінити її будь-коли.',
    privacy: 'Політика конфіденційності',
    understood: 'Зрозуміло',
    details: 'Докладніше',
    acceptAll: 'Прийняти всі',
    necessaryOnly: 'Лише необхідні',
    customize: 'Налаштувати',
  },

  settings: {
    link: 'Налаштування cookie',
    title: 'Налаштування cookie',
    noticeIntro:
      'Cookie це невеликі файли, які сайт зберігає у вашому браузері. Ось усе, що зберігає Formula. Це лише необхідне, тому вимкнути його не можна, а згода не потрібна.',
    choiceIntro:
      'Cookie це невеликі файли, які сайт зберігає у вашому браузері. Оберіть, які категорії дозволяєте. Необхідні вимкнути не можна: без них сайт не працює.',
    save: 'Зберегти вибір',
    close: 'Закрити',
    alwaysOn: 'Завжди активні',
    showList: 'Які саме cookie ({count})',
    storage: { cookie: 'cookie', localStorage: 'локальне сховище' },
    purpose: 'Призначення',
    duration: 'Термін',
    type: 'Тип',
    privacy: 'Докладніше в політиці конфіденційності',
  },

  categories: {
    necessary: {
      title: 'Необхідні',
      description:
        'Потрібні для входу в кабінет, безпеки сесії та щоб памʼятати ваш вибір щодо cookie. Згода на них не потрібна.',
    },
    analytics: {
      title: 'Аналітичні',
      description:
        'Допомагають зрозуміти, як користуються сайтом, щоб його покращувати. Вмикаються лише за вашою згодою.',
    },
    marketing: {
      title: 'Маркетингові',
      description:
        'Потрібні для реклами та вимірювання її ефективності. Вмикаються лише за вашою згодою.',
    },
  },

  /** What each cookie is for and how long it lives, by cookie name (see `COOKIE_CATALOG`). */
  cookies: {
    access_token: {
      purpose: 'Підтверджує, що запити надсилаєте саме ви (короткочасна перепустка).',
      duration: 'до 15 хвилин',
    },
    refresh_token: {
      purpose: 'Дозволяє тихо оновлювати сесію, щоб вас не просили входити кожні кілька хвилин.',
      duration: 'до 7 днів або до виходу з акаунта',
    },
    oauth_state: {
      purpose:
        'Захищає вхід через Google від підміни запиту. З’являється лише під час такого входу.',
      duration: 'до 10 хвилин',
    },
    formula_consent: {
      purpose: 'Памʼятає ваш вибір щодо cookie, щоб не питати щоразу.',
      duration: '6 місяців',
    },
  } as Record<string, { purpose: string; duration: string }>,
} as const;
