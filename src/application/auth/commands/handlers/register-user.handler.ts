import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { RegisterUserCommand } from '../impl/register-user.command';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';
import { AuthResponse } from '../../dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UserCreatedEvent } from '@application/auth/events/impl/user-created.event';
import { WelcomeEmailRequiredEvent } from '@application/auth/events/impl/welcome-email-required.event';
import { WorkspaceCreationRequiredEvent } from '@application/auth/events/impl/workspace-creation-required.event';
import { LoggerService } from '@libs/logger/src/logger.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<AuthResponse> {
    this.logger.debug('Handling register user command', { email: command.email });

    // Check if user already exists
    const exists = await this.userStore.exists(command.email);
    if (exists) {
      this.logger.warn('User already exists', { email: command.email });
      throw new ConflictException('User already exists');
    }

    try {
      // Create user
      const user = await User.create(
        command.email,
        command.password,
        command.firstName,
        command.lastName,
      );

      // Save user
      const savedUser = await this.userStore.save(user);
      this.logger.info('User created successfully', { userId: savedUser.id });

      // Create JWT token
      const payload = { sub: savedUser.id, email: savedUser.email };
      const accessToken = this.jwtService.sign(payload);

      // Publish events
      this.eventBus.publish(new UserCreatedEvent(savedUser));
      this.eventBus.publish(new WelcomeEmailRequiredEvent(savedUser));
      this.eventBus.publish(new WorkspaceCreationRequiredEvent(savedUser));

      this.logger.debug('User registration completed', { userId: savedUser.id });

      return {
        accessToken,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
        },
      };
    } catch (error) {
      this.logger.error('Failed to register user', error, { email: command.email });
      throw error;
    }
  }
}
