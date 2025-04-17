import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@domain/models/user.model';
import { LoginDto, RegisterDto, AuthResponse } from '@libs/shared/dto/auth';
import { UserStore } from '@infrastructure/stores/user.store';

@Injectable()
export class AuthService {
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userStore.findByEmail(email);
    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  generateAuthResponse(user: User): AuthResponse {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        referralLevel: user.referralLevel,
        referralCount: user.referralCount,
        referralStreak: user.referralStreak,
        credits: user.credits,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Обновляем время последнего входа
    user.updateLastLogin();
    const updatedUser = await this.userStore.save(user);

    return this.generateAuthResponse(updatedUser);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.userStore.exists(registerDto.email);
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    // Реферальный код будет обработан в RegisterUserHandler через ReferralService
    const user = await User.create(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );

    const savedUser = await this.userStore.save(user);
    return this.generateAuthResponse(savedUser);
  }
}
