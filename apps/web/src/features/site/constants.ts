import { t } from '@/locales';

/** Anchor ids must match the `id` of the corresponding landing section. */
export const SECTION_IDS = {
  advantages: 'advantages',
  about: 'about',
  formats: 'formats',
  trial: 'trial',
  reviews: 'reviews',
  faq: 'faq',
  contacts: 'contacts',
} as const;

export interface SiteNavItem {
  id: string;
  label: string;
  href: string;
}

export const SITE_NAV: SiteNavItem[] = [
  { id: SECTION_IDS.advantages, label: t.site.nav.advantages, href: `/#${SECTION_IDS.advantages}` },
  { id: SECTION_IDS.about, label: t.site.nav.about, href: `/#${SECTION_IDS.about}` },
  { id: SECTION_IDS.formats, label: t.site.nav.formats, href: `/#${SECTION_IDS.formats}` },
  { id: SECTION_IDS.reviews, label: t.site.nav.reviews, href: `/#${SECTION_IDS.reviews}` },
  { id: SECTION_IDS.contacts, label: t.site.nav.contacts, href: `/#${SECTION_IDS.contacts}` },
];
