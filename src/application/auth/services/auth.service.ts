import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@domain/models/user.model';
import { LoginDto, RegisterDto, AuthResponse } from '@libs/shared/dto/auth';
import { UserStore } from '@infrastructure/stores/user.store';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userStore: UserStore,
    private readonly referralStore: ReferralStore,
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
        referral_code: user.referral_code,
      },
    };
  }

  private async generateReferralCode(): Promise<string> {
    let code: string;
    let exists = true;
  
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await this.userStore.existsByReferralCode(code);
    } while (exists);
  
    return code;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.userStore.exists(registerDto.email);
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }
    // Generate referral code for user
    const referral_code = await this.generateReferralCode();


    // create transaction
    return this.dataSource.transaction(async (manager: EntityManager) => {

      const user = await User.create(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        referral_code,
      );
      const savedUser = await this.userStore.save(user, manager);

      await this.referralStore.create(user.id, registerDto.referredBy, manager);


      return this.generateAuthResponse(savedUser);
    });
  }
}
