import { API_PREFIX } from '@formula/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.js';
import { type RenderedEmail, newsEmail, welcomeEmail } from './mail-templates.js';
import { MailRepository } from './mail.repository.js';
import { createUnsubscribeToken, isValidUnsubscribeToken } from './unsubscribe-token.js';

const RESEND_URL = 'https://api.resend.com';
/** Resend accepts up to 100 emails in one batch request. */
const BATCH_SIZE = 100;
/** Resend allows 2 requests a second; one batch per second stays well under it. */
const BATCH_PAUSE_MS = 1000;
const REQUEST_TIMEOUT_MS = 15_000;

interface OutgoingEmail extends RenderedEmail {
  to: string;
  headers?: Record<string, string>;
}

interface PostResult {
  ok: boolean;
  status: number;
}

/**
 * Sends the platform's emails through Resend. Without `RESEND_API_KEY` and `MAIL_FROM` it is
 * dormant: every call returns quietly. Sending never throws, a failed email must not break the
 * action that caused it (a registration, a news broadcast).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string | undefined;
  private readonly replyTo: string | undefined;
  private readonly secret: string;
  private readonly webUrl: string;
  private readonly apiUrl: string;

  constructor(
    private readonly repository: MailRepository,
    config: ConfigService<Env, true>,
  ) {
    this.apiKey = config.get('RESEND_API_KEY', { infer: true });
    this.from = config.get('MAIL_FROM', { infer: true });
    this.replyTo = config.get('MAIL_REPLY_TO', { infer: true });
    this.secret = config.get('JWT_ACCESS_SECRET', { infer: true });
    const explicit = config.get('WEB_URL', { infer: true });
    this.webUrl = (explicit ?? config.get('CORS_ORIGINS', { infer: true })[0] ?? '').replace(
      /\/$/,
      '',
    );
    this.apiUrl = config.get('API_PUBLIC_URL', { infer: true }).replace(/\/$/, '');

    if (!this.enabled) {
      this.logger.log('Email is off: set RESEND_API_KEY and MAIL_FROM to send emails');
    }
  }

  get enabled(): boolean {
    return Boolean(this.apiKey && this.from);
  }

  /** The welcome email after a sign-up. Fire and forget: the caller does not wait for it. */
  sendWelcome(user: { email: string; name: string }): void {
    if (!this.enabled) return;
    const email = welcomeEmail({
      name: user.name,
      email: user.email,
      cabinetUrl: `${this.webUrl}/cabinet`,
      bannerUrl: `${this.webUrl}/email/welcome-banner.png`,
      privacyUrl: `${this.webUrl}/privacy`,
      supportEmail: this.replyTo ?? null,
    });
    void this.post('/emails', this.toPayload({ to: user.email, ...email })).then((result) => {
      if (!result.ok) this.logger.warn(`Welcome email to a new user failed (${result.status})`);
    });
  }

  /** The admin's news to everyone who did not unsubscribe. Runs in the background, in batches. */
  sendNews(news: { title: string; body: string; link: string | null }): void {
    if (!this.enabled) return;
    void this.deliverNews(news).catch((error: Error) => {
      this.logger.warn(`News emails failed: ${error.message}`);
    });
  }

  /** The link in the unsubscribe footer of a news email. */
  unsubscribeUrl(userId: string): string {
    const token = createUnsubscribeToken(this.secret, userId);
    return `${this.apiUrl}/${API_PREFIX}/mail/unsubscribe?u=${userId}&t=${token}`;
  }

  isValidUnsubscribe(userId: string, token: string): boolean {
    return isValidUnsubscribeToken(this.secret, userId, token);
  }

  get siteUrl(): string {
    return this.webUrl;
  }

  private async deliverNews(news: {
    title: string;
    body: string;
    link: string | null;
  }): Promise<void> {
    const recipients = await this.repository.listNewsRecipients();
    const url = news.link ? `${this.webUrl}${news.link}` : null;
    let sent = 0;

    for (let start = 0; start < recipients.length; start += BATCH_SIZE) {
      const batch = recipients.slice(start, start + BATCH_SIZE).map((recipient) => {
        const unsubscribeUrl = this.unsubscribeUrl(recipient.id);
        return this.toPayload({
          to: recipient.email,
          ...newsEmail({ title: news.title, body: news.body, url, unsubscribeUrl }),
          // One-click unsubscribe (RFC 8058): mail clients show their own "Unsubscribe" button.
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
      });

      const result = await this.post('/emails/batch', batch);
      if (!result.ok) {
        // Most often the daily quota of the plan: the next batches would fail the same way.
        this.logger.warn(
          `News emails stopped after ${sent} of ${recipients.length} (Resend answered ${result.status})`,
        );
        return;
      }
      sent += batch.length;
      if (start + BATCH_SIZE < recipients.length) await sleep(BATCH_PAUSE_MS);
    }

    this.logger.log(`News emails sent: ${sent}`);
  }

  private toPayload(email: OutgoingEmail): Record<string, unknown> {
    return {
      from: this.from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(this.replyTo ? { reply_to: this.replyTo } : {}),
      ...(email.headers ? { headers: email.headers } : {}),
    };
  }

  private async post(path: string, body: unknown): Promise<PostResult> {
    try {
      const response = await fetch(`${RESEND_URL}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'formula-api',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.warn(`Resend ${path} answered ${response.status}: ${detail.slice(0, 300)}`);
      }
      return { ok: response.ok, status: response.status };
    } catch (error) {
      this.logger.warn(`Resend ${path} failed: ${(error as Error).message}`);
      return { ok: false, status: 0 };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
