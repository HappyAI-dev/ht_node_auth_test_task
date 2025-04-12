import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { User } from '@domain/models/user.model';
import { Workspace, WorkspaceMember } from '@domain/models/workspace.model';
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy';
import { UserStore } from '@infrastructure/stores/user.store';
import { WorkspaceStore } from '@infrastructure/stores/workspace.store';
import { LoggerModule } from '@libs/logger/src/logger.module';

// Command Handlers
import { RegisterUserHandler } from '@application/auth/commands/handlers/register-user.handler';
import { LoginUserHandler } from '@application/auth/commands/handlers/login-user.handler';

// Query Handlers
import { GetUserProfileHandler } from '@application/auth/queries/handlers/get-user-profile.handler';

// Event Handlers
import { EmailNotificationHandler } from '@application/auth/events/handlers/email-notification.handler';
import { WorkspaceCreationHandler } from '@application/auth/events/handlers/workspace-creation.handler';
import { UserCreatedAuditHandler, UserLoggedInAuditHandler } from '@application/auth/events/handlers/audit-log.handler';

const CommandHandlers = [RegisterUserHandler, LoginUserHandler];
const QueryHandlers = [GetUserProfileHandler];
const EventHandlers = [
  EmailNotificationHandler,
  WorkspaceCreationHandler,
  UserCreatedAuditHandler,
  UserLoggedInAuditHandler,
];

@Module({
  imports: [
    CqrsModule,
    LoggerModule,
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserStore,
    WorkspaceStore,
    JwtStrategy,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class AuthModule {}
