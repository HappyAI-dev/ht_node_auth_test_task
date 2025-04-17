import { User } from './user.model';

describe('User Model', () => {
  describe('generateReferralCode', () => {
    it('should generate a unique referral code', () => {
      const user = new User();
      user.generateReferralCode();

      expect(user.referralCode).toBeDefined();
      expect(typeof user.referralCode).toBe('string');
      expect(user.referralCode?.length).toBe(8);
    });

    it('should not overwrite existing referral code', () => {
      const user = new User({ referralCode: 'EXISTCODE' });
      user.generateReferralCode();

      expect(user.referralCode).toBe('EXISTCODE');
    });
  });

  describe('addCredits', () => {
    it('should add credits to user balance', () => {
      const user = new User({ credits: 100 });
      user.addCredits(50);

      expect(user.credits).toBe(150);
    });
  });

  describe('incrementReferralCount', () => {
    it('should increase referral count by 1', () => {
      const user = new User({ referralCount: 1 });
      user.incrementReferralCount();

      expect(user.referralCount).toBe(2);
    });

    it('should not increase referral level if count is less than 3', () => {
      const user = new User({ referralLevel: 1, referralCount: 1 });
      user.incrementReferralCount();

      expect(user.referralCount).toBe(2);
      expect(user.referralLevel).toBe(1);
    });

    it('should increase referral level to 2 when count reaches 3', () => {
      const user = new User({ referralLevel: 1, referralCount: 2 });
      user.incrementReferralCount();

      expect(user.referralCount).toBe(3);
      expect(user.referralLevel).toBe(2);
    });

    it('should not change level if already at level 2 or higher', () => {
      const user = new User({ referralLevel: 2, referralCount: 5 });
      user.incrementReferralCount();

      expect(user.referralCount).toBe(6);
      expect(user.referralLevel).toBe(2);
    });
  });

  describe('updateReferralStreak', () => {
    it('should set streak to 1 for first referral', () => {
      const user = new User();
      const today = new Date();

      user.updateReferralStreak(today);

      expect(user.referralStreak).toBe(1);
      expect(user.lastReferralDate).toEqual(expect.any(Date));
    });

    it('should increment streak if referred on consecutive days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = new User({
        referralStreak: 3,
        lastReferralDate: yesterday,
      });

      user.updateReferralStreak(today);

      expect(user.referralStreak).toBe(4);
      expect(user.lastReferralDate).toEqual(today);
    });

    it('should reset streak if not referred on consecutive days', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const user = new User({
        referralStreak: 5,
        lastReferralDate: twoDaysAgo,
      });

      user.updateReferralStreak(today);

      expect(user.referralStreak).toBe(1);
      expect(user.lastReferralDate).toEqual(today);
    });

    it('should not change streak if referred on the same day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const laterToday = new Date(today);
      laterToday.setHours(12, 0, 0, 0);

      const user = new User({
        referralStreak: 3,
        lastReferralDate: today,
      });

      user.updateReferralStreak(laterToday);

      expect(user.referralStreak).toBe(3);
    });
  });

  describe('calculateReferralBonus', () => {
    it('should return 100 + streak for level 1', () => {
      const user = new User({
        referralLevel: 1,
        referralStreak: 2,
      });

      const bonus = user.calculateReferralBonus();

      expect(bonus).toBe(102);
    });

    it('should return 150 + streak for level 2', () => {
      const user = new User({
        referralLevel: 2,
        referralStreak: 3,
      });

      const bonus = user.calculateReferralBonus();

      expect(bonus).toBe(153);
    });
  });

  describe('create', () => {
    it('should create a user with generated referral code', async () => {
      const user = await User.create(
        'test@example.com',
        'password123',
        'Test',
        'User',
      );

      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.referralCode).toBeDefined();
      expect(user.referralLevel).toBe(1);
      expect(user.referralCount).toBe(0);
      expect(user.referralStreak).toBe(0);
      expect(user.credits).toBe(0);
    });

    it('should set referredById when creating with a referral', async () => {
      const referrerId = '12345678-1234-1234-1234-123456789012';
      const user = await User.create(
        'test@example.com',
        'password123',
        'Test',
        'User',
        referrerId,
      );

      expect(user.referredById).toBe(referrerId);
    });
  });

  describe('toJSON', () => {
    it('should include referral fields in JSON output', () => {
      const user = new User({
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        referralCode: 'CODE123',
        referralLevel: 2,
        referralCount: 5,
        referralStreak: 3,
        credits: 500,
      });

      const json = user.toJSON();

      expect(json.referralCode).toBe('CODE123');
      expect(json.referralLevel).toBe(2);
      expect(json.referralCount).toBe(5);
      expect(json.referralStreak).toBe(3);
      expect(json.credits).toBe(500);
    });
  });
});
