/**
 * Ukrainian UI texts. All user-facing strings live here (not inline in components),
 * so adding i18n later means adding sibling dictionaries with the same shape.
 */

import { adminContent } from './admin-content';
import { learning } from './learning';

// TODO: real copy. The Figma landing still uses lorem ipsum for body texts; replace these when ready.
const LOREM_TITLE = 'Lorem ipsum gravida leo placerat';
const LOREM_TEXT =
  'Lorem ipsum et risus condimentum tincidunt at ultrices ut cursus elit lacus porta parturient nunc enim mi enim sit sed.';
const LOREM_LABEL = 'Lorem ipsum et risus';
const LOREM_QUESTION = 'Lorem ipsum dolor sit amet consectetur?';

export const uk = {
  brand: {
    name: 'Formula',
    tagline: 'Підготовка до НМТ і поглиблене навчання',
  },

  common: {
    loading: 'Завантаження...',
    save: 'Зберегти',
    cancel: 'Скасувати',
    close: 'Закрити',
    back: 'Назад',
    logout: 'Вийти',
    logoutDialog: {
      title: 'Вийти з акаунта?',
      description: 'Щоб продовжити навчання, потрібно буде увійти знову.',
      cancel: 'Скасувати',
      confirm: 'Вийти',
    },
    toggleTheme: 'Змінити тему',
    themeLight: 'Світла',
    themeDark: 'Темна',
    themeSystem: 'Системна',
    openMenu: 'Відкрити меню',
    previous: 'Назад',
    next: 'Вперед',
    comingSoon: 'Цей розділ скоро з’явиться',
    contentPlaceholder: 'Контент буде додано пізніше',
  },

  site: {
    nav: {
      advantages: 'Переваги',
      about: 'Про мене',
      formats: 'Формати',
      reviews: 'Відгуки',
      contacts: 'Контакти',
      login: 'Увійти',
      register: 'Зареєструватись',
      cabinet: 'Увійти в кабінет',
      adminPanel: 'Адмін-панель',
      logout: 'Вийти',
    },
  },

  landing: {
    hero: {
      badges: ['Біоорганічна хімія', 'Біохімія', 'КРОК 1'],
      title: `${LOREM_TITLE} at elementum`,
      subtitle: LOREM_TEXT,
      primaryCta: 'Почати навчання',
      secondaryCta: 'Пройти тест на рівень',
      imageAlt: 'Formula',
    },
    keyNumbers: {
      items: [
        { value: '500+', label: LOREM_LABEL },
        { value: '100+', label: LOREM_LABEL },
        { value: '200+', label: LOREM_LABEL },
      ],
    },
    advantages: {
      title: `${LOREM_TITLE} at elementum`,
      cta: 'Почати навчання',
      previewAlt: 'Кабінет студента на телефоні',
      preview: {
        name: 'Анно',
        course: 'Біоорганічна хімія',
        toastTitle: 'Тест пройдено',
        toastBody: 'Результат 92%',
      },
      items: [
        { icon: 'file-text', title: LOREM_TITLE, description: LOREM_TEXT },
        { icon: 'search', title: LOREM_TITLE, description: LOREM_TEXT },
        { icon: 'check-square', title: LOREM_TITLE, description: LOREM_TEXT },
        { icon: 'chart-line', title: LOREM_TITLE, description: LOREM_TEXT },
        { icon: 'grid', title: LOREM_TITLE, description: LOREM_TEXT },
      ],
    },
    learningFormats: {
      title: 'Формати навчання',
      detailsCta: 'Дізнатися деталі',
      items: [
        {
          name: 'Індивідуальні',
          badge: '1 на 1',
          description: LOREM_TEXT,
          features: ['60 хвилин, 1 на 1', 'Розклад за домовленістю'],
        },
        {
          name: 'Парні',
          badge: '2 учнів',
          description: LOREM_TEXT,
          features: ['75 хвилин, двоє учнів', 'Однаковий рівень підготовки'],
        },
        {
          name: 'Групові',
          badge: 'до 6 учнів',
          description: LOREM_TEXT,
          features: ['90 хвилин, до 6 учнів', 'Однаковий рівень підготовки'],
        },
        {
          name: 'Міні-групи',
          badge: 'до 4 учнів',
          description: LOREM_TEXT,
          features: ['80 хвилин, до 4 учнів', 'Більше уваги кожному'],
        },
        {
          name: 'Інтенсив',
          badge: '4 тижні',
          description: LOREM_TEXT,
          features: ['Заняття щодня', 'Швидка підготовка до тесту'],
        },
        {
          name: 'Консультації',
          badge: 'Разово',
          description: LOREM_TEXT,
          features: ['45 хвилин', 'Розбір складних тем'],
        },
      ],
    },
    aboutAuthor: {
      title: LOREM_TITLE,
      paragraphs: [LOREM_TEXT, LOREM_TEXT],
      imageAlt: 'Автор курсу',
    },
    trialLessons: {
      title: 'Пробні уроки',
      cta: 'Записатись на урок',
      play: 'Дивитися урок',
      items: [
        { duration: '33 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '28 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '41 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '25 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '37 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '30 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
        { duration: '45 хв.', title: LOREM_TITLE, description: LOREM_TEXT },
      ],
    },
    resultsReviews: {
      title: 'Відгуки',
      leaveReviewTitle: 'Вже навчаєшся разом із Formula? Поділися враженням',
      leaveReviewHint: 'Відгук з’явиться на сайті після перевірки.',
      leaveReviewCta: 'Залишити відгук',
    },
    faq: {
      title: 'FAQ',
      items: [
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
        { question: LOREM_QUESTION, answer: LOREM_TEXT },
      ],
    },
    social: {
      title: 'Ми в соцмережах',
      subtitle: 'Lorem ipsum dolor sit amet consectetur.',
      open: 'Перейти',
      // TODO: real profile URLs
      channels: [
        { id: 'instagram', name: 'Instagram', handle: '@formula.bio', href: '#' },
        { id: 'telegram', name: 'Telegram', handle: '@formula_bio', href: '#' },
      ],
    },
    footer: {
      description:
        'Lorem ipsum dolor sit amet consectetur. Lorem ipsum dolor sit amet consectetur.',
      navigation: 'Навігація',
      contacts: 'Контакти',
      links: [
        { label: 'Формати навчання', href: '/#formats' },
        { label: 'Про мене', href: '/#about' },
        { label: 'Відгуки', href: '/#reviews' },
        { label: 'FAQ', href: '/#faq' },
      ],
      socials: [
        { label: 'Instagram', href: '#' },
        { label: 'Telegram', href: '#' },
        { label: 'YouTube', href: '#' },
      ],
      rights: 'Всі права захищені.',
      privacy: 'Політика конфіденційності',
    },
  },

  auth: {
    tabs: { login: 'Вхід', register: 'Реєстрація' },
    loginTitle: 'Вітаємо!',
    loginSubtitle: 'Увійди, щоб продовжити навчання',
    registerTitle: 'Створити акаунт',
    registerSubtitle: 'Створи акаунт, щоб розпочати підготовку',
    nameLabel: 'Ім’я',
    namePlaceholder: 'Анна',
    surnameLabel: 'Прізвище',
    surnamePlaceholder: 'Коваль',
    emailLabel: 'Електронна пошта',
    emailPlaceholder: 'example@gmail.com',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Мінімум 8 символів',
    showPassword: 'Показати пароль',
    hidePassword: 'Сховати пароль',
    rememberMe: 'Запам’ятати мене',
    forgotPassword: 'Забули пароль?',
    acceptTerms: 'Погоджуюсь з умовами використання та політикою конфіденційності',
    acceptTermsRequired: 'Потрібно погодитися з умовами',
    loginSubmit: 'Увійти',
    registerSubmit: 'Зареєструватись',
    or: 'або',
    continueWithGoogle: 'Продовжити з Google',
    noAccount: 'Ще не має акаунта?',
    hasAccount: 'Вже є акаунт?',
    errors: {
      invalidCredentials: 'Невірна електронна пошта або пароль',
      emailTaken: 'Користувач із такою поштою вже зареєстрований',
      tooManyRequests: 'Забагато спроб. Спробуйте за хвилину',
      google: 'Не вдалося увійти через Google. Спробуйте ще раз або увійдіть з паролем',
      generic: 'Не вдалося виконати запит. Спробуйте ще раз',
    },
    validation: {
      emailInvalid: 'Введіть коректну електронну пошту',
      passwordMin: 'Пароль має містити щонайменше 8 символів',
      passwordMax: 'Пароль має містити не більше 72 символів',
      nameMin: 'Ім’я має містити щонайменше 2 символи',
      nameMax: 'Ім’я має містити не більше 100 символів',
      surnameMin: 'Прізвище має містити щонайменше 2 символи',
      surnameMax: 'Прізвище має містити не більше 100 символів',
    },
  },

  cabinet: {
    nav: {
      home: 'Головна',
      bases: 'Бази',
      booklets: 'Буклети',
      amps: 'АМПС',
      saved: 'Збережені',
    },
    userCard: {
      roles: { student: 'Студент', admin: 'Адміністратор' },
      adminLevels: { superadmin: 'Суперадмін', subadmin: 'Субадмін' },
    },
    home: {
      greeting: 'Привіт, {name}!',
      greetingAnonymous: 'Привіт!',
      stats: {
        testsPassed: 'тестів пройдено',
        topicsLearned: 'тем вивчено',
        averageScore: 'середній результат',
        mistakes: 'помилок до опрацювання',
      },
      course: {
        topicsBadge: '{done}/{total} тем',
        progressLabel: 'Прогрес вивчення',
        goToStudy: 'Перейти до вивчення',
      },
    },
    // The texts of tests, lists, results and saved items live in `learning.ts`.
    tests: {
      progress: 'Прогрес',
    },
  },

  admin: {
    title: 'Адмін-панель',
    description: 'Заглушка. Тут з’являться інструменти керування контентом.',
    forbidden: 'Недостатньо прав для перегляду цієї сторінки',
    staff: {
      title: 'Команда',
      add: 'Додати субадміна',
      intro: 'Суперадмін має всі права. Субадмін бачить лише ті розділи, які ви йому відкрили.',
      empty: 'Поки немає жодного адміна',
      loadError: 'Не вдалося завантажити команду',
      levels: { superadmin: 'Суперадмін', subadmin: 'Субадмін' },
      allSections: 'Усі розділи',
      noSections: 'Розділи не вибрано',
      editPermissions: 'Змінити доступ',
      remove: 'Забрати права',
      removeTitle: 'Забрати права адміна?',
      removeDescription: 'Акаунт стане звичайним студентом і втратить доступ до адмінки.',
      removeConfirm: 'Забрати',
      dialog: {
        addTitle: 'Новий субадмін',
        editTitle: 'Доступ до розділів',
        addHint:
          'Якщо акаунт із такою поштою вже є, він отримає права. Якщо ні, вкажіть ім’я, прізвище й пароль, і акаунт буде створено.',
        email: 'Електронна пошта',
        name: 'Ім’я',
        surname: 'Прізвище',
        password: 'Пароль',
        sections: 'Доступні розділи',
        submit: 'Зберегти',
        cancel: 'Скасувати',
        error: 'Не вдалося зберегти. Перевірте дані й спробуйте ще раз',
        needDetails: 'Для нового акаунта потрібні ім’я, прізвище й пароль',
      },
    },
    menu: {
      title: 'Меню',
      intro: 'Тут ви керуєте розділами меню для студентів і для адмінів. Зміни одразу видно всім.',
      audiences: { student: 'Студенти', admin: 'Адміни' },
      add: 'Додати розділ',
      loadError: 'Не вдалося завантажити меню',
      hidden: 'Прихований',
      builtIn: 'Вбудований',
      superadminOnly: 'Лише суперадмін',
      moveUp: 'Вище',
      moveDown: 'Нижче',
      show: 'Показати',
      hide: 'Сховати',
      edit: 'Змінити',
      delete: 'Видалити',
      deleteTitle: 'Видалити розділ?',
      deleteDescription:
        'Розділ зникне з меню. Вбудовані розділи видалити не можна, їх можна лише сховати.',
      deleteConfirm: 'Видалити',
      pageBadge: 'Сторінка',
      editPage: 'Змінити вміст сторінки',
      pageDialog: {
        title: 'Вміст сторінки',
        save: 'Зберегти',
        close: 'Закрити',
        saved: 'Збережено',
        loadError: 'Не вдалося завантажити вміст',
        saveError: 'Не вдалося зберегти. Спробуйте ще раз',
        label: 'Текст сторінки',
      },
      dialog: {
        addTitle: 'Новий розділ меню',
        editTitle: 'Змінити розділ',
        kind: 'Що відкриває розділ',
        kinds: { link: 'Посилання', page: 'Сторінка з текстом' },
        pageHint:
          'Адресу сторінки створимо автоматично, а текст ви напишете одразу після збереження.',
        label: 'Назва',
        href: 'Посилання (шлях на сайті)',
        hrefHint: 'Наприклад /cabinet/news. Лише адреси всередині сайту.',
        icon: 'Іконка',
        submit: 'Зберегти',
        cancel: 'Скасувати',
        error: 'Не вдалося зберегти. Перевірте назву й посилання',
      },
      icons: {
        home: 'Дім',
        'book-open': 'Відкрита книга',
        book: 'Книга',
        amps: 'АМПС',
        saved: 'Закладка',
        students: 'Люди',
        team: 'Щит',
        menu: 'Список',
        file: 'Файл',
        test: 'Тест',
        bell: 'Дзвіночок',
        chat: 'Чат',
        star: 'Зірка',
      },
    },
    nav: {
      subjects: 'Предмети і теми',
      bases: 'Бази',
      booklets: 'Буклети',
      amps: 'АМПС',
      students: 'Студенти',
    },
    subjects: {
      title: 'Предмети і теми',
      add: 'Додати предмет',
      manageTopics: 'Керувати темами',
      newTitle: 'Новий предмет',
    },
    // Texts of topics, subtopics, tests, reviews and access grants: see `adminContent`.
    tests: {
      add: 'Додати тест',
      bases: 'Бази запитань',
      booklets: 'Буклети',
      amps: 'АМПС',
    },
    status: { published: 'Опубліковано', draft: 'Чернетка' },
    row: {
      edit: 'Редагувати',
      delete: 'Видалити',
      add: 'Додати',
      expand: 'Розгорнути',
      collapse: 'Згорнути',
      actions: 'Дії',
      back: 'Назад',
    },
    students: {
      title: 'Студенти',
      total: 'Усього: {count}',
      empty: 'Користувачів ще немає',
      page: 'Сторінка {page} з {pages}',
      loadError: 'Не вдалося завантажити список',
    },
  },

  profile: {
    onboarding: {
      title: 'Розкажи про себе',
      subtitle: 'Це допоможе підібрати матеріали. Можна пропустити й заповнити пізніше.',
      submit: 'Продовжити',
      skip: 'Пропустити',
    },
    page: {
      title: 'Мій профіль',
      subtitle: 'Ці дані бачиш лише ти та команда Formula.',
    },
    status: 'Хто ти?',
    goal: 'Яка твоя мета?',
    institution: 'Навчальний заклад',
    institutionKinds: { university: 'Університет', other: 'Інше' },
    institutionPlaceholders: {
      university: 'Назва університету',
      other: 'Школа, коледж, курси...',
    },
    save: 'Зберегти',
    saved: 'Збережено',
    loadError: 'Не вдалося завантажити профіль',
    saveError: 'Не вдалося зберегти. Спробуйте ще раз',
    roles: { student: 'Студент', superadmin: 'Суперадмін', subadmin: 'Субадмін' },
    avatar: {
      title: 'Фото профілю',
      alt: 'Фото профілю',
      upload: 'Завантажити фото',
      replace: 'Замінити фото',
      remove: 'Видалити фото',
      hint: 'PNG, JPG, WebP або GIF, до 5 МБ',
    },
    account: {
      title: 'Особисті дані',
      name: 'Ім’я',
      surname: 'Прізвище',
      email: 'Електронна пошта',
      emailHint: 'Пошту поки не можна змінити.',
    },
    study: {
      title: 'Навчання',
      hint: 'Допомагає підбирати матеріали. Усе необов’язкове.',
    },
    adminSections: {
      title: 'Доступні розділи',
      all: 'Усі розділи: у вас повний доступ',
      none: 'Розділи ще не відкрито. Зверніться до суперадміна.',
    },
    security: {
      title: 'Безпека',
      currentPassword: 'Поточний пароль',
      newPassword: 'Новий пароль',
      confirmPassword: 'Повторіть новий пароль',
      submit: 'Змінити пароль',
      setFirst: 'Встановити пароль',
      noPasswordYet:
        'Ви увійшли через Google, пароля ще немає. Задайте його, щоб входити і з паролем.',
      success: 'Пароль змінено. На інших пристроях потрібно буде увійти знову.',
      wrongCurrent: 'Поточний пароль введено невірно',
      mismatch: 'Паролі не збігаються',
      sameAsCurrent: 'Новий пароль має відрізнятися від поточного',
      currentRequired: 'Введіть поточний пароль',
    },
  },

  menuPage: {
    documentTitle: 'Сторінка',
    loadError: 'Не вдалося відкрити сторінку',
    empty: 'Тут поки немає тексту',
  },

  files: {
    choose: 'Вибрати файл',
    replace: 'Замінити',
    remove: 'Видалити',
    uploading: 'Завантаження... {percent}%',
    tooLarge: 'Файл завеликий. Максимум {max}',
    wrongType: 'Цей тип файлу не підтримується',
    failed: 'Не вдалося завантажити файл. Спробуйте ще раз',
    download: 'Завантажити',
    cancel: 'Скасувати завантаження',
  },

  richText: {
    bold: 'Жирний',
    italic: 'Курсив',
    underline: 'Підкреслений',
    strike: 'Закреслений',
    subscript: 'Нижній індекс (H₂O)',
    superscript: 'Верхній індекс (x²)',
    heading2: 'Заголовок',
    heading3: 'Підзаголовок',
    bulletList: 'Маркований список',
    orderedList: 'Нумерований список',
    quote: 'Цитата',
    link: 'Посилання',
    linkPrompt: 'Адреса посилання',
    image: 'Зображення',
    undo: 'Скасувати',
    redo: 'Повторити',
    placeholder: 'Почніть писати...',
  },

  errors: {
    notFoundTitle: 'Сторінку не знайдено',
    notFoundDescription: 'Схоже, такої сторінки не існує або її було переміщено.',
    notFoundCta: 'На головну',
    genericTitle: 'Щось пішло не так',
    genericDescription: 'Сталася неочікувана помилка. Спробуйте ще раз.',
    retry: 'Спробувати ще раз',
    network: 'Не вдалося з’єднатися із сервером',
  },

  meta: {
    title: 'Formula: підготовка до НМТ з біології та хімії',
    description:
      'Formula: онлайн-підготовка до НМТ і поглиблене навчання біології та хімії. Індивідуальні, парні й групові заняття, бази тестів, буклети та кабінет студента.',
    keywords: [
      'підготовка до НМТ',
      'НМТ біологія',
      'НМТ хімія',
      'репетитор з біології',
      'репетитор з хімії',
      'курси НМТ онлайн',
      'тести НМТ',
      'Formula',
    ],
    ogAlt: 'Formula: підготовка до НМТ і поглиблене навчання біології та хімії',
    organization: 'Formula: онлайн-школа підготовки до НМТ з біології та хімії',
  },

  // Privacy policy. Structured data: the page in app/(public)/privacy renders it as-is.
  //
  // IMPORTANT: this text is a well-researched DRAFT, not legal advice, and it does not guarantee
  // compliance with any law. It MUST be reviewed by a qualified lawyer before launch.
  // Facts below reflect what the product does today (scrypt password hashes, two httpOnly session
  // cookies, no analytics/ads, own VPS). Update this block whenever the behaviour changes.
  //
  // TODO(owner/lawyer) before launch:
  //  - Fill in `contacts` (operator legal name, email, address, server country). Never invent them.
  //  - Set the exact retention period for IP addresses and request logs (section "retention").
  //  - Confirm the children's age thresholds (under 14 / 14-18, based on the Civil Code split) and
  //    implement a matching parental-consent step in the registration flow.
  //  - Confirm the "we do not sell personal data" commitment and the stated legal grounds.
  //  - Bump `lastUpdated` whenever the text changes.
  privacy: {
    title: 'Політика конфіденційності',
    description:
      'Які персональні дані збирає онлайн-школа Formula, навіщо, як ми їх захищаємо, скільки зберігаємо і які права мають користувачі та батьки школярів.',
    eyebrow: 'Юридична інформація',
    breadcrumbLabel: 'Навігаційний ланцюжок',
    breadcrumbHome: 'Головна',
    lastUpdated: {
      label: 'Остання редакція',
      // ISO date for <time> and structured data; keep in sync with `display`.
      iso: '2026-10-14',
      display: '14 жовтня 2026 року',
    },
    intro: [
      'Ця політика пояснює, які персональні дані збирає онлайн-школа Formula (далі «Formula» або «ми»), навіщо ми їх обробляємо, як захищаємо і які права ви маєте. Вона стосується цього сайту та особистого кабінету.',
      'Ми писали її простою мовою, бо більшість наших користувачів школярі. Якщо щось незрозуміло, напишіть нам: контакти наведено наприкінці сторінки.',
    ],
    summary: {
      title: 'Коротко',
      items: [
        'Ми збираємо лише те, що потрібно для входу й навчання: імʼя, email, пароль і результати навчання.',
        'Пароль зберігається тільки у вигляді незворотного хеша. Ми його не бачимо.',
        'Є лише службові cookie для входу. Рекламних і аналітичних cookie та трекерів немає.',
        'Ми не продаємо персональні дані й не використовуємо їх для реклами.',
        'Ви можете попросити доступ до даних, виправлення, видалення або відкликати згоду.',
        'Якщо вам менше 14 років, до реєстрації мають долучитися батьки або законні представники.',
      ],
    },
    toc: {
      title: 'Зміст',
      navLabel: 'Зміст політики конфіденційності',
    },
    sections: [
      {
        id: 'general',
        title: 'Загальні положення',
        paragraphs: [
          'Formula це онлайн-школа підготовки до НМТ з біології та хімії. Ця політика описує, як ми обробляємо персональні дані відвідувачів сайту та зареєстрованих користувачів.',
          'Персональні дані це будь-які відомості, за якими можна прямо чи опосередковано визначити конкретну людину, наприклад імʼя або адреса електронної пошти.',
          'Ми обробляємо дані відповідно до Закону України «Про захист персональних даних» та іншого чинного законодавства України. Крім того, ми орієнтуємося на принципи європейського регулювання GDPR: законність і прозорість, обмеження мети, мінімізація даних, обмеження строку зберігання, цілісність і конфіденційність.',
          'Створюючи обліковий запис і користуючись сайтом, ви підтверджуєте, що ознайомилися з цією політикою. Якщо ви з нею не згодні, будь ласка, не реєструйтеся й не користуйтеся сервісом.',
        ],
      },
      {
        id: 'controller',
        title: 'Хто обробляє ваші дані',
        paragraphs: [
          'Володільцем персональних даних, тобто особою, яка визначає мету та способи їх обробки, є власник сайту Formula. Його повне найменування й контакти наведено в розділі «Контакти» внизу сторінки.',
          'Дані зберігаються в базі даних PostgreSQL на нашому власному віртуальному сервері (VPS). Сайт працює через захищене зʼєднання HTTPS.',
        ],
      },
      {
        id: 'data-we-collect',
        title: 'Які дані ми збираємо',
        paragraphs: ['Ми збираємо лише ті дані, які потрібні для роботи сервісу.'],
        items: [
          {
            term: 'Дані облікового запису',
            text: 'імʼя, адреса електронної пошти та пароль. Пароль ми зберігаємо лише як солоний хеш (алгоритм scrypt): ми не бачимо оригінальний пароль і не можемо його відновити.',
          },
          {
            term: 'Службові дані акаунта',
            text: 'роль (учень або адміністратор), дата реєстрації та час останнього входу.',
          },
          {
            term: 'Дані про навчання',
            text: 'у міру запуску відповідних функцій: спроби проходження тестів, результати, допущені помилки, прогрес і збережені матеріали.',
          },
          {
            term: 'Технічні дані',
            text: 'IP-адреса та журнали запитів до сервера. Ми використовуємо їх для безпеки: обмеження частоти запитів і захист від зловживань.',
          },
          {
            term: 'Листування',
            text: 'якщо ви напишете нам, ми збережемо ваше повідомлення та адресу відправника, щоб відповісти.',
          },
        ],
        closing: [
          'Ми не просимо вас повідомляти особливі категорії даних (стан здоровʼя, релігійні чи політичні погляди тощо). Будь ласка, не надсилайте їх нам.',
        ],
      },
      {
        id: 'purposes',
        title: 'Навіщо ми обробляємо дані і на якій підставі',
        items: [
          {
            term: 'Реєстрація, вхід і підтримання сесії',
            text: 'щоб ви могли користуватися особистим кабінетом. Підстава: ваша згода та виконання домовленості про користування сервісом.',
          },
          {
            term: 'Навчання',
            text: 'збереження результатів і прогресу, показ вашої статистики. Підстава: виконання домовленості про користування сервісом і ваша згода.',
          },
          {
            term: 'Безпека та захист від зловживань',
            text: 'обмеження частоти запитів, виявлення підозрілої активності, діагностика збоїв. Підстава: наш законний інтерес у захисті сервісу та користувачів.',
          },
          {
            term: 'Звʼязок з вами',
            text: 'відповіді на звернення, а в майбутньому службові листи, наприклад відновлення пароля. Підстава: ваша згода або виконання домовленості про користування сервісом.',
          },
          {
            term: 'Виконання вимог закону',
            text: 'коли обовʼязок обробити або надати дані випливає із законодавства.',
          },
        ],
        closing: [
          'Ми не використовуємо ваші дані для рекламного профілювання й не обробляємо їх для цілей, несумісних із зазначеними вище. Якщо мета зміниться, ми повідомимо вас і, за потреби, попросимо нову згоду.',
        ],
      },
      {
        id: 'principles',
        title: 'Принципи обробки',
        items: [
          {
            term: 'Законність і прозорість',
            text: 'ми обробляємо дані лише за наявності підстави та відкрито розповідаємо про це.',
          },
          {
            term: 'Обмеження мети',
            text: 'дані збираються для чітких цілей і не використовуються для несумісних.',
          },
          {
            term: 'Мінімізація',
            text: 'ми збираємо лише те, без чого сервіс не працюватиме.',
          },
          {
            term: 'Точність',
            text: 'ви можете виправити неточні дані, а ми підтримуємо їх актуальність.',
          },
          {
            term: 'Обмеження зберігання',
            text: 'дані зберігаються не довше, ніж потрібно для мети обробки.',
          },
          {
            term: 'Цілісність і конфіденційність',
            text: 'ми вживаємо технічних та організаційних заходів для захисту даних.',
          },
        ],
      },
      {
        id: 'cookies',
        title: 'Cookie та сесія',
        paragraphs: [
          'Cookie це невеликі текстові файли, які сайт зберігає у вашому браузері. Ми використовуємо лише два службові cookie для входу в обліковий запис:',
        ],
        items: [
          {
            term: 'Access-токен',
            text: 'короткочасний (близько 15 хвилин), підтверджує, що запити надсилаєте саме ви.',
          },
          {
            term: 'Refresh-токен',
            text: 'діє близько 7 днів і дозволяє тихо оновлювати сесію, щоб вас не просили входити кожні кілька хвилин.',
          },
        ],
        closing: [
          'Обидва cookie мають прапорці httpOnly (скрипти на сторінці не можуть їх прочитати) і SameSite=Lax, а в робочому середовищі ще й Secure (передаються лише через HTTPS). Вони строго необхідні для входу, тому окрема згода на них не потрібна, і банер cookie ми не показуємо.',
          'Рекламних і аналітичних cookie та трекерів зараз немає. Якщо ми їх додамо, спершу оновимо цю політику та запитаємо вашу згоду.',
          'Для зручності сайт може запамʼятовувати обрану тему оформлення (світлу чи темну) в локальному сховищі браузера. Ці дані не залишають ваш пристрій.',
          'Ви можете видалити cookie в налаштуваннях браузера або вийти з акаунта. Після цього вам доведеться увійти знову.',
        ],
      },
      {
        id: 'third-parties',
        title: 'Треті сторони',
        paragraphs: [
          'Ми не продаємо персональні дані й не передаємо їх рекламним мережам. Ми можемо розкривати дані лише:',
        ],
        items: [
          'постачальникам інфраструктури, без яких сервіс не працює (наприклад, хостинг-провайдеру, який надає сервер), і лише в обсязі, потрібному для надання послуги;',
          'державним органам, якщо цього вимагає закон і є належна підстава;',
          'іншим особам лише з вашої згоди.',
        ],
        closing: [
          'На сайті є посилання на соціальні мережі (Instagram, Telegram, YouTube). Коли ви переходите за ними, діють правила й політики цих сервісів, на які ми не впливаємо.',
        ],
      },
      {
        id: 'international-transfers',
        title: 'Передача даних за кордон',
        paragraphs: [
          'Дані користувачів зберігаються на нашому сервері. Країну, де він розташований, вказано в розділі «Контакти».',
          'Якщо ми підключимо сервіси, які обробляють дані за межами України (наприклад, вхід через Google чи поштову розсилку), ми передаватимемо їм лише необхідний мінімум, обиратимемо постачальників із належним рівнем захисту даних і оновимо цю політику.',
        ],
      },
      {
        id: 'retention',
        title: 'Строки зберігання',
        items: [
          {
            term: 'Дані облікового запису та навчання',
            text: 'поки діє ваш акаунт. Після його видалення ми видаляємо або знеособлюємо ці дані, окрім тих, які закон зобовʼязує зберігати довше.',
          },
          {
            term: 'Cookie сесії',
            text: 'близько 15 хвилин (access) і близько 7 днів (refresh) або до виходу з акаунта.',
          },
          {
            term: 'IP-адреси та журнали запитів',
            text: 'обмежений час, потрібний для безпеки та діагностики, після чого їх видаляють або перезаписують.',
          },
          {
            term: 'Листування',
            text: 'поки це потрібно, щоб відповісти на звернення та розвʼязати питання.',
          },
        ],
        closing: ['Коли дані більше не потрібні для мети, з якою їх збирали, ми їх видаляємо.'],
      },
      {
        id: 'security',
        title: 'Безпека даних',
        items: [
          'Паролі зберігаються лише як солоні хеші scrypt.',
          'Зʼєднання із сайтом захищене шифруванням TLS (HTTPS, сертифікати Let’s Encrypt).',
          'Сесійні cookie мають прапорці httpOnly, SameSite=Lax і Secure у робочому середовищі.',
          'Доступ розмежовано за ролями: адміністративні функції доступні лише адміністраторам, перевірка виконується на сервері.',
          'Обмеження частоти запитів захищає від підбору паролів і зловживань.',
          'Дані зберігаються на сервері, яким керуємо ми, а не розсилаються між сторонніми сервісами.',
        ],
        closing: [
          'Жодна система не може бути захищена абсолютно. Якщо станеться інцидент, що загрожує вашим правам, ми повідомимо вас і відповідні органи у випадках і строки, передбачені законом.',
        ],
      },
      {
        id: 'your-rights',
        title: 'Ваші права',
        paragraphs: [
          'Відповідно до статті 8 Закону України «Про захист персональних даних» та за принципами GDPR ви маєте право:',
        ],
        items: [
          'знати, які ваші дані ми обробляємо, з якою метою, звідки вони отримані та кому передаються, і отримати їх копію (доступ);',
          'вимагати виправлення неточних або неповних даних;',
          'вимагати видалення даних, якщо їх обробляють незаконно або вони більше не потрібні;',
          'просити обмежити обробку, наприклад на час перевірки точності даних;',
          'заперечувати проти обробки ваших даних;',
          'відкликати згоду на обробку в будь-який момент (це не впливає на законність обробки до відкликання);',
          'звернутися зі скаргою до Уповноваженого Верховної Ради України з прав людини або до суду.',
        ],
        closing: [
          'Щоб скористатися правами або видалити акаунт, напишіть нам на адресу з розділу «Контакти». Ми можемо попросити підтвердити вашу особу, щоб дані не потрапили до сторонніх. Ми відповімо без невиправданої затримки та в строки, встановлені законом.',
        ],
      },
      {
        id: 'children',
        title: 'Діти та неповнолітні',
        paragraphs: [
          'Багато наших користувачів школярі, тому ми особливо дбайливо ставимося до даних дітей.',
        ],
        items: [
          'Якщо вам менше 14 років, реєстрацію та згоду на обробку даних має надати один із батьків або законний представник (або зробити це разом із вами).',
          'Якщо вам від 14 до 18 років, радимо повідомити про реєстрацію батьків або законних представників.',
          'Ми збираємо мінімум даних про дітей і не використовуємо їх для реклами чи профілювання.',
          'Батьки або законні представники можуть будь-коли попросити показати, виправити чи видалити дані дитини та відкликати згоду.',
          'Якщо ми дізнаємося, що дані дитини зібрано без потрібної згоди, ми видалимо їх або попросимо підтвердження від батьків.',
        ],
      },
      {
        id: 'planned-features',
        title: 'Майбутні функції',
        paragraphs: [
          'Formula розвивається, тому згодом можуть зʼявитися нові можливості, які вплинуть на обробку даних:',
        ],
        items: [
          'вхід через Google;',
          'email-сповіщення та відновлення пароля;',
          'розширена статистика навчання.',
        ],
        closing: [
          'Про це ми оновимо політику до того, як почнемо обробляти нові дані, а там, де потрібна згода, попросимо її окремо.',
        ],
      },
      {
        id: 'changes',
        title: 'Зміни до політики',
        paragraphs: [
          'Ми можемо оновлювати цю політику, наприклад коли зʼявляються нові функції або змінюється законодавство. Актуальна редакція завжди доступна на цій сторінці, а дата останнього оновлення вказана на початку.',
          'Про суттєві зміни ми повідомимо на сайті або електронною поштою. Якщо для нової обробки потрібна ваша згода, ми запитаємо її окремо.',
        ],
      },
    ],
    contacts: {
      id: 'contact',
      title: 'Контакти',
      description:
        'З питань персональних даних, а також щоб скористатися своїми правами, напишіть нам. Ми відповімо без невиправданої затримки.',
      // TODO: fill in the real values before launch. NEVER invent a company name, address or email.
      // An email is rendered as a mailto link automatically once it looks like a valid address.
      operatorLabel: 'Володілець даних',
      operator: '[Повне найменування власника сайту буде вказано]',
      emailLabel: 'Електронна пошта',
      email: '[Адресу електронної пошти буде вказано]',
      addressLabel: 'Адреса',
      address: '[Адресу буде вказано]',
      hostingLabel: 'Розташування сервера',
      hosting: '[Країну розташування сервера буде вказано]',
      authorityTitle: 'Скарги та нагляд',
      authorityText:
        'Якщо ви вважаєте, що ми порушуємо ваші права, ви можете звернутися до Уповноваженого Верховної Ради України з прав людини або до суду.',
      authorityLinkLabel: 'ombudsman.gov.ua',
      authorityUrl: 'https://ombudsman.gov.ua',
    },
  },
  // Separate files, so the content builder and the learning flow can grow without editing this one.
  adminContent,
  learning,
} as const;

export type Dictionary = typeof uk;
