/**
 * Which admin sections (menu keys) may open an admin route. The api enforces access per section on
 * every request; this map lets the UI show a "no access" state, or redirect, before any request.
 * An empty list means "any admin" (for example the profile).
 */
const ROUTE_SECTIONS: ReadonlyArray<{ prefix: string; sections: readonly string[] }> = [
  { prefix: '/admin/subjects', sections: ['subjects'] },
  { prefix: '/admin/subtopics', sections: ['subjects'] },
  // A test belongs to the section of its collection (subtopic tests: subjects, then bases, booklets,
  // AMPS), which is only known after it loads, so any of them opens the editor. The api decides.
  { prefix: '/admin/tests', sections: ['subjects', 'bases', 'booklets', 'amps'] },
  { prefix: '/admin/bases', sections: ['bases'] },
  { prefix: '/admin/booklets', sections: ['booklets'] },
  { prefix: '/admin/amps', sections: ['amps'] },
  { prefix: '/admin/reviews', sections: ['reviews'] },
  { prefix: '/admin/students', sections: ['students'] },
  { prefix: '/admin/support', sections: ['support'] },
  { prefix: '/admin/news', sections: ['news'] },
  { prefix: '/admin/testimonials', sections: ['testimonials'] },
  // The admin's own notification feed (the bell): any admin.
  { prefix: '/admin/inbox', sections: [] },
  { prefix: '/admin/staff', sections: ['staff'] },
  { prefix: '/admin/menu', sections: ['menu'] },
  { prefix: '/admin/profile', sections: [] },
  // Pages the superadmin added to the admin menu: the api opens one only for admins who may see its item.
  { prefix: '/admin/pages', sections: [] },
];

/**
 * Sections that may open `pathname`: `[]` for any admin, `null` for an unknown route.
 * The admin root is the subjects list.
 */
export function getAdminSections(pathname: string): readonly string[] | null {
  if (pathname === '/admin') return ['subjects'];
  const match = ROUTE_SECTIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.sections ?? null;
}
