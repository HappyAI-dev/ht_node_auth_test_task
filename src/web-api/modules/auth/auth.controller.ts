import { Body, Controller, Get, Post, UseGuards, HttpCode, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RegisterUserCommand } from '@application/auth/commands/impl/register-user.command';
import { LoginUserCommand } from '@application/auth/commands/impl/login-user.command';
import { GetUserProfileQuery } from '@application/auth/queries/impl/get-user-profile.query';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@application/auth/decorators/current-user.decorator';
import { User } from '@domain/models/user.model';
import { RegisterDto, LoginDto, AuthResponse, UserDto } from './dto/auth.dto';
import { LoggerService } from '@libs/logger/src/logger.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggerService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered', type: AuthResponse })
  @ApiBadRequestResponse({
    description: 'Invalid registration data or user already exists',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    try {
      this.logger.debug('Registering new user', { email: dto.email });
      // Регистрируем пользователя
      await this.commandBus.execute(
        new RegisterUserCommand(dto.email, dto.password, dto.firstName, dto.lastName),
      );
      
      // Выполняем вход
      return this.commandBus.execute(
        new LoginUserCommand(dto.email, dto.password),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged in', type: AuthResponse })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    try {
      this.logger.debug('Logging in user', { email: dto.email });
      return await this.commandBus.execute(
        new LoginUserCommand(dto.email, dto.password),
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully', type: UserDto })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserDto> {
    this.logger.debug('Getting user profile', { userId: user.id });
    return this.queryBus.execute(new GetUserProfileQuery(user.id));
  }
}
