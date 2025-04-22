// src/infrastructure/database/data-source.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from '../../domain/models/user.model';
import { Workspace, WorkspaceMember } from '../../domain/models/workspace.model';
import { Referral, ReferralHistory } from '../../domain/models/referral.model';






export const AppDataSource = new DataSource({


  type: 'postgres',
  host: process.env.DB_HOST_FOR_MIGREATION,
  port: Number(process.env.DB_PORT_FOR_MIGREATION),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Workspace, WorkspaceMember, Referral, ReferralHistory],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
});