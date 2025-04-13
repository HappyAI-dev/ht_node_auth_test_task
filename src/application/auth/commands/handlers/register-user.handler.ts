import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { RegisterUserCommand } from '../impl/register-user.command';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';
import { AuthResponse } from '@libs/shared/dto/auth';
import { AuthService } from '../../services/auth.service';
import { UserCreatedEvent } from '@application/auth/events/impl/user-created.event';
import { WelcomeEmailRequiredEvent } from '@application/auth/events/impl/welcome-email-required.event';
import { LoggerService } from '@libs/logger/src/logger.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userStore: UserStore,
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthResponse> {
    this.logger.debug('Handling RegisterUserCommand', { email: command.email });

    try {
      const { user: userDto, ...response } = await this.authService.register({
        email: command.email,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
      });

      // Get full user model for UserCreatedEvent
      const user = await this.userStore.findById(userDto.id);
      if (!user) {
        throw new Error('User not found after registration');
      }

      // Publish events
      this.eventBus.publish(new UserCreatedEvent(user));
      this.eventBus.publish(new WelcomeEmailRequiredEvent(user));

      this.logger.debug('User registration completed', { userId: user.id });
      return { ...response, user: userDto };
    } catch (error) {
      this.logger.error('Failed to register user', error);
      throw error;
    }
  }
}
