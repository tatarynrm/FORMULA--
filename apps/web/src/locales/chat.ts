/**
 * Texts of the support chat (student ↔ support team): the cabinet page and the admin inbox.
 * Kept in its own file so it can grow without touching the main dictionary.
 */
export const chat = {
  student: {
    title: 'Підтримка',
    subtitle: 'Напиши нам, зазвичай відповідаємо протягом дня',
    emptyTitle: 'Тут ще немає повідомлень',
    emptyDescription: 'Опиши своє питання, і ми відповімо якнайшвидше.',
  },

  admin: {
    title: 'Підтримка',
    list: {
      label: 'Діалоги',
      search: 'Пошук діалогів',
      searchPlaceholder: 'Ім’я або пошта студента...',
      filterLabel: 'Статус діалогу',
      open: 'Відкриті',
      closed: 'Закриті',
      empty: 'Діалогів ще немає',
      emptyHint: 'Коли студент напише в підтримку, діалог з’явиться тут.',
      emptyClosed: 'Закритих діалогів немає',
      noMatches: 'Нічого не знайдено',
      noMatchesHint: 'Спробуйте інше ім’я або пошту.',
      loadError: 'Не вдалося завантажити діалоги',
      loadMore: 'Показати ще',
      photo: 'Фото',
      you: 'Ви: ',
      noMessages: 'Повідомлень ще немає',
      unread: '{count} непрочитаних',
      openFor: 'Відкрити діалог з {name}',
    },
    thread: {
      select: 'Оберіть діалог',
      selectHint: 'Виберіть студента зі списку, щоб прочитати повідомлення й відповісти.',
      back: 'До списку діалогів',
      status: { open: 'Відкритий', closed: 'Закритий' },
      close: 'Закрити діалог',
      reopen: 'Відкрити знову',
      statusError: 'Не вдалося змінити статус діалогу',
      profile: 'Відкрити профіль студента',
      emptyTitle: 'Повідомлень ще немає',
      emptyDescription: 'Студент ще нічого не написав. Ви можете написати першими.',
      notFound: 'Діалог не знайдено',
      notFoundHint: 'Можливо, його видалено разом з акаунтом студента.',
    },
  },

  thread: {
    log: 'Повідомлення',
    loadError: 'Не вдалося завантажити чат',
    loadErrorHint: 'Перевірте з’єднання й спробуйте ще раз.',
    retry: 'Спробувати ще раз',
    loadingOlder: 'Завантажуємо попередні повідомлення...',
    olderError: 'Не вдалося завантажити попередні повідомлення',
    newMessages: 'Нові повідомлення',
    scrollToBottom: 'До останніх повідомлень',
    today: 'Сьогодні',
    yesterday: 'Вчора',
    read: 'Прочитано {time}',
    sent: 'Надіслано',
    sending: 'Надсилається...',
    failed: 'Не надіслано',
    retrySend: 'Повторити',
    discard: 'Видалити',
    typing: '{name} друкує...',
    reconnecting: 'Відновлюємо з’єднання...',
    closed: 'Діалог закрито',
    reopened: 'Діалог відкрито знову',
    imageAlt: 'Зображення з чату',
    openImage: 'Відкрити зображення',
    imageTitle: 'Зображення',
    imageError: 'Не вдалося завантажити зображення',
    support: 'Підтримка',
    you: 'Ви',
  },

  composer: {
    label: 'Нове повідомлення',
    placeholder: 'Напишіть повідомлення...',
    send: 'Надіслати',
    attachImage: 'Додати зображення',
    removeImage: 'Прибрати зображення',
    previewAlt: 'Вибране зображення',
    counter: '{count} / {max}',
    hint: 'Enter надсилає, Shift+Enter переносить рядок',
    uploading: 'Завантаження {percent}%',
  },

  /** The counter next to «Підтримка» in the menu. */
  nav: {
    unread: 'Непрочитаних повідомлень у підтримці: {count}',
  },

  /** Compact relative time in the list of conversations. */
  time: {
    justNow: 'щойно',
    minutes: '{count} хв',
    hours: '{count} год',
    yesterday: 'вчора',
  },
} as const;
