import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@web-api/modules/auth/auth.module';
import { LoggerModule } from '@libs/logger/src/logger.module';
import { User } from '@domain/models/user.model';
import { Workspace, WorkspaceMember } from '@domain/models/workspace.model';
import { DatabaseConfig } from '@infrastructure/database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TypeOrmModule.forFeature([User, Workspace, WorkspaceMember]),
    AuthModule,
  ],
})
export class AppModule {}
