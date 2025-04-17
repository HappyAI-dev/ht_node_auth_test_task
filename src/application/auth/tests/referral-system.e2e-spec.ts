import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { User } from '@domain/models/user.model';
import { AuthModule } from '@application/auth/auth.module';
import { UserStore } from '@infrastructure/stores/user.store';

describe('Referral System (e2e)', () => {
  let app: INestApplication;
  let userStore: UserStore;
  let userRepository: Repository<User>;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
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
        TypeOrmModule.forFeature([User]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET', 'test-secret'),
            signOptions: {
              expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
            },
          }),
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    userStore = moduleFixture.get(UserStore);

    await app.init();

    // Очищаем базу данных перед тестами
    await userRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Регистрация и реферальная система', () => {
    let referrerUser: User;
    let referrerCode: string;

    beforeEach(async () => {
      // Очищаем базу данных перед каждым тестом
      await userRepository.clear();

      // Создаем пользователя-реферера
      referrerUser = await User.create(
        'referrer@example.com',
        'password123',
        'Referrer',
        'User',
      );
      referrerUser.generateReferralCode();
      referrerCode = referrerUser.referralCode;
      await userStore.save(referrerUser);

      // Получаем JWT токен для авторизации
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'referrer@example.com',
          password: 'password123',
        });

      jwtToken = loginResponse.body.accessToken;
    });

    it('должен регистрировать нового пользователя без реферального кода', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('referralCode');
      expect(response.body.referralLevel).toBe(1);
      expect(response.body.referralCount).toBe(0);
      expect(response.body.credits).toBe(0);
      expect(response.body.referredById).toBeNull();
    });

    it('должен регистрировать нового пользователя с реферальным кодом', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'referred@example.com',
          password: 'password123',
          firstName: 'Referred',
          lastName: 'User',
          referralCode: referrerCode,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('referralCode');
      expect(response.body.referralLevel).toBe(1);
      expect(response.body.referralCount).toBe(0);
      expect(response.body.credits).toBe(100); // Приглашенный получает 100 кредитов
      expect(response.body.referredById).toBe(referrerUser.id);

      // Проверяем, что реферер получил обновление статистики
      const updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralCount).toBe(1);
      expect(updatedReferrer.referralStreak).toBe(1);
      expect(updatedReferrer.credits).toBeGreaterThanOrEqual(100); // Реферер получает минимум 100 кредитов
    });

    it('должен отклонить регистрацию с несуществующим реферальным кодом', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'badreferred@example.com',
          password: 'password123',
          firstName: 'Bad',
          lastName: 'Referred',
          referralCode: 'INVALIDCODE',
        });

      expect(response.status).toBe(201); // Регистрация все равно успешна
      expect(response.body).toHaveProperty('id');
      expect(response.body.credits).toBe(0); // Но кредиты не начисляются
      expect(response.body.referredById).toBeNull(); // И нет связи с реферером
    });

    it('должен повысить уровень реферера после 3-х приглашений', async () => {
      // Приглашаем трех пользователей
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `referred${i}@example.com`,
            password: 'password123',
            firstName: `Referred${i}`,
            lastName: 'User',
            referralCode: referrerCode,
          });
      }

      // Проверяем, что реферер получил повышение уровня
      const updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralCount).toBe(3);
      expect(updatedReferrer.referralLevel).toBe(2);
    });

    it('должен увеличивать стрик при ежедневных приглашениях', async () => {
      // Первое приглашение
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'day1@example.com',
        password: 'password123',
        firstName: 'Day1',
        lastName: 'User',
        referralCode: referrerCode,
      });

      let updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralStreak).toBe(1);

      // Имитируем следующий день
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      updatedReferrer.lastReferralDate = yesterday;
      await userStore.save(updatedReferrer);

      // Второе приглашение "на следующий день"
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'day2@example.com',
        password: 'password123',
        firstName: 'Day2',
        lastName: 'User',
        referralCode: referrerCode,
      });

      updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralStreak).toBe(2);
    });

    it('должен сбрасывать стрик при пропуске дня', async () => {
      // Первое приглашение
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'streak1@example.com',
        password: 'password123',
        firstName: 'Streak1',
        lastName: 'User',
        referralCode: referrerCode,
      });

      let updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralStreak).toBe(1);

      // Имитируем пропуск дня (2 дня назад)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      updatedReferrer.lastReferralDate = twoDaysAgo;
      await userStore.save(updatedReferrer);

      // Новое приглашение "через день"
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'streak2@example.com',
        password: 'password123',
        firstName: 'Streak2',
        lastName: 'User',
        referralCode: referrerCode,
      });

      updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.referralStreak).toBe(1); // Стрик сбросился до 1
    });

    it('должен рассчитывать бонус в зависимости от уровня и стрика', async () => {
      // Устанавливаем высокий уровень и стрик
      referrerUser.referralLevel = 2;
      referrerUser.referralStreak = 5;
      referrerUser.credits = 0;
      await userStore.save(referrerUser);

      // Приглашаем нового пользователя
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'bonus@example.com',
        password: 'password123',
        firstName: 'Bonus',
        lastName: 'User',
        referralCode: referrerCode,
      });

      const updatedReferrer = await userStore.findById(referrerUser.id);
      expect(updatedReferrer.credits).toBe(156); // 150 (уровень 2) + 6 (стрик)
    });

    it('должен показывать корректную информацию о реферальной системе в профиле', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('referralCode');
      expect(response.body).toHaveProperty('referralLevel');
      expect(response.body).toHaveProperty('referralCount');
      expect(response.body).toHaveProperty('referralStreak');
      expect(response.body).toHaveProperty('credits');
    });
  });
});
