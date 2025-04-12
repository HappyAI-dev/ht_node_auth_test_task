import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException, Logger } from '@nestjs/common';
import { GetUserProfileQuery } from '../impl/get-user-profile.query';
import { UserStore } from '../../../../infrastructure/stores/user.store';
import { User } from '../../../../domain/models/user.model';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery> {
  private readonly logger = new Logger(GetUserProfileHandler.name);

  constructor(
    private readonly userStore: UserStore,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<Partial<User>> {
    this.logger.debug(`Fetching user profile for ID: ${query.userId}`);

    const user = await this.userStore.findById(query.userId);

    if (!user) {
      this.logger.warn(`User not found with ID: ${query.userId}`);
      throw new NotFoundException(`User with ID ${query.userId} not found`);
    }

    this.logger.debug(`Successfully retrieved user profile for ID: ${query.userId}`);
    return user.toJSON();
  }
}
