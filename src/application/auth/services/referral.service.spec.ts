import { Test, TestingModule } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';
import { UserStore } from '@infrastructure/stores/user.store';
import { Referral } from '@domain/models/referral.model';

const inviter = { id: 'inviter-id', credits: 200, referral_level: 1 };
const invitee = { id: 'invitee-id' };

const mockReferral = new Referral({
  id: 'referral-id',
  user_id: 'inviter-id',
  credits: 200,
  referral_level: 1,
  referral_streak: 0,
  referral_streak_updated_at: new Date(),
  referred_by: null,
});

const referral = mockReferral;

describe('ReferralService', () => {
  let service: ReferralService;
  let referralStore: ReferralStore;
  let referralHistoryStore: ReferralHistoryStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: ReferralStore,
          useValue: {
            findByUserId: jest.fn().mockResolvedValue(referral),
            updateReferralStats: jest.fn(),
          },
        },
        {
          provide: ReferralHistoryStore,
          useValue: {
            countByInviterId: jest.fn().mockResolvedValue(1),
            create: jest.fn(),
          },
        },
        {
          provide: UserStore,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    referralStore = module.get<ReferralStore>(ReferralStore);
    referralHistoryStore = module.get<ReferralHistoryStore>(ReferralHistoryStore);
  });

  it('начисляет 100 кредитов и не повышает уровень если <3 приглашений', async () => {
    jest.spyOn(referralHistoryStore, 'countByInviterId').mockResolvedValue(1);
    await service.applyReferralLogic(inviter as any, invitee as any);
    expect(referralStore.updateReferralStats).toHaveBeenCalledWith({
      userId: inviter.id,
      credits: 300, // 200 + 100
      referral_level: 1,
    });
    expect(referralHistoryStore.create).toHaveBeenCalledWith(inviter.id, invitee.id, expect.any(Date));
  });

  it('начисляет 150 кредитов и повышает уровень если >=3 приглашений', async () => {
    jest.spyOn(referralHistoryStore, 'countByInviterId').mockResolvedValue(2);
    const referralLevel2 = new Referral({
      id: 'referral-id',
      user_id: 'inviter-id',
      credits: 200,
      referral_level: 1,
      referral_streak: 0,
      referral_streak_updated_at: new Date(),
      referred_by: null,
    });
    jest.spyOn(referralStore, 'findByUserId').mockResolvedValue(referralLevel2);
    await service.applyReferralLogic(inviter as any, invitee as any);
    expect(referralStore.updateReferralStats).toHaveBeenCalledWith({
      userId: inviter.id,
      credits: 350, // 200 + 150
      referral_level: 2,
    });
    expect(referralHistoryStore.create).toHaveBeenCalledWith(inviter.id, invitee.id, expect.any(Date));
  });

  it('начисляет 150 кредитов если уже уровень 2', async () => {
    const referralL2 = new Referral({
      id: 'referral-id',
      user_id: 'inviter-id',
      credits: 500,
      referral_level: 2,
      referral_streak: 0,
      referral_streak_updated_at: new Date(),
      referred_by: null,
    });
    jest.spyOn(referralStore, 'findByUserId').mockResolvedValue(referralL2);
    await service.applyReferralLogic(inviter as any, invitee as any);
    expect(referralStore.updateReferralStats).toHaveBeenCalledWith({
      userId: inviter.id,
      credits: 650, // 500 + 150
      referral_level: 2,
    });
    expect(referralHistoryStore.create).toHaveBeenCalledWith(inviter.id, invitee.id, expect.any(Date));
  });

  it('кидает ошибку если нет referral профиля', async () => {
    jest.spyOn(referralStore, 'findByUserId').mockResolvedValue(null);
    await expect(service.applyReferralLogic(inviter as any, invitee as any)).rejects.toThrow();
  });
});
