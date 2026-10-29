import type { MenuIcon } from '@formula/shared';

/** Public SVG for every icon name the api may send. Unknown names fall back to the file icon. */
export const MENU_ICON_SRC: Record<MenuIcon, string> = {
  home: '/cabinet/icon-home.svg',
  'book-open': '/cabinet/icon-book-open.svg',
  book: '/cabinet/icon-book.svg',
  amps: '/cabinet/icon-amps.svg',
  saved: '/cabinet/icon-saved.svg',
  students: '/admin/icon-students.svg',
  team: '/admin/icon-team.svg',
  menu: '/admin/icon-menu.svg',
  file: '/admin/icon-file.svg',
  test: '/admin/icon-test.svg',
  bell: '/cabinet/icon-bell.svg',
  chat: '/cabinet/icon-chat.svg',
  star: '/cabinet/icon-star.svg',
};

export function getMenuIconSrc(icon: string): string {
  return MENU_ICON_SRC[icon as MenuIcon] ?? MENU_ICON_SRC.file;
}
