import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '@application/auth/events/impl/user-created.event';
import { ReferralService } from '@application/auth/services/referral.service';
import { LoggerService } from '@libs/logger/src/logger.service';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { UserStore } from '@infrastructure/stores/user.store';



@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly referralStore: ReferralStore,
    private readonly userStore: UserStore,
    private readonly referralService: ReferralService,
    private readonly logger: LoggerService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    const user = event.user;


    try {
      const referral = await this.referralStore.findByUserId(user.id);

      if (referral?.referred_by) {
        const inviter = await this.userStore.findById(referral.referred_by);
        if (!inviter) {
          this.logger.warn(`Inviter not found: ${referral.referred_by}`);
          return;
        }

        await this.referralService.applyReferralLogic(inviter, user);
        this.logger.debug(`Referral logic applied for user ${user.id}`);
      } else {
        this.logger.debug(`User ${user.id} has no referred_by value`);
      }
    } catch (error) {
      this.logger.error('Failed to handle UserCreatedEvent', error, {
        userId: user.id,
      });
    }
  }
}
