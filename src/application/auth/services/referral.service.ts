import { Injectable, Logger } from '@nestjs/common';
import { UserStore } from '@infrastructure/stores/user.store';
import { User } from '@domain/models/user.model';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly userStore: UserStore) {}

  /**
   * Обрабатывает реферальный код при регистрации нового пользователя
   * @param referredUser - новый пользователь, который был приглашен
   * @param referralCode - реферальный код пригласившего пользователя
   * @returns возвращает true если код успешно обработан, иначе false
   */
  async processReferralCode(
    referredUser: User,
    referralCode?: string,
  ): Promise<boolean> {
    if (!referralCode) {
      return false;
    }

    try {
      // Находим пригласившего пользователя по реферальному коду
      const referrer = await this.userStore.findByReferralCode(referralCode);
      if (!referrer) {
        this.logger.warn(`Referral code ${referralCode} not found`);
        return false;
      }

      // Если пользователь пытается использовать свой код
      if (referrer.id === referredUser.id) {
        this.logger.warn(
          `User ${referredUser.id} tried to use their own referral code`,
        );
        return false;
      }

      // Обновляем поле referred_by_id у нового пользователя
      referredUser.referredById = referrer.id;
      await this.userStore.save(referredUser);

      // Начисляем бонусы обоим пользователям
      await this.processReferralBonus(referrer, referredUser);
      return true;
    } catch (error) {
      this.logger.error(
        `Error processing referral code: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Начисляет бонусы пригласившему и приглашенному пользователям
   * @param referrer - пригласивший пользователь
   * @param referredUser - приглашенный пользователь
   */
  async processReferralBonus(
    referrer: User,
    referredUser: User,
  ): Promise<void> {
    try {
      // Обновляем статистику пригласившего пользователя
      referrer.incrementReferralCount();
      referrer.updateReferralStreak(new Date());

      // Рассчитываем бонус
      const referrerBonus = referrer.calculateReferralBonus();
      const referredBonus = 100; // Приглашенный всегда получает 100 кредитов

      // Начисляем бонусы
      referrer.addCredits(referrerBonus);
      referredUser.addCredits(referredBonus);

      // Сохраняем пользователей
      await this.userStore.save(referrer);
      await this.userStore.save(referredUser);

      this.logger.log(
        `Referral bonus processed: Referrer ${referrer.id} got ${referrerBonus} credits, ` +
          `Referred user ${referredUser.id} got ${referredBonus} credits`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing referral bonus: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Проверяет и обновляет реферальные стрики пользователей
   * Предполагается вызов этой функции через планировщик задач
   */
  async updateReferralStreaks(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Получаем всех пользователей с ненулевым стриком
      const usersWithStreak = await this.userStore.findUsersWithStreak();

      for (const user of usersWithStreak) {
        if (!user.lastReferralDate) continue;

        const lastReferralDate = new Date(user.lastReferralDate);
        lastReferralDate.setHours(0, 0, 0, 0);

        // Проверяем, был ли стрик вчера
        const isLastReferralYesterday =
          lastReferralDate.getTime() === yesterday.getTime();

        if (!isLastReferralYesterday) {
          // Сбрасываем стрик, если пользователь не пригласил никого вчера
          user.referralStreak = 0;
          await this.userStore.save(user);

          this.logger.debug(`Reset streak for user ${user.id}`);
        }
      }

      this.logger.log(
        `Updated referral streaks for ${usersWithStreak.length} users`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating referral streaks: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
