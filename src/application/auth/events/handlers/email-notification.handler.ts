import { IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WelcomeEmailRequiredEvent } from '../impl/welcome-email-required.event';

@Injectable()
export class EmailNotificationHandler implements IEventHandler<WelcomeEmailRequiredEvent> {
  private readonly logger = new Logger(EmailNotificationHandler.name);

  async handle(event: WelcomeEmailRequiredEvent): Promise<void> {
    try {
      const { email, firstName } = event.user;
      this.logger.debug(`Preparing welcome email for user: ${email}`);

      // В реальном приложении здесь будет интеграция с email сервисом
      // Например:
      // await this.emailService.sendWelcomeEmail({
      //   to: email,
      //   firstName,
      //   template: 'welcome-email',
      //   data: { firstName }
      // });

      this.logger.log(`Welcome email sent successfully to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${event.user.email}: ${error.message}`,
        error.stack
      );
      // В реальном приложении здесь можно добавить повторную попытку отправки
      // или поместить событие в очередь для последующей обработки
    }
  }
}