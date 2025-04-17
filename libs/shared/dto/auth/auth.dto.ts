import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'strongPassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John',
    required: false,
  })
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Doe',
    required: false,
  })
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Реферальный код пригласившего пользователя',
    example: 'ABC123XY',
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'strongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Реферальный код пользователя',
    example: 'ABC123XY',
    required: false,
  })
  referralCode?: string;

  @ApiProperty({
    description: 'Уровень в реферальной программе',
    example: 1,
  })
  referralLevel: number;

  @ApiProperty({
    description: 'Количество приглашенных пользователей',
    example: 0,
  })
  referralCount: number;

  @ApiProperty({
    description: 'Текущий стрик (последовательные дни с приглашениями)',
    example: 0,
  })
  referralStreak: number;

  @ApiProperty({
    description: 'Количество кредитов пользователя',
    example: 0,
  })
  credits: number;
}

export class AuthResponse {
  @ApiProperty({
    description: 'JWT токен для авторизации',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Информация о пользователе',
    type: UserDto,
  })
  user: UserDto;
}
