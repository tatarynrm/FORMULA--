import { Global, Module } from '@nestjs/common';

import { MailController } from './mail.controller.js';
import { MailRepository } from './mail.repository.js';
import { MailService } from './mail.service.js';

/**
 * Global: auth (welcome email) and notifications (news) send mail without importing the module.
 * Without `RESEND_API_KEY` and `MAIL_FROM` it is dormant.
 */
@Global()
@Module({
  controllers: [MailController],
  providers: [MailRepository, MailService],
  exports: [MailService],
})
export class MailModule {}
