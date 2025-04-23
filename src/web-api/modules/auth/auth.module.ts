import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { User } from '@domain/models/user.model';
import { Workspace, WorkspaceMember } from '@domain/models/workspace.model';
import { Referral, ReferralHistory } from '@domain/models/referral.model';
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy';
import { UserStore } from '@infrastructure/stores/user.store';
import { WorkspaceStore } from '@infrastructure/stores/workspace.store';
import { LoggerModule } from '@libs/logger/src/logger.module';
import { AuthService } from '@application/auth/services/auth.service';
import { ReferralHistoryStore } from '@infrastructure/stores/referralHistory.store';
import { ReferralStore } from '@infrastructure/stores/referral.store';
import { ReferralService } from '@application/auth/services/referral.service';


// Command Handlers
import { RegisterUserHandler } from '@application/auth/commands/handlers/register-user.handler';
import { LoginUserHandler } from '@application/auth/commands/handlers/login-user.handler';

// Query Handlers
import { GetUserProfileHandler } from '@application/auth/queries/handlers/get-user-profile.handler';

// Event Handlers
import { EmailNotificationHandler } from '@application/auth/events/handlers/email-notification.handler';
import { UserCreatedAuditHandler, UserLoggedInAuditHandler } from '@application/auth/events/handlers/audit-log.handler';

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
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember, Referral, ReferralHistory]),
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
    JwtStrategy,
    UserStore,
    WorkspaceStore,
    ReferralService,
    ReferralStore,
    ReferralHistoryStore,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [AuthService, JwtStrategy, UserStore, WorkspaceStore, ReferralService, ReferralStore, ReferralHistoryStore],
})
export class AuthModule {}
