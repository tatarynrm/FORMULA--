'use client';

import type { Profile } from '@formula/shared';
import { type ReactNode, useState } from 'react';

import { LogoLoader } from '@/components/common/logo-loader';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useMenu } from '@/features/menu/hooks/use-menu';
import { t } from '@/locales';

import { useProfile } from '../hooks/use-profile';
import { AccountForm } from './account-form';
import { TelegramBotCard } from '@/features/messengers/components/telegram-bot-card';

import { AvatarEditor } from './avatar-editor';
import { ContactsForm } from './contacts-form';
import { PasswordForm } from './password-form';
import { ProfileForm } from './profile-form';

/**
 * The profile of the signed-in person. Students and admins share the account, avatar and password
 * sections; students also fill in their study details, admins see the sections they may use.
 */
export function ProfilePage() {
  const copy = t.profile;
  const { data: user, isPending: userPending } = useCurrentUser();
  const { data: profile, isPending: profilePending, isError } = useProfile();

  if (userPending || profilePending) return <LogoLoader size="lg" fill />;
  if (!user || isError || !profile) {
    return (
      <p role="alert" className="text-body-md text-input-error-text">
        {copy.loadError}
      </p>
    );
  }

  const roleLabel = user.adminLevel ? copy.roles[user.adminLevel] : copy.roles.student;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.page.title}
        description={`${user.name} ${user.surname} · ${user.email}`}
        action={<Badge variant={user.adminLevel ? 'brand' : 'secondary'}>{roleLabel}</Badge>}
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Section title={copy.avatar.title}>
            <AvatarEditor />
          </Section>

          <Section title={copy.account.title}>
            {/* Keyed by the saved values, so the form shows the stored name after a save. */}
            <AccountForm
              key={`${profile.name}|${profile.surname}`}
              name={profile.name}
              surname={profile.surname}
              email={profile.email}
            />
          </Section>

          <ContactsSection profile={profile} />

          {user.role === 'student' ? (
            <Section title={copy.study.title} hint={copy.study.hint}>
              <ProfileForm />
            </Section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Section title={copy.security.title}>
            <PasswordForm />
          </Section>

          {user.role === 'admin' ? (
            <AdminSections superadmin={user.adminLevel === 'superadmin'} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Phone, messengers and the Telegram bot. */
function ContactsSection({ profile }: { profile: Profile }) {
  const [saved, setSaved] = useState(false);

  return (
    <Section title={t.contacts.title} hint={t.contacts.hint}>
      {/* Keyed by the saved values, so the form shows what is stored after a save. */}
      <ContactsForm
        key={`${profile.phone}|${profile.messengers.map((item) => `${item.kind}:${item.username}`).join(',')}`}
        profile={profile}
        saved={saved}
        onSavedChange={setSaved}
      />
      <TelegramBotCard />
    </Section>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-surface-raised border-input flex flex-col gap-4 rounded-2xl border p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-body-lg text-foreground font-bold">{title}</h2>
        {hint ? <p className="text-body-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Read-only list of what this admin can open. */
function AdminSections({ superadmin }: { superadmin: boolean }) {
  const copy = t.profile.adminSections;
  const { data: menu } = useMenu();

  return (
    <Section title={copy.title}>
      {superadmin ? (
        <p className="text-body-md text-text-secondary">{copy.all}</p>
      ) : menu && menu.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {menu.map((item) => (
            <li key={item.id}>
              <Badge variant="secondary">{item.label}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-md text-text-secondary">{copy.none}</p>
      )}
    </Section>
  );
}
