import { DataSource } from 'typeorm';
import { User } from '../../domain/models/user.model';
import { Workspace, WorkspaceMember } from '../..//domain/models/workspace.model';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'ht_auth',
  entities: [User, Workspace, WorkspaceMember],
  migrations: [
    './src/infrastructure/database/migrations/*.ts',    
  ],
  synchronize: false, 
  logging: true,
});
