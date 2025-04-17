import { Test, TestingModule } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';
import { mock, mockReset } from 'jest-mock-extended';

// Mock UserStore class
const mockUserStore = mock<UserStore>();

describe('ReferralService - Referral Levels', () => {
  let service: ReferralService;

  beforeEach(async () => {
    // Reset mock state before each test
    mockReset(mockUserStore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  describe('Processing levels and streaks', () => {
    it('should only increase level after 3 referrals', async () => {
      // User with level 1 and 2 referrals
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 1,
        referralCount: 2,
        credits: 0,
      });

      // New referred user
      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
      });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      // Process bonus - this should be the 3rd referral
      await service.processReferralBonus(referrer, referred);

      // Expect level to be increased
      expect(referrer.referralLevel).toBe(2);
      expect(referrer.referralCount).toBe(3);
    });

    it('should not increase level above 2', async () => {
      // User with level 2 and 3 referrals
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 2,
        referralCount: 3,
        credits: 0,
      });

      // New referred user
      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
      });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      // Process bonus - this will be the 4th referral
      await service.processReferralBonus(referrer, referred);

      // Expect level to remain at 2
      expect(referrer.referralLevel).toBe(2);
      expect(referrer.referralCount).toBe(4);
    });

    it('should correctly calculate bonuses for level 1', async () => {
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 1,
        referralCount: 1,
        referralStreak: 3,
        credits: 0,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.processReferralBonus(referrer, referred);

      // Base bonus 100 + streak 3 (current streak, not incremented)
      expect(referrer.credits).toBe(101);
      expect(referred.credits).toBe(100);
    });

    it('should correctly calculate bonuses for level 2', async () => {
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 2,
        referralCount: 3,
        referralStreak: 5,
        credits: 0,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.processReferralBonus(referrer, referred);

      // Base bonus 150 + streak 5 (current streak, not incremented)
      expect(referrer.credits).toBe(151);
      expect(referred.credits).toBe(100);
    });
  });

  describe('Processing streaks', () => {
    it('should start streak at 1 for first referral', async () => {
      const user = new User({
        id: '1',
        email: 'user@example.com',
        password: 'hash',
        referralStreak: 0,
        lastReferralDate: undefined,
      });

      user.updateReferralStreak(new Date());

      expect(user.referralStreak).toBe(1);
      expect(user.lastReferralDate).toBeDefined();
    });

    it('should increase streak for referrals on consecutive days', async () => {
      // Create yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const user = new User({
        id: '1',
        email: 'user@example.com',
        password: 'hash',
        referralStreak: 2,
        lastReferralDate: yesterday,
      });

      // Today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      user.updateReferralStreak(today);

      expect(user.referralStreak).toBe(3);
      expect(user.lastReferralDate).toEqual(today);
    });

    it('should reset streak when a day is skipped', async () => {
      // Create date from two days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const user = new User({
        id: '1',
        email: 'user@example.com',
        password: 'hash',
        referralStreak: 5,
        lastReferralDate: twoDaysAgo,
      });

      // Today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      user.updateReferralStreak(today);

      expect(user.referralStreak).toBe(1); // Streak reset and started over
      expect(user.lastReferralDate).toEqual(today);
    });

    it('should maintain streak for referrals on the same day', async () => {
      // Create today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = new User({
        id: '1',
        email: 'user@example.com',
        password: 'hash',
        referralStreak: 3,
        lastReferralDate: today,
      });

      // Later referral on the same day
      const laterToday = new Date(today);
      laterToday.setHours(14, 30, 0, 0);

      user.updateReferralStreak(laterToday);

      expect(user.referralStreak).toBe(3); // Streak doesn't change
      expect(user.lastReferralDate).toEqual(today);
    });
  });

  describe('Periodic streak checks', () => {
    it("should reset streaks for users who didn't refer yesterday", async () => {
      // Create date from two days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      // User who didn't refer yesterday
      const user1 = new User({
        id: '1',
        email: 'user1@example.com',
        password: 'hash',
        referralStreak: 5,
        lastReferralDate: twoDaysAgo,
      });

      // Return list of users with non-zero streak
      mockUserStore.findUsersWithStreak.mockResolvedValue([user1]);
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.updateReferralStreaks();

      // Check that streak was reset
      expect(user1.referralStreak).toBe(0);
      expect(mockUserStore.save).toHaveBeenCalledWith(user1);
    });

    it('should not reset streaks for users who referred yesterday', async () => {
      // Create yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // User who referred yesterday
      const user1 = new User({
        id: '1',
        email: 'user1@example.com',
        password: 'hash',
        referralStreak: 5,
        lastReferralDate: yesterday,
      });

      // Return list of users with non-zero streak
      mockUserStore.findUsersWithStreak.mockResolvedValue([user1]);

      await service.updateReferralStreaks();

      // Check that streak didn't change
      expect(user1.referralStreak).toBe(5);
      expect(mockUserStore.save).not.toHaveBeenCalled();
    });
  });
});
