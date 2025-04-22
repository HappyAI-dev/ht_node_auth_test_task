import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@web-api/modules/auth/auth.module';
import { LoggerModule } from '@libs/logger/src/logger.module';
import { User } from '@domain/models/user.model';
import { Workspace, WorkspaceMember } from '@domain/models/workspace.model';
import { DatabaseConfig } from '@infrastructure/database/database.config';
import { Referral, ReferralHistory } from '@domain/models/referral.model';
import { ReferralModule } from '@web-api/modules/referral/referral.module';
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreatedEventHandler } from '@application/auth/events/handlers/user-created.handler';

@Module({
  imports: [
    CqrsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember, Referral, ReferralHistory]),
    AuthModule,
    ReferralModule,
  ],
  providers: [UserCreatedEventHandler],
})
export class AppModule {}
