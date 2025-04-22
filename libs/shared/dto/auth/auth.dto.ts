import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { string } from 'fp-ts';

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
    description: 'Код пригласившего пользователя (если есть)',
    example: 'RV2HCG',
    required: false,
  })
  @IsString()
  @IsOptional()
  referral_code?: string;


  @ApiProperty({
    description: 'ID пригласившего пользователя (автоматически заполняется)',
    required: false,
  })
  @IsString()
  @IsOptional()
  referredBy?: string;



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
    description: 'Реферальный код',
    example: 'AB123',
  })
  referral_code?: string;
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

