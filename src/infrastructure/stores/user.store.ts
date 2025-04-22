import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '@domain/models/user.model';


@Injectable()
export class UserStore {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  async existsByReferralCode(referral_code: string): Promise<boolean> {
    const count = await this.repository.count({ where: { referral_code } });
    return count > 0;
  }

  async save(user: User, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.repository;
    return repo.save(user);
  }

  async findByReferralCode(referral_code: string): Promise<User | null> {
    return this.repository.findOne({ where: { referral_code } });
  }
 
}
