import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';
import { UserStore } from '@infrastructure/stores/user.store';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';




describe('AuthService (registration with referral)', () => {
  let service: AuthService;
  let referralStore: ReferralStore;
  let referralHistoryStore: ReferralHistoryStore;
  let userStore: UserStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ReferralStore,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn().mockResolvedValue(null), // no referral yet
            updateReferralStats: jest.fn(),
          },
        },
        {
          provide: ReferralHistoryStore,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: UserStore,
          useValue: {
            findByReferralCode: jest.fn().mockResolvedValue({ id: 'inviter-id' }),
            save: jest.fn().mockImplementation(user => Promise.resolve({ ...user, id: 'new-user-id', email: user.email || 'newuser@example.com' })),
            exists: jest.fn().mockResolvedValue(false),
            existsByReferralCode: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(fn => fn({})), // mock transaction to just call the function
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    referralStore = module.get<ReferralStore>(ReferralStore);
    referralHistoryStore = module.get<ReferralHistoryStore>(ReferralHistoryStore);
    userStore = module.get<UserStore>(UserStore);
  });

  it('creates ReferralHistory and awards credits on registration with referral code', async () => {
    // Arrange
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password',
      firstName: 'First',
      lastName: 'Last',
      referral_code: 'REFCODE123',
    };

    // Act
    await service.register(registerDto);

    // Assert
    expect(referralStore.create).toHaveBeenCalled(); // Referral created for invitee
    expect(referralHistoryStore.create).toHaveBeenCalled(); // ReferralHistory created
    expect(referralStore.updateReferralStats).toHaveBeenCalled(); // Credits awarded
  });
});
