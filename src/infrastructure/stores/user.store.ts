import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '@domain/models/user.model';

@Injectable()
export class UserStore {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ referralCode });
  }

  async findUsersWithStreak(): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        referralStreak: MoreThan(0),
      },
    });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
