import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsNotEmpty, IsString, MinLength, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'Реферальный код',
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
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

export class ReferralProgramDTO {

  @ApiProperty({ example: 1, description: 'Уровень реферала' })
  @IsNumber()
  level: number;

  @ApiProperty({ example: 50, description: 'Кредит за приглашение' })
  @IsNumber()
  credit: number;

  @ApiProperty({ example: 50, description: 'Кредит за приглашение' })
  @IsOptional()
  @IsNumber()
  refcount?: number;

  @ApiProperty({ example: 5, description: 'Серия использования', required: false })
  @IsOptional()
  @IsNumber()
  streak?: number;

  @ApiProperty({ example: '2025-04-20T10:00:00Z', description: 'Timestamp', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  strTimestamp?: Date;

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
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  refCode?: string;



  @ApiProperty({ type: () => ReferralProgramDTO , required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReferralProgramDTO )
  referralData?: ReferralProgramDTO;//box maybe?
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
