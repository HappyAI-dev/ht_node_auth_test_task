import { Test, TestingModule } from '@nestjs/testing';
import { ReferralCronService } from './referralCron.service';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';


describe('ReferralCronService.updateReferralStreaks', () => {
  let service: ReferralCronService;
  let referralStore: any;
  let referralHistoryStore: any;

  beforeEach(async () => {
    referralStore = {
      increaseStreak: jest.fn(),
      resetStreak: jest.fn(),
      getAll: jest.fn(),
    };
    referralHistoryStore = {
      getInvitersBetween: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralCronService,
        { provide: ReferralStore, useValue: referralStore },
        { provide: ReferralHistoryStore, useValue: referralHistoryStore },
      ],
    }).compile();
    service = module.get<ReferralCronService>(ReferralCronService);
  });

  it('если пользователь пригласил сегодня — стик не трогаем', async () => {
    referralHistoryStore.getInvitersBetween.mockResolvedValue(['user1']);
    referralStore.getAll.mockResolvedValue([
      { userId: 'user1' },
    ]);

    await service.updateReferralStreaks();

    expect(referralStore.increaseStreak).toHaveBeenCalledWith('user1');
    expect(referralStore.resetStreak).not.toHaveBeenCalled();
  });

  it('если пригласил вчера, но не сегодня — инкремент', async () => {
    referralHistoryStore.getInvitersBetween.mockResolvedValue(['user2']);
    referralStore.getAll.mockResolvedValue([
      { userId: 'user2' },
    ]);

    await service.updateReferralStreaks();

    expect(referralStore.increaseStreak).toHaveBeenCalledWith('user2');
    expect(referralStore.resetStreak).not.toHaveBeenCalled();
  });

  it('если вчера и сегодня никого не пригласил — сброс', async () => {
    referralHistoryStore.getInvitersBetween.mockResolvedValue([]);
    referralStore.getAll.mockResolvedValue([
      { userId: 'user3' },
    ]);

    await service.updateReferralStreaks();

    expect(referralStore.increaseStreak).not.toHaveBeenCalled();
    expect(referralStore.resetStreak).toHaveBeenCalledWith('user3');
  });
});
