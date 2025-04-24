import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@domain/models/user.model';
import { LoginDto, RegisterDto, AuthResponse } from '@libs/shared/dto/auth';
import { UserStore } from '@infrastructure/stores/user.store';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userStore: UserStore,
    private readonly jwtService: JwtService,

  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userStore.findByEmail(email);
    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    } 
    if (!user.refCode){
      user.generateGenesisRefBox();
      this.logger.log('Genesis ref box created.');
      await this.userStore.save(user);

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
        refCode: user.refCode, 
      },
    };
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


    const user = await User.create(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );

    const existingRef = registerDto.referralCode
    ? await this.userStore.findByRefCode(registerDto.referralCode)
    : null;

    if(existingRef){
      user.generateRefBoxByReferredUser();
      this.logger.log(`Referral code used succesfully: ${registerDto.referralCode}`);
      existingRef.processReferral(this.logger);
      await this.userStore.save(existingRef);
      this.logger.warn(`Referral user updated`);
      
    } else {
      user.generateGenesisRefBox();
      this.logger.log('No referral code provided or Referral not found. Genesis ref box created.');
    }

    const savedUser = await this.userStore.save(user);
    return this.generateAuthResponse(savedUser);
  }
}
