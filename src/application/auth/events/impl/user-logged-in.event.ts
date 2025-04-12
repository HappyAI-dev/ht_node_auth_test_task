import { IEvent } from '../../../../../libs/shared/src/lib/cqrs/interfaces';

export class UserLoggedInEvent implements IEvent {
  readonly type = 'UserLoggedInEvent';
  readonly timestamp: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    this.timestamp = new Date();
  }
}
