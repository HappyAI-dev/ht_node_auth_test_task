import { getRepositoryToken } from '@nestjs/typeorm';
import { ReferralHistory } from '@domain/models/referral.model';
import { User } from '@domain/models/user.model'; // <-- Add this import
import { ReferralHistoryStore } from './referralHistory.store';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';

describe('ReferralHistoryStore', () => {
  let store: ReferralHistoryStore;
  let repo: Repository<ReferralHistory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralHistoryStore,
        {
          provide: getRepositoryToken(ReferralHistory),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([
                { inviter_id: 'user-1' },
                { inviter_id: 'user-2' },
              ]),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    store = module.get<ReferralHistoryStore>(ReferralHistoryStore);
    repo = module.get<Repository<ReferralHistory>>(getRepositoryToken(ReferralHistory));
  });

  it('getInvitersBetween возвращает только тех, кто реально кого-то пригласил', async () => {
    const result = await store.getInvitersBetween(new Date(), new Date(Date.now() - 24 * 60 * 60 * 1000));
    expect(result).toEqual(['user-1', 'user-2']);
  });
});