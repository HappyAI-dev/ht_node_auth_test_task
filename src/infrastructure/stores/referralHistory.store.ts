import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Referral, ReferralHistory } from '@domain/models/referral.model';
import { User } from '@domain/models/user.model';

@Injectable()
export class ReferralHistoryStore {
  constructor(
    @InjectRepository(ReferralHistory)
    private readonly referralRepo: Repository<ReferralHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(inviterId: string, inviteeId: string, date: Date): Promise<ReferralHistory> {
    const referral = this.referralRepo.create({
      inviter: { id: inviterId } as User,
      invitee: { id: inviteeId } as User,
      created_at: date,
    });
  
    return this.referralRepo.save(referral);
  }
  
  async countByInviterId(inviterId: string): Promise<number> {
    return this.referralRepo.count({ where: { inviter: { id: inviterId } } });
  }
  async findByInviterId(inviterId: string): Promise<ReferralHistory[]> {
    return this.referralRepo.find({ where: { inviter: { id: inviterId } } });
  }

  async getInvitersBetween(from: Date, to: Date): Promise<string[]> {
    const records = await this.referralRepo
      .createQueryBuilder('history')
      .select('DISTINCT history.inviter_id', 'inviter_id')
      .where('history.created_at BETWEEN :from AND :to', { from, to })
      .getRawMany();
  
    return records.map(r => r.inviter_id);
  }

  
  

  
}