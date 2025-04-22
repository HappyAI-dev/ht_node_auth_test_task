import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Referral } from '@domain/models/referral.model';


@Injectable()
export class ReferralStore {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
  ) {}

  // create new referral profile
  async create(userId: string, referredBy?: string,  manager?: EntityManager): Promise<Referral> {
    const repo = manager ? manager.getRepository(Referral) : this.referralRepo;
   
    const referral = repo.create({
      userId,
      credits: 0,
      referral_level: 1,
      referral_streak: 0,
      referral_streak_updated_at: new Date(),
      referred_by: referredBy || null,
    });

    return repo.save(referral);
  }

 // find by user id
  async findByUserId(userId: string): Promise<Referral | null> {
    return this.referralRepo.findOne({ where: { userId } });
  }

  // update credits
  async updateCredits(userId: string, delta: number): Promise<void> {
    await this.referralRepo.increment({ userId }, 'credits', delta);
  }

  // increase level
  async increaseLevel(userId: string): Promise<void> {
    await this.referralRepo.increment({ userId }, 'referral_level', 1);
  }

  // reset streak
  async resetStreak(userId: string): Promise<void> {
    await this.referralRepo.update(
      { userId },
      {
        referral_streak: 0,
        referral_streak_updated_at: new Date(),
      },
    );
  }

  // increase streak
  async increaseStreak(userId: string): Promise<void> {
    await this.referralRepo.increment({ userId }, 'referral_streak', 1);
    await this.referralRepo.update(
      { userId },
      { referral_streak_updated_at: new Date() },
    );
  }

  // update streak and credits
  async updateStreakAndCredits(userId: string, streak: number, credits: number): Promise<void> {
    await this.referralRepo.update(
      { userId },
      {
        referral_streak: streak,
        credits,
        referral_streak_updated_at: new Date(),
      },
    );
  }

  async updateReferralStats(data: {
          userId: string;
          credits: number;
          referral_level: number;
                            }): Promise<void> {
          await this.referralRepo.update(
            { userId: data.userId },
            {
              credits: data.credits,
              referral_level: data.referral_level,
            },
          );
        }
        
  async getAll(): Promise<Referral[]> {
    return this.referralRepo.find();
  }
}
