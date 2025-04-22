import {
    Controller,
    Get,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { User } from '@domain/models/user.model';
  import { UserReferralDto } from '@libs/shared/dto/referrals/ref.dto';
  
  @ApiTags('Referral')
  @Controller('referrals')
  export class ReferralController {
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    @Get('all')
    @ApiOperation({ summary: 'Получить всех пользователей с их реферальной информацией' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Список пользователей с баллами, стриками и уровнем',
      type: [UserReferralDto],
    })
    async getAllReferrals(): Promise<UserReferralDto[]> {
      const users = await this.userRepository.find({
        relations: ['referral'], // подтягиваем связанную сущность
        order: { email: 'ASC' },
      });
  
      return users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        referral_code: user.referral_code,
        credits: user.referral?.credits ?? 0,
        referral_level: user.referral?.referral_level ?? 1,
        referral_streak: user.referral?.referral_streak ?? 0,
        referral_streak_updated_at: user.referral?.referral_streak_updated_at
          ? user.referral.referral_streak_updated_at.toISOString()
          : null,
      }));
    }
  }
  