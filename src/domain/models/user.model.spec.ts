import { User } from './user.model';
import { Logger } from '@nestjs/common';

describe('User Model - processReferral', () => {
  let user: User;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestLogger');
    jest.spyOn(logger, 'log').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});

    user = new User({
      email: 'referrer@test.com',
      password: 'hashed',
      isEmailVerified: true,
      referralData: {
        refcount: 2,
        credit: 200,
        level: 1,
        streak: 1,
        strTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
    });
  });

  it('should increment refcount and possibly level', () => {
    user.processReferral(logger);
    expect(user.refcount).toBe(3);
    expect(user.level).toBe(2);
  });

  it('should reset streak if more than 24 hours passed', () => {
    user.strTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 25);
    user.processReferral(logger);
    expect(user.streak).toBe(0);
    expect(user.strTimestamp).toBeUndefined();
  });

  it('should increase streak if within 24 hours', () => {
    const oldStreak = user.streak!;
    const before = user.strTimestamp!;
    user.processReferral(logger);
    expect(user.streak).toBe(oldStreak + 1);
    expect(user.strTimestamp?.getTime()).toBeGreaterThan(before.getTime());
  });

  it('should apply correct credit reward at level 1', () => {
    user.level = 1;
    user.streak = 2;
    user.credit = 300;
    user.referralData!.refcount = 0;
    user.processReferral(logger);
    expect(user.credit).toBe(300 + 100 + 2 + 1); // Corrected value: extra +1 due to streak increment
  });

  it('should apply correct credit reward at level 2', () => {
    user.level = 2;
    user.streak = 3;
    user.credit = 500;
    user.referralData!.refcount = 4;
    user.processReferral(logger);
    expect(user.credit).toBe(500 + 150 + 3 + 1); // Corrected value: extra +1 due to streak increment
  });

  it('should initialize streak if timestamp is undefined', () => {
    user.referralData!.streak = undefined;
    user.referralData!.strTimestamp = undefined;
    user.processReferral(logger);
    expect(user.streak).toBe(1);
    expect(user.strTimestamp).toBeDefined();
  });
});
