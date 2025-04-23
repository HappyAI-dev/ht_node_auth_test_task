import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';

@Injectable()
export class ReferralCronService {
  private readonly logger = new Logger(ReferralCronService.name);

  constructor(
    private readonly referralStore: ReferralStore,
    private readonly referralHistoryStore: ReferralHistoryStore,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateReferralStreaks() {
    this.logger.log('🕓 Началось обновление стриков...');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activeInviters = await this.referralHistoryStore.getInvitersBetween(today, tomorrow); 

    for (const userId of activeInviters) {
      await this.referralStore.increaseStreak(userId);
      this.logger.log(`🔥 Стик увеличен для пригласившего: ${userId}`);
    }
    
    const allReferrals = await this.referralStore.getAll();
    const activeSet = new Set(activeInviters);
    
    for (const referral of allReferrals) {
      if (!activeSet.has(referral.userId)) {
        await this.referralStore.resetStreak(referral.userId);
        this.logger.log(`❄️ Стик сброшен: ${referral.userId}`);
      }
    }

    this.logger.log('✅ Стрики обновлены');
  }
}
