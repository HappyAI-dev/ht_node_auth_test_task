import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@domain/models/user.model';
import { Referral } from '@domain/models/referral.model';
import { ReferralHistory } from '@domain/models/referral.model';

import { ReferralController } from './referral.controller';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralService } from '@application/auth/services/referral.service';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReferralCronService } from '@application/auth/services/referralCron.service';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, Referral, ReferralHistory]),
    AuthModule,
  ],
  controllers: [ReferralController],
  providers: [ReferralStore, ReferralHistoryStore, ReferralService, ReferralCronService],
  exports: [ReferralStore, ReferralService], 
})
export class ReferralModule {}
