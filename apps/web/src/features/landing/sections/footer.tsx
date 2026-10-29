import Link from 'next/link';

import { Container } from '@/components/common/container';
import { Logo } from '@/components/common/logo';
import { SECTION_IDS } from '@/features/site/constants';
import { t } from '@/locales';

export function Footer() {
  const { description, navigation, contacts, links, socials, rights, privacy } = t.landing.footer;
  const year = new Date().getFullYear();

  return (
    <footer id={SECTION_IDS.contacts} className="scroll-mt-28">
      <Container>
        <div className="bg-card flex flex-col gap-16 rounded-3xl p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div className="flex max-w-100 flex-col gap-5">
              <Logo size="lg" />
              <p className="text-body-lg text-text-secondary">{description}</p>
            </div>

            <nav aria-label={navigation} className="flex flex-col gap-6">
              <p className="text-body-md text-foreground font-medium uppercase">{navigation}</p>
              <ul className="text-body-md text-text-secondary flex flex-col gap-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-6">
              <p className="text-body-md text-foreground font-medium uppercase">{contacts}</p>
              <ul className="text-body-md text-text-secondary flex flex-col gap-4">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-divider text-body-sm text-muted-foreground flex flex-col justify-between gap-2 border-t pt-8 sm:flex-row sm:items-center">
            <p>
              © {year} {t.brand.name}. {rights}
            </p>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {privacy}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
