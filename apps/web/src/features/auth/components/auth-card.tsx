import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

type AuthTab = 'login' | 'register';

interface AuthCardProps {
  active: AuthTab;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const TABS: { id: AuthTab; href: string; label: string }[] = [
  { id: 'login', href: '/login', label: t.auth.tabs.login },
  { id: 'register', href: '/register', label: t.auth.tabs.register },
];

/** Shared frame of the login and register pages (Figma "login-form" / "right-panel"). */
export function AuthCard({ active, title, subtitle, children }: AuthCardProps) {
  return (
    <div className="bg-card flex w-full max-w-150 flex-col gap-6 rounded-2xl p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-body-xl text-foreground font-bold">{title}</h1>
        <p className="text-body-md text-input-placeholder">{subtitle}</p>
      </div>

      <nav
        aria-label={`${t.auth.tabs.login} / ${t.auth.tabs.register}`}
        className="bg-background flex h-14 gap-1 rounded-full p-1.5"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === active ? 'page' : undefined}
            className={cn(
              'text-body-md flex flex-1 items-center justify-center rounded-full px-5 py-2.5 font-medium transition-colors',
              tab.id === active
                ? 'bg-card text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}

export function FormDivider() {
  return (
    <div className="flex items-center gap-6">
      <span className="bg-divider h-px flex-1" />
      <span className="text-body-sm text-input-placeholder">{t.auth.or}</span>
      <span className="bg-divider h-px flex-1" />
    </div>
  );
}
