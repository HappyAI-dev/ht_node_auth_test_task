import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUserCommand } from '../impl/login-user.command';
import { UserStore } from '@infrastructure/stores/user.store';
import { AuthResponse } from '../../dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@libs/logger/src/logger.service';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: LoginUserCommand): Promise<AuthResponse> {
    this.logger.debug('Handling login user command', { email: command.email });

    // Find user
    const user = await this.userStore.findByEmail(command.email);
    if (!user) {
      this.logger.warn('User not found', { email: command.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    if (!(await user.validatePassword(command.password))) {
      this.logger.warn('Invalid password', { email: command.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.updateLastLogin();
    await this.userStore.save(user);

    // Create JWT token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    this.logger.debug('User login completed', { userId: user.id });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
