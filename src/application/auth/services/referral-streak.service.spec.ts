import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ReferralService } from './referral.service';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';
import { mock, mockReset } from 'jest-mock-extended';

// Мокируем классы
const mockUserStore = mock<UserStore>();
const mockSchedulerRegistry = mock<SchedulerRegistry>();

describe('ReferralService - Стрики рефералов', () => {
  let service: ReferralService;

  beforeEach(async () => {
    // Сбрасываем состояние моков перед каждым тестом
    mockReset(mockUserStore);
    mockReset(mockSchedulerRegistry);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: UserStore, useValue: mockUserStore },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  describe('updateReferralStreaks', () => {
    it('должен сбрасывать стрики для пользователей с устаревшими датами', async () => {
      // Создаем пользователей с разными датами последнего приглашения
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const user1 = new User({
        id: '1',
        email: 'user1@example.com',
        password: 'hash',
        referralStreak: 5,
        lastReferralDate: twoDaysAgo,
      });

      const user2 = new User({
        id: '2',
        email: 'user2@example.com',
        password: 'hash',
        referralStreak: 3,
        lastReferralDate: yesterday,
      });

      const user3 = new User({
        id: '3',
        email: 'user3@example.com',
        password: 'hash',
        referralStreak: 7,
        lastReferralDate: threeDaysAgo,
      });

      // Мокаем, чтобы вернуть этих пользователей
      mockUserStore.findUsersWithStreak.mockResolvedValue([
        user1,
        user2,
        user3,
      ]);
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      // Вызываем метод обновления стриков
      await service.updateReferralStreaks();

      // Проверяем, что только пользователи с датой приглашения не вчера
      // получили сброс стрика
      expect(user1.referralStreak).toBe(0);
      expect(user2.referralStreak).toBe(3); // Этот не должен сброситься
      expect(user3.referralStreak).toBe(0);

      // Проверяем, что save был вызван только для 2 пользователей
      expect(mockUserStore.save).toHaveBeenCalledTimes(2);
      expect(mockUserStore.save).toHaveBeenCalledWith(user1);
      expect(mockUserStore.save).toHaveBeenCalledWith(user3);
    });

    it('не должен вызывать save, если нет пользователей со стриками', async () => {
      // Мокаем пустой массив
      mockUserStore.findUsersWithStreak.mockResolvedValue([]);

      await service.updateReferralStreaks();

      // Проверяем, что save не вызывался
      expect(mockUserStore.save).not.toHaveBeenCalled();
    });

    it('должен корректно обрабатывать пользователей без даты последнего приглашения', async () => {
      // Пользователь с ненулевым стриком, но без даты
      const user = new User({
        id: '1',
        email: 'user@example.com',
        password: 'hash',
        referralStreak: 2,
        lastReferralDate: undefined,
      });

      mockUserStore.findUsersWithStreak.mockResolvedValue([user]);
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );

      await service.updateReferralStreaks();

      // Такие пользователи должны быть пропущены
      expect(mockUserStore.save).not.toHaveBeenCalled();
    });
  });

  describe('processReferralBonus', () => {
    beforeEach(() => {
      mockUserStore.save.mockImplementation((user) =>
        Promise.resolve(user as User),
      );
    });

    it('должен корректно обрабатывать и обновлять стрик', async () => {
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 1,
        referralCount: 0,
        referralStreak: 0,
        lastReferralDate: undefined,
        credits: 0,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      await service.processReferralBonus(referrer, referred);

      // Проверяем инкремент стрика при первом приглашении
      expect(referrer.referralStreak).toBe(1);
      expect(referrer.lastReferralDate).toBeDefined();
    });

    it('должен увеличивать стрик при последовательных приглашениях', async () => {
      // Устанавливаем дату последнего приглашения на вчера
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 1,
        referralCount: 1,
        referralStreak: 2,
        lastReferralDate: yesterday,
        credits: 100,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      await service.processReferralBonus(referrer, referred);

      // Стрик должен увеличиться до 3
      expect(referrer.referralStreak).toBe(3);
      expect(referrer.lastReferralDate.getDate()).toBe(new Date().getDate());
    });

    it('должен сбрасывать стрик при пропуске дня', async () => {
      // Устанавливаем дату последнего приглашения на позавчера
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 1,
        referralCount: 1,
        referralStreak: 5, // Большой стрик
        lastReferralDate: twoDaysAgo,
        credits: 100,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      await service.processReferralBonus(referrer, referred);

      // Стрик должен сброситься до 1
      expect(referrer.referralStreak).toBe(1);
      expect(referrer.lastReferralDate.getDate()).toBe(new Date().getDate());
    });

    it('должен корректно начислять бонусы, базируясь на уровне и стрике', async () => {
      const referrer = new User({
        id: '1',
        email: 'referrer@example.com',
        password: 'hash',
        referralLevel: 2, // Уровень 2
        referralCount: 3,
        referralStreak: 4, // Стрик 4
        lastReferralDate: new Date(), // Сегодня уже было приглашение
        credits: 0,
      });

      const referred = new User({
        id: '2',
        email: 'referred@example.com',
        password: 'hash',
        credits: 0,
      });

      await service.processReferralBonus(referrer, referred);

      // Базовый бонус 150 (уровень 2) + 4 (стрик не меняется)
      expect(referrer.credits).toBe(154);
      // Приглашенный всегда получает 100
      expect(referred.credits).toBe(100);
    });
  });
});
