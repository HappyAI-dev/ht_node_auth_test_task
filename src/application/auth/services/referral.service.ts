import { Injectable } from '@nestjs/common';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { UserStore } from '@infrastructure/stores/user.store';
import { Referral } from '@domain/models/referral.model';
import { User } from '@domain/models/user.model';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';

@Injectable()
export class ReferralService {
  constructor(
    private readonly referralStore: ReferralStore,
    private readonly referralHistoryStore: ReferralHistoryStore,
    private readonly userStore: UserStore,
  ) {}

  async create(userId: string, referredBy?: string): Promise<Referral> {
    const user = await this.userStore.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.referralStore.create(userId, referredBy);
  }


  async applyReferralLogic(inviter: User, invitee: User): Promise<void> {
    const referral = await this.referralStore.findByUserId(inviter.id);
    if (!referral) {
      throw new Error(`Referral profile not found for inviter ${inviter.id}`);
    }

    let isLevel2 = referral.referral_level === 2;
    let newLevel = referral.referral_level;
    if (!isLevel2) {
      const totalInvites = await this.referralHistoryStore.countByInviterId(inviter.id);
      newLevel = totalInvites + 1 >= 3 ? 2 : referral.referral_level;
      isLevel2 = newLevel === 2;
    }

    const inviteBonus = isLevel2 ? 150 : 100;
  
    const updatedCredits = referral.credits + inviteBonus;
  
    await this.referralStore.updateReferralStats({
      userId: inviter.id,
      credits: updatedCredits,
      referral_level: newLevel,
    });
  
    await this.referralHistoryStore.create(inviter.id, invitee.id, new Date());
  }

  
}
