import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './auth.controller';
import { User } from '@domain/models/user.model';
import { Workspace, WorkspaceMember } from '@domain/models/workspace.model';
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy';
import { UserStore } from '@infrastructure/stores/user.store';
import { WorkspaceStore } from '@infrastructure/stores/workspace.store';
import { LoggerModule } from '@libs/logger/src/logger.module';
import { AuthService } from '@application/auth/services/auth.service';
import { ReferralService } from '@application/auth/services/referral.service';
import { ReferralStreakScheduler } from '@infrastructure/schedulers/referral-streak.scheduler';

// Command Handlers
import { RegisterUserHandler } from '@application/auth/commands/handlers/register-user.handler';
import { LoginUserHandler } from '@application/auth/commands/handlers/login-user.handler';

// Query Handlers
import { GetUserProfileHandler } from '@application/auth/queries/handlers/get-user-profile.handler';

// Event Handlers
import { EmailNotificationHandler } from '@application/auth/events/handlers/email-notification.handler';
import {
  UserCreatedAuditHandler,
  UserLoggedInAuditHandler,
} from '@application/auth/events/handlers/audit-log.handler';

const CommandHandlers = [RegisterUserHandler, LoginUserHandler];
const QueryHandlers = [GetUserProfileHandler];
const EventHandlers = [
  EmailNotificationHandler,
  UserCreatedAuditHandler,
  UserLoggedInAuditHandler,
];

@Module({
  imports: [
    CqrsModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ReferralService,
    ReferralStreakScheduler,
    JwtStrategy,
    UserStore,
    WorkspaceStore,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class AuthModule {}
