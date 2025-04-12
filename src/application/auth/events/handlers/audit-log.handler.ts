import { IEventHandler } from '../../../../../libs/shared/src/lib/cqrs/interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { UserCreatedEvent } from '../impl/user-created.event';
import { UserLoggedInEvent } from '../impl/user-logged-in.event';

@Injectable()
export class UserCreatedAuditHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedAuditHandler.name);

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      const { email, id } = event.user;
      this.logger.log(`User created - ID: ${id}, Email: ${email}`);
      // В реальном приложении здесь будет сохранение в базу данных аудита
    } catch (error) {
      this.logger.error(`Failed to log user creation event: ${error.message}`, error.stack);
    }
  }
}

@Injectable()
export class UserLoggedInAuditHandler implements IEventHandler<UserLoggedInEvent> {
  private readonly logger = new Logger(UserLoggedInAuditHandler.name);

  async handle(event: UserLoggedInEvent): Promise<void> {
    try {
      const { email } = event;
      this.logger.log(`User logged in - Email: ${email}`);
      // В реальном приложении здесь будет сохранение в базу данных аудита
    } catch (error) {
      this.logger.error(`Failed to log user login event: ${error.message}`, error.stack);
    }
  }
}
