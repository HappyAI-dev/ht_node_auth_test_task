import { IEvent } from '@nestjs/cqrs';
import { User } from '@domain/models/user.model';

export class WorkspaceCreationRequiredEvent implements IEvent {
  constructor(public readonly user: User) {}
}
