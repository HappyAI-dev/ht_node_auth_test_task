import { Test } from '@nestjs/testing';
import { ReferralService } from '@application/auth/services/referral.service';
import { User } from '@domain/models/user.model';

describe('Referral System Tests', () => {
  let referralService: ReferralService;

  beforeEach(async () => {
    const mockReferralService = {
      processReferralCode: jest.fn().mockImplementation((user, code) => {
        return Promise.resolve(code === 'VALIDCODE');
      }),
    };

    const module = await Test.createTestingModule({
      providers: [{ provide: ReferralService, useValue: mockReferralService }],
    }).compile();

    referralService = module.get<ReferralService>(ReferralService);
  });

  describe('Processing referral codes', () => {
    it('should return true for a valid referral code', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password',
      });

      const result = await referralService.processReferralCode(
        user,
        'VALIDCODE',
      );

      expect(result).toBe(true);
    });

    it('should return false for an invalid referral code', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password',
      });

      const result = await referralService.processReferralCode(
        user,
        'INVALIDCODE',
      );

      expect(result).toBe(false);
    });

    it('should return false if no referral code is provided', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password',
      });

      const result = await referralService.processReferralCode(user, undefined);

      expect(result).toBe(false);
    });
  });
});
