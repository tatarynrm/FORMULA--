import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.js';
import { newsEmail } from './mail-templates.js';
import type { MailRepository, NewsRecipient } from './mail.repository.js';
import { MailService } from './mail.service.js';
import { createUnsubscribeToken, isValidUnsubscribeToken } from './unsubscribe-token.js';

const SECRET = 'a'.repeat(32);

function createService(overrides: Record<string, unknown> = {}, recipients: NewsRecipient[] = []) {
  const settings: Record<string, unknown> = {
    RESEND_API_KEY: 're_test',
    MAIL_FROM: 'Formula <noreply@example.com>',
    MAIL_REPLY_TO: 'support@example.com',
    JWT_ACCESS_SECRET: SECRET,
    API_PUBLIC_URL: 'https://api.example.com',
    WEB_URL: 'https://example.com',
    CORS_ORIGINS: ['https://example.com'],
    ...overrides,
  };
  const config = { get: (key: string) => settings[key] } as unknown as ConfigService<Env, true>;
  const repository = {
    listNewsRecipients: async () => recipients,
  } as unknown as MailRepository;
  return new MailService(repository, config);
}

describe('MailService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('stays quiet without a key or a sender', () => {
    const service = createService({ RESEND_API_KEY: undefined });
    service.sendWelcome({ email: 'a@example.com', name: 'Анна' });
    service.sendNews({ title: 'T', body: 'B', link: null });
    expect(service.enabled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the welcome email with the sender, reply-to and a cabinet link', async () => {
    const service = createService();
    service.sendWelcome({ email: 'anna@example.com', name: 'Анна' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string; headers: object }];
    const payload = JSON.parse(init.body) as Record<string, string | string[]>;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test' });
    expect(payload).toMatchObject({
      from: 'Formula <noreply@example.com>',
      to: ['anna@example.com'],
      reply_to: 'support@example.com',
    });
    expect(String(payload.html)).toContain('Анна');
    expect(String(payload.html)).toContain('https://example.com/cabinet');
    expect(String(payload.html)).toContain('https://example.com/email/welcome-banner.png');
    expect(String(payload.html)).toContain('anna@example.com');
  });

  it('sends news in batches of 100 with a personal unsubscribe link and headers', async () => {
    const recipients = Array.from({ length: 150 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      email: `student${index}@example.com`,
      name: 'Студент',
    }));
    const service = createService({}, recipients);
    vi.useFakeTimers();
    service.sendNews({ title: 'Нова тема', body: 'Додали тему', link: '/cabinet' });
    await vi.advanceTimersByTimeAsync(2000);
    vi.useRealTimers();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = JSON.parse((fetchMock.mock.calls[0] as [string, { body: string }])[1].body) as {
      headers: Record<string, string>;
      html: string;
    }[];
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.resend.com/emails/batch');
    expect(first).toHaveLength(100);
    expect(first[0]?.headers['List-Unsubscribe']).toContain(
      '/api/mail/unsubscribe?u=00000000-0000-4000-8000-000000000000&t=',
    );
    expect(first[0]?.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(first[0]?.html).toContain('https://example.com/cabinet');
  });

  it('stops the remaining batches when Resend refuses (quota)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, text: async () => 'quota' });
    const recipients = Array.from({ length: 150 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      email: `student${index}@example.com`,
      name: 'Студент',
    }));
    const service = createService({}, recipients);
    vi.useFakeTimers();
    service.sendNews({ title: 'T', body: 'B', link: null });
    await vi.advanceTimersByTimeAsync(3000);
    vi.useRealTimers();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never throws when the network fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const service = createService();
    expect(() => service.sendWelcome({ email: 'a@example.com', name: 'А' })).not.toThrow();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});

describe('unsubscribe token', () => {
  const user = '00000000-0000-4000-8000-000000000001';

  it('accepts its own token and rejects another person or a forged one', () => {
    const token = createUnsubscribeToken(SECRET, user);
    expect(isValidUnsubscribeToken(SECRET, user, token)).toBe(true);
    expect(isValidUnsubscribeToken(SECRET, '00000000-0000-4000-8000-000000000002', token)).toBe(
      false,
    );
    expect(isValidUnsubscribeToken(SECRET, user, 'x'.repeat(token.length))).toBe(false);
    expect(isValidUnsubscribeToken(SECRET, user, '')).toBe(false);
    expect(isValidUnsubscribeToken('b'.repeat(32), user, token)).toBe(false);
  });
});

describe('news email', () => {
  it('escapes the admin text and keeps the unsubscribe link', () => {
    const email = newsEmail({
      title: 'A <b>bold</b> & title',
      body: 'Line one\n\n<script>alert(1)</script>',
      url: null,
      unsubscribeUrl: 'https://api.example.com/x?u=1&t=2',
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).toContain('A &lt;b&gt;bold&lt;/b&gt; &amp; title');
    expect(email.text).toContain('https://api.example.com/x?u=1&t=2');
  });
});
