import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReferralService } from '@application/auth/services/referral.service';

@Injectable()
export class ReferralStreakScheduler {
  private readonly logger = new Logger(ReferralStreakScheduler.name);

  constructor(private readonly referralService: ReferralService) {}

  /**
   * Запускается каждый день в полночь (00:00)
   * для обновления реферальных стриков
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUpdateReferralStreaks() {
    this.logger.log('Starting scheduled referral streak update');
    try {
      await this.referralService.updateReferralStreaks();
      this.logger.log(
        'Scheduled referral streak update completed successfully',
      );
    } catch (error) {
      this.logger.error(
        `Error during scheduled referral streak update: ${error.message}`,
        error.stack,
      );
    }
  }
}
