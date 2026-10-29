'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { t } from '@/locales';

import { SITE_NAV } from '../constants';
import { SiteAuthActions } from './site-auth-actions';

/** Slide-out menu used below the `lg` breakpoint, where the inline nav is hidden. */
export function SiteMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.common.openMenu}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-card">
        <SheetHeader>
          <SheetTitle>{t.brand.name}</SheetTitle>
          <SheetDescription className="sr-only">{t.brand.tagline}</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {SITE_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-body-lg text-foreground hover:bg-accent rounded-base px-3 py-3 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 md:hidden">
          <SiteAuthActions layout="column" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
