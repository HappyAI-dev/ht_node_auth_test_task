import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { RegisterUserCommand } from '@application/auth/commands/impl/register-user.command';
import { UserCreatedEvent } from '@application/auth/events/impl/user-created.event';
import { WelcomeEmailRequiredEvent } from '@application/auth/events/impl/welcome-email-required.event';
import { AuthService } from '@application/auth/services/auth.service';
import { ReferralService } from '@application/auth/services/referral.service';
import { UserStore } from '@infrastructure/stores/user.store';
import { AuthResponse } from '@libs/shared/dto/auth';
import { LoggerService } from '@libs/logger/src/logger.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly userStore: UserStore,
    private readonly authService: AuthService,
    private readonly referralService: ReferralService,
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
        referralCode: command.referralCode,
      });

      // Get full user model for UserCreatedEvent
      const user = await this.userStore.findById(userDto.id);
      if (!user) {
        throw new Error('User not found after registration');
      }

      // Update last login time
      user.updateLastLogin();
      await this.userStore.save(user);

      // Обработка реферального кода, если есть
      if (command.referralCode) {
        await this.referralService.processReferralCode(
          user,
          command.referralCode,
        );
      }

      // Publish events
      this.eventBus.publish(new UserCreatedEvent(user));
      this.eventBus.publish(new WelcomeEmailRequiredEvent(user));

      // Получаем обновленные данные пользователя после всех изменений
      const updatedUser = await this.userStore.findById(user.id);
      if (!updatedUser) {
        throw new Error('User not found after referral processing');
      }

      this.logger.debug('User registration completed', { userId: user.id });

      // Обновляем данные пользователя в ответе с учетом кредитов и реферальной информации
      const updatedUserDto = {
        ...userDto,
        referralCode: updatedUser.referralCode,
        referralLevel: updatedUser.referralLevel,
        referralCount: updatedUser.referralCount,
        referralStreak: updatedUser.referralStreak,
        credits: updatedUser.credits,
      };

      return { ...response, user: updatedUserDto };
    } catch (error) {
      this.logger.error('Failed to register user', error, {
        email: command.email,
      });
      throw error;
    }
  }
}
