import { API_PREFIX } from '@formula/shared';
import { Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

import { unsubscribePage } from './mail-templates.js';
import { MailRepository } from './mail.repository.js';
import { MailService } from './mail.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The unsubscribe link of the news emails. Open to everyone (it is a link in an email), protected
 * by the signature in `t`. GET only shows a confirmation, because mail scanners open links on
 * their own; the POST, from the page button or from the mail client's one-click button, unsubscribes.
 */
@ApiExcludeController()
@Controller('mail')
export class MailController {
  constructor(
    private readonly mail: MailService,
    private readonly repository: MailRepository,
  ) {}

  @Get('unsubscribe')
  confirm(@Query('u') user: unknown, @Query('t') token: unknown, @Res() response: Response): void {
    const valid = this.isValid(user, token);
    response.type('html').send(
      unsubscribePage({
        kind: valid ? 'confirm' : 'invalid',
        action: `/${API_PREFIX}/mail/unsubscribe?u=${encodeURIComponent(String(user))}&t=${encodeURIComponent(String(token))}`,
        siteUrl: this.mail.siteUrl,
      }),
    );
  }

  @Post('unsubscribe')
  @HttpCode(200)
  async unsubscribe(
    @Query('u') user: unknown,
    @Query('t') token: unknown,
    @Res() response: Response,
  ): Promise<void> {
    if (!this.isValid(user, token)) {
      response
        .status(400)
        .type('html')
        .send(unsubscribePage({ kind: 'invalid', siteUrl: this.mail.siteUrl }));
      return;
    }
    await this.repository.setNewsEnabled(user as string, false);
    response.type('html').send(unsubscribePage({ kind: 'done', siteUrl: this.mail.siteUrl }));
  }

  private isValid(user: unknown, token: unknown): boolean {
    return (
      typeof user === 'string' &&
      typeof token === 'string' &&
      UUID.test(user) &&
      this.mail.isValidUnsubscribe(user, token)
    );
  }
}
