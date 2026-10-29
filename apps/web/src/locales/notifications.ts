/**
 * Texts of the notifications bell, the feed pages (`/cabinet/notifications`, `/admin/inbox`) and
 * the admin news page (`/admin/news`). Registered as `t.notifications`.
 */
export const notifications = {
  bell: {
    label: 'Сповіщення',
    /** The bell with unread items: "Сповіщення: 3 непрочитаних". */
    unreadLabel: 'Сповіщення: {count} {noun}',
    unreadForms: ['непрочитане', 'непрочитаних', 'непрочитаних'],
    /** Shown on the badge when the count does not fit. */
    overflow: '99+',
  },

  popover: {
    title: 'Сповіщення',
    markAllRead: 'Позначити всі прочитаними',
    viewAll: 'Усі сповіщення',
    // Admin queues (shown only to admins who have the section).
    pendingReviews: 'На перевірці: {count}',
    unreadChats: 'Непрочитані діалоги: {count}',
  },

  list: {
    empty: 'Поки нічого нового',
    emptyHint: 'Тут з’являтимуться новини, результати перевірок, доступи й відповіді підтримки.',
    emptyUnread: 'Непрочитаних сповіщень немає',
    loadError: 'Не вдалося завантажити сповіщення',
    retry: 'Спробувати ще раз',
    loadMore: 'Показати ще',
    loadingMore: 'Завантаження...',
    unread: 'Непрочитане',
  },

  page: {
    title: 'Сповіщення',
    description: 'Новини, результати перевірок, доступи й відповіді підтримки.',
    filterLabel: 'Які сповіщення показати',
    filters: { all: 'Усі', unread: 'Непрочитані' },
  },

  /** What kind of notification the icon stands for (for screen readers). */
  types: {
    review_pending: 'Робота на перевірку',
    review_done: 'Результат перевірки',
    access_granted: 'Новий доступ',
    news: 'Новина',
    chat_message: 'Повідомлення в чаті',
    testimonial_pending: 'Відгук на перевірку',
    testimonial_result: 'Рішення щодо відгуку',
    system: 'Системне сповіщення',
  },

  // `formatRelativeTime` (lib/format.ts): minutes and hours come from Intl, these two do not.
  relativeTime: {
    justNow: 'щойно',
    yesterdayAt: 'вчора о {time}',
  },

  news: {
    pageTitle: 'Новини для студентів',
    intro:
      'Новину отримає кожен студент: вона з’явиться в дзвіночку його кабінету. Відкликати надіслане не можна.',
    composer: {
      title: 'Нова новина',
      titleLabel: 'Заголовок',
      titlePlaceholder: 'Наприклад: Нові тести з біохімії',
      bodyLabel: 'Текст',
      bodyPlaceholder: 'Що сталося і що робити студенту',
      linkLabel: 'Посилання',
      linkHint: 'Шлях усередині сайту, наприклад /cabinet/subjects/... Необов’язково.',
      linkPlaceholder: '/cabinet',
      counter: '{count}/{max}',
      submit: 'Надіслати всім студентам',
      sending: 'Надсилання...',
      // Messages of the zod schema (features/notifications/schemas.ts).
      titleRequired: 'Введіть заголовок',
      titleMax: 'Заголовок має містити не більше {max} символів',
      bodyRequired: 'Введіть текст',
      bodyMax: 'Текст має містити не більше {max} символів',
      linkMax: 'Посилання має містити не більше {max} символів',
      linkInvalid: 'Посилання має починатися з «/» і вести всередину сайту',
      error: 'Не вдалося надіслати новину',
    },
    confirm: {
      title: 'Надіслати всім студентам?',
      description: 'Новину побачить кожен студент у своєму дзвіночку. Відкликати її не можна.',
      cancel: 'Скасувати',
      confirm: 'Надіслати',
    },
    sent: 'Надіслано. Отримали: {count} {noun}',
    sentNobody: 'Надіслано, але студентів поки немає',
    history: {
      title: 'Надіслані новини',
      empty: 'Ви ще не надсилали новин',
      emptyHint: 'Перша новина з’явиться тут одразу після надсилання.',
      loadError: 'Не вдалося завантажити історію',
      forbidden: 'Цей розділ вам не відкрито',
      recipients: 'Отримали: {count} {noun}',
      recipientsForms: ['студент', 'студенти', 'студентів'],
      sentBy: 'Надіслав(ла): {name}',
      link: 'Посилання',
      loadMore: 'Показати ще',
    },
  },
} as const;
