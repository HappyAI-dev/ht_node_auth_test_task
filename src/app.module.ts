import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@web-api/modules/auth/auth.module';
import { LoggerModule } from '@libs/logger/src/logger.module';
import { User } from '../src/domain/models/user.model';
import { Workspace, WorkspaceMember } from '../src/domain/models/workspace.model';
import { DatabaseConfig } from '../src/infrastructure/database/database.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
