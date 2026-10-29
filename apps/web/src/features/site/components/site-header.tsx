import Link from 'next/link';

import { Container } from '@/components/common/container';
import { Logo } from '@/components/common/logo';
import { t } from '@/locales';

import { SITE_NAV } from '../constants';
import { SiteAuthActions } from './site-auth-actions';
import { SiteMobileNav } from './site-mobile-nav';

/**
 * Public header: frosted pill with logo, anchors and auth buttons (Figma "Header / Guest").
 * A signed-in visitor gets "into the cabinet" and "sign out" instead of the guest buttons.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 pt-4 md:pt-10">
      <Container>
        <div className="bg-surface-raised/50 flex items-center justify-between gap-4 rounded-full px-4 py-3 backdrop-blur-md md:px-6 md:py-4">
          <Logo />

          <nav aria-label={t.brand.name} className="hidden items-center gap-2 lg:flex">
            {SITE_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-body-md text-foreground hover:text-primary rounded-full px-2 py-3 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SiteAuthActions layout="row" className="hidden md:flex" />
            <SiteMobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
