import { Test, TestingModule } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';
import { mock, mockReset } from 'jest-mock-extended';

// Mock UserStore
const mockUserStore = mock<UserStore>();

describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(async () => {
    // Reset mocks before each test
    mockReset(mockUserStore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  describe('processReferralCode', () => {
    it('should return false when no referral code is provided', async () => {
      const result = await service.processReferralCode(new User(), undefined);
      expect(result).toBe(false);
    });

    it('should return false when referral code is not found', async () => {
      mockUserStore.findByReferralCode.mockResolvedValue(null);

      const result = await service.processReferralCode(new User(), 'INVALID');

      expect(mockUserStore.findByReferralCode).toHaveBeenCalledWith('INVALID');
      expect(result).toBe(false);
    });

    it('should return false when user tries to use their own referral code', async () => {
      const referrer = new User({ id: '123' });
      const referredUser = new User({ id: '123' });

      mockUserStore.findByReferralCode.mockResolvedValue(referrer);

      const result = await service.processReferralCode(referredUser, 'CODE123');

      expect(result).toBe(false);
    });

    it('should process referral code successfully', async () => {
      const referrer = new User({
        id: '123',
        referralLevel: 1,
        referralCount: 0,
      });
      const referredUser = new User({ id: '456' });

      mockUserStore.findByReferralCode.mockResolvedValue(referrer);
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      const processReferralBonusSpy = jest
        .spyOn(service, 'processReferralBonus')
        .mockResolvedValue();

      const result = await service.processReferralCode(referredUser, 'CODE123');

      expect(referredUser.referredById).toBe('123');
      expect(processReferralBonusSpy).toHaveBeenCalledWith(
        referrer,
        referredUser,
      );
      expect(mockUserStore.save).toHaveBeenCalledWith(referredUser);
      expect(result).toBe(true);
    });
  });

  describe('processReferralBonus', () => {
    it('should calculate and add credits correctly - Level 1', async () => {
      const referrer = new User({
        id: '123',
        referralLevel: 1,
        referralCount: 0,
        referralStreak: 0,
        credits: 0,
      });

      const referredUser = new User({ id: '456', credits: 0 });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.processReferralBonus(referrer, referredUser);

      // Check that referralCount was incremented
      expect(referrer.referralCount).toBe(1);

      // Check credited amount (100 for level 1 + 1 for streak)
      expect(referrer.credits).toBe(101);
      expect(referredUser.credits).toBe(100);

      // Verify both users were saved
      expect(mockUserStore.save).toHaveBeenCalledWith(referrer);
      expect(mockUserStore.save).toHaveBeenCalledWith(referredUser);
    });

    it('should update referral level when count reaches 3', async () => {
      const referrer = new User({
        id: '123',
        referralLevel: 1,
        referralCount: 2,
        referralStreak: 0,
        credits: 0,
      });

      const referredUser = new User({ id: '456', credits: 0 });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.processReferralBonus(referrer, referredUser);

      // Check that after 3rd referral the level increased
      expect(referrer.referralCount).toBe(3);
      expect(referrer.referralLevel).toBe(2);
    });

    it('should calculate bonus correctly for level 2', async () => {
      const referrer = new User({
        id: '123',
        referralLevel: 2,
        referralCount: 3,
        referralStreak: 2,
        credits: 0,
      });

      const referredUser = new User({ id: '456', credits: 0 });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.processReferralBonus(referrer, referredUser);

      // Credits should be 150 (level 2) + 2 (current streak, not incremented)
      expect(referrer.credits).toBe(151);
    });
  });

  describe('updateReferralStreaks', () => {
    it('should reset streak for users who did not refer yesterday', async () => {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      const user1 = new User({
        id: '123',
        referralStreak: 5,
        lastReferralDate: twoDaysAgo,
      });

      mockUserStore.findUsersWithStreak.mockResolvedValue([user1]);
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.updateReferralStreaks();

      expect(user1.referralStreak).toBe(0);
      expect(mockUserStore.save).toHaveBeenCalledWith(user1);
    });

    it('should not reset streak for users who referred yesterday', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const user1 = new User({
        id: '123',
        referralStreak: 5,
        lastReferralDate: yesterday,
      });

      mockUserStore.findUsersWithStreak.mockResolvedValue([user1]);

      await service.updateReferralStreaks();

      expect(user1.referralStreak).toBe(5);
      expect(mockUserStore.save).not.toHaveBeenCalled();
    });
  });
});
