/**
 * Texts of the testimonials («Відгуки»): the block on the landing page, the form (dialog and the
 * cabinet page «Мій відгук») and the moderation page of the admin. Registered as `t.testimonials`.
 */
export const testimonials = {
  /** The block on the landing page. */
  section: {
    empty: 'Відгуків поки немає',
    emptyHint: 'Станьте першим, хто поділиться враженням про Formula.',
    loadError: 'Не вдалося завантажити відгуки',
    retry: 'Спробувати ще раз',
  },

  /** Stars: "4 з 5". */
  rating: {
    label: 'Оцінка: {count} з 5',
    choose: 'Оберіть оцінку',
    option: '{count} з 5',
  },

  form: {
    dialogTitle: 'Залишити відгук',
    dialogDescription: 'Розкажіть, як вам навчається з Formula. Це допоможе іншим студентам.',
    signedInAs: 'Ви залишаєте відгук як',
    signedInHint: 'Ім’я й прізвище беремо з вашого акаунту.',
    avatarHint: 'Фото вашого профілю теж буде у відгуку.',
    guestHint: 'Вкажіть, як вас підписати. Якщо ви маєте акаунт, увійдіть: імʼя підставиться саме.',
    login: 'Увійти',
    name: 'Ім’я',
    surname: 'Прізвище',
    email: 'Електронна пошта',
    emailFromAccount: 'Пошта з вашого акаунту',
    phone: 'Телефон',
    phoneOptional: 'необов’язково',
    phoneHint: 'Формат: +380 98 938 55 85',
    contactsNote: 'Пошту й телефон бачить лише адміністратор, на сайті їх немає.',
    rating: 'Ваша оцінка',
    text: 'Ваш відгук',
    textPlaceholder: 'Що вам найбільше сподобалося? Чим допомогла платформа?',
    counter: '{count} / {max}',
    submit: 'Надіслати відгук',
    submitting: 'Надсилаємо...',
    cancel: 'Скасувати',
    errors: {
      nameRequired: 'Введіть ім’я',
      surnameRequired: 'Введіть прізвище',
      nameMax: 'Не більше {max} символів',
      emailRequired: 'Введіть електронну пошту',
      emailInvalid: 'Введіть пошту у форматі name@example.com',
      phoneFormat: 'Введіть номер у форматі +380 98 938 55 85',
      ratingRequired: 'Оберіть оцінку від 1 до 5',
      textMin: 'Напишіть хоча б {min} символів',
      textMax: 'Не більше {max} символів',
      pending: 'У вас уже є відгук, який чекає на перевірку. Дочекайтесь рішення.',
      tooMany: 'Забагато відгуків з вашої адреси. Спробуйте пізніше.',
      generic: 'Не вдалося надіслати відгук. Спробуйте ще раз.',
    },
    success: {
      title: 'Дякуємо за відгук!',
      description: 'Він з’явиться на сайті після перевірки адміністратором.',
      close: 'Закрити',
    },
  },

  /** Cabinet page «Мій відгук». */
  feedbackPage: {
    title: 'Мій відгук',
    description: 'Поділіться враженням про Formula. Відгук з’явиться на сайті після перевірки.',
    mineTitle: 'Мої відгуки',
    none: 'Ви ще не залишали відгуків',
    status: {
      pending: 'На перевірці',
      approved: 'Опубліковано',
      rejected: 'Не опубліковано',
    },
    pendingNote: 'Ваш відгук ще чекає на перевірку. Новий можна буде написати після рішення.',
    loadError: 'Не вдалося завантажити ваші відгуки',
  },

  /** Moderation page of the admin. */
  admin: {
    title: 'Відгуки',
    description:
      'Відгуки, які залишили гості та студенти. На сайті з’являються лише ті, що ви опублікували.',
    filterLabel: 'Стан відгуків',
    tabs: {
      pending: 'На перевірці',
      approved: 'Опубліковані',
      rejected: 'Відхилені',
    },
    empty: {
      pending: 'Нових відгуків немає',
      pendingHint: 'Коли хтось залишить відгук, він з’явиться тут.',
      approved: 'Опублікованих відгуків ще немає',
      rejected: 'Відхилених відгуків немає',
    },
    guest: 'Гість',
    registered: 'Студент',
    noEmail: 'Пошти немає',
    edited: 'Відредаговано',
    decided: 'Рішення: {name}, {date}',
    loadError: 'Не вдалося завантажити відгуки',
    loadMore: 'Показати ще',
    retry: 'Спробувати ще раз',
    actionError: 'Не вдалося виконати дію. Спробуйте ще раз.',
    actions: {
      label: 'Дії з відгуком',
      approve: 'Опублікувати',
      reject: 'Відхилити',
      unpublish: 'Зняти з публікації',
      restore: 'Повернути на перевірку',
      edit: 'Редагувати',
      delete: 'Видалити',
    },
    deleteTitle: 'Видалити відгук?',
    deleteDescription: 'Відгук від {name} зникне назавжди. Дію не можна скасувати.',
    deleteError: 'Не вдалося видалити відгук',
    edit: {
      title: 'Редагувати відгук',
      description: 'Виправте текст або підпис перед публікацією. Автор побачить зміни на сайті.',
      name: 'Ім’я',
      surname: 'Прізвище',
      email: 'Електронна пошта',
      phone: 'Телефон (необов’язково)',
      text: 'Текст відгуку',
      rating: 'Оцінка',
      save: 'Зберегти',
      saveAndPublish: 'Зберегти й опублікувати',
      saving: 'Зберігаємо...',
      cancel: 'Скасувати',
      error: 'Не вдалося зберегти відгук',
    },
  },

  /** Counter in the admin menu. */
  nav: {
    pending: 'Відгуків на перевірці: {count}',
  },
} as const;
