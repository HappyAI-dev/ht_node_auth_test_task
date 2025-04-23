import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralStore } from './referral.store';
import { Referral } from '@domain/models/referral.model';

const mockReferral = {
  userId: 'user-1',
  credits: 0,
  referral_level: 1,
  referral_streak: 0,
  referral_streak_updated_at: new Date(),
  referred_by: null,
};

describe('ReferralStore', () => {
  let store: ReferralStore;
  let repo: Repository<Referral>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralStore,
        {
          provide: getRepositoryToken(Referral),
          useValue: {
            create: jest.fn().mockReturnValue(mockReferral),
            save: jest.fn().mockResolvedValue(mockReferral),
            findOne: jest.fn().mockResolvedValue(mockReferral),
            increment: jest.fn(),
            update: jest.fn(),
            find: jest.fn().mockResolvedValue([mockReferral]),
          },
        },
      ],
    }).compile();

    store = module.get<ReferralStore>(ReferralStore);
    repo = module.get<Repository<Referral>>(getRepositoryToken(Referral));
  });

  it('should create a referral', async () => {
    const saveSpy = jest.spyOn(repo, 'save');
    const result = await store.create('user-1', 'inviter-1');
    expect(repo.create).toHaveBeenCalledWith({
      userId: 'user-1',
      credits: 0,
      referral_level: 1,
      referral_streak: 0,
      referral_streak_updated_at: expect.any(Date),
      referred_by: 'inviter-1',
    });
    expect(saveSpy).toHaveBeenCalledWith(mockReferral);
    expect(result).toEqual(mockReferral);
  });

  it('should find by user id', async () => {
    const result = await store.findByUserId('user-1');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(result).toEqual(mockReferral);
  });

  it('should update credits', async () => {
    await store.updateCredits('user-1', 5);
    expect(repo.increment).toHaveBeenCalledWith({ userId: 'user-1' }, 'credits', 5);
  });

  it('should increase level', async () => {
    await store.increaseLevel('user-1');
    expect(repo.increment).toHaveBeenCalledWith({ userId: 'user-1' }, 'referral_level', 1);
  });

  it('should reset streak', async () => {
    await store.resetStreak('user-1');
    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      {
        referral_streak: 0,
        referral_streak_updated_at: expect.any(Date),
      },
    );
  });

  it('should increase streak', async () => {
    await store.increaseStreak('user-1');
    expect(repo.increment).toHaveBeenCalledWith({ userId: 'user-1' }, 'referral_streak', 1);
    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { referral_streak_updated_at: expect.any(Date) },
    );
  });

  it('should update streak and credits', async () => {
    await store.updateStreakAndCredits('user-1', 2, 10);
    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      {
        referral_streak: 2,
        credits: 10,
        referral_streak_updated_at: expect.any(Date),
      },
    );
  });

  it('should update referral stats', async () => {
    await store.updateReferralStats({ userId: 'user-1', credits: 10, referral_level: 2 });
    expect(repo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      {
        credits: 10,
        referral_level: 2,
      },
    );
  });

  it('should get all referrals', async () => {
    const result = await store.getAll();
    expect(repo.find).toHaveBeenCalled();
    expect(result).toEqual([mockReferral]);
  });

  describe('increaseStreak', () => {
    it('инкрементит стрик и обновляет дату', async () => {
      await store.increaseStreak('user-1');
      expect(repo.increment).toHaveBeenCalledWith({ userId: 'user-1' }, 'referral_streak', 1);
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        { referral_streak_updated_at: expect.any(Date) },
      );
    });
  });

  describe('resetStreak', () => {
    it('сбрасывает стрик и обновляет дату', async () => {
      await store.resetStreak('user-1');
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        {
          referral_streak: 0,
          referral_streak_updated_at: expect.any(Date),
        },
      );
    });
  });

  describe('updateReferralStats', () => {
    it('обновляет кредиты и уровень корректно', async () => {
      await store.updateReferralStats({ userId: 'user-1', credits: 42, referral_level: 3 });
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'user-1' },
        {
          credits: 42,
          referral_level: 3,
        },
      );
    });
  });
});
