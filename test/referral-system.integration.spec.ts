import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppModule } from '../src/app.module';
import { User } from '../src/domain/models/user.model';
import { UserStore } from '../src/infrastructure/stores/user.store';

describe('Referral System (Integration)', () => {
  let app: INestApplication;
  let connection: Connection;
  let userRepository: Repository<User>;
  let userStore: UserStore;

  let referrerUser: User;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'postgres'),
            database: configService.get('DB_DATABASE', 'hypetrain_test'),
            entities: [User],
            synchronize: true,
            dropSchema: true,
          }),
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userStore = moduleFixture.get(UserStore);
    connection = moduleFixture.get(Connection);
    userRepository = connection.getRepository(User);

    // Clear the database
    await userRepository.clear();

    // Create a referrer user
    referrerUser = await User.create(
      'referrer@example.com',
      'password123',
      'Referrer',
      'User',
    );
    referrerUser.generateReferralCode();
    await userStore.save(referrerUser);

    // Login and get JWT token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'referrer@example.com',
        password: 'password123',
      });

    jwtToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  describe('Registration with referral code', () => {
    it('should register a user with a valid referral code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'referred@example.com',
          password: 'password123',
          firstName: 'Referred',
          lastName: 'User',
          referralCode: referrerUser.referralCode,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('referralCode');
      expect(response.body.referredById).toBe(referrerUser.id);

      // Check that the referrer got an update
      const updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralCount).toBe(1);
      expect(updatedReferrer.referralStreak).toBe(1);
      expect(updatedReferrer.credits).toBeGreaterThanOrEqual(100);

      // Check that the referred user received credits
      const referredUser = await userStore.findById(response.body.id);
      expect(referredUser.credits).toBe(100);
    });

    it('should reject registration with a non-existent referral code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'badreferred@example.com',
          password: 'password123',
          firstName: 'Bad',
          lastName: 'Referred',
          referralCode: 'INVALIDCODE',
        });

      expect(response.status).toBe(201); // Registration is still successful
      expect(response.body).toHaveProperty('id');

      // Check that the user is registered, but without credits and referral link
      const user = await userStore.findById(response.body.id);
      expect(user.credits).toBe(0);
      expect(user.referredById).toBeNull();
    });
  });

  describe('Upgrading referrer level', () => {
    it('should increase referrer level after 3 invitations', async () => {
      // Create two more referred users (the third one was already created in the previous test)
      for (let i = 2; i <= 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `referred${i}@example.com`,
            password: 'password123',
            firstName: `Referred${i}`,
            lastName: 'User',
            referralCode: referrerUser.referralCode,
          });
      }

      // Check that the referrer's level has increased
      const updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralCount).toBe(3);
      expect(updatedReferrer.referralLevel).toBe(2);

      // The third invitation should give a bonus according to the formula for level 2
      expect(updatedReferrer.credits).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Referral streaks', () => {
    it('should increase streak with consecutive referrals', async () => {
      // Get current referrer
      let currentReferrer = await userStore.findById(referrerUser.id);
      const initialStreak = currentReferrer.referralStreak;

      // Simulate that the last invitation was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      currentReferrer.lastReferralDate = yesterday;
      await userStore.save(currentReferrer);

      // Make a new invitation
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'streak@example.com',
        password: 'password123',
        firstName: 'Streak',
        lastName: 'User',
        referralCode: referrerUser.referralCode,
      });

      // Check that the streak has increased
      currentReferrer = await userStore.findById(referrerUser.id);
      expect(currentReferrer.referralStreak).toBe(initialStreak + 1);
    });

    it('should correctly calculate bonus considering streak', async () => {
      // Get current referrer
      const currentReferrer = await userStore.findById(referrerUser.id);
      const currentCredits = currentReferrer.credits;
      const currentStreak = currentReferrer.referralStreak;

      // Simulate that the last invitation was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      currentReferrer.lastReferralDate = yesterday;
      await userStore.save(currentReferrer);

      // Make a new invitation
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'bonus@example.com',
        password: 'password123',
        firstName: 'Bonus',
        lastName: 'User',
        referralCode: referrerUser.referralCode,
      });

      // Check assigned credits
      const updatedReferrer = await userStore.findById(referrerUser.id);
      // For level 2: 150 base bonus + (currentStreak + 1) for streak
      const expectedBonus = 150 + (currentStreak + 1);

      expect(updatedReferrer.credits).toBe(currentCredits + expectedBonus);
    });
  });

  describe('Getting referral information', () => {
    it('should return a list of referred users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/referrals')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(5); // We created at least 5 referrals

      // Check data structure
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('referralCode');
    });

    it('should return current referral level and statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('referralCode');
      expect(response.body).toHaveProperty('referralLevel');
      expect(response.body).toHaveProperty('referralCount');
      expect(response.body).toHaveProperty('referralStreak');
      expect(response.body).toHaveProperty('credits');

      // Check values
      expect(response.body.referralLevel).toBe(2);
      expect(response.body.referralCount).toBeGreaterThanOrEqual(5);
      expect(response.body.credits).toBeGreaterThan(0);
    });
  });
});
