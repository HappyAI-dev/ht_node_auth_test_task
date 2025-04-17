import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferralFields1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем поля реферальной системы
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR UNIQUE,
      ADD COLUMN IF NOT EXISTS "referred_by_id" UUID,
      ADD COLUMN IF NOT EXISTS "referral_level" INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "referral_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "referral_streak" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "last_referral_date" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "credits" INTEGER NOT NULL DEFAULT 0
    `);

    // Добавляем внешний ключ для поля referred_by_id
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_referred_by" 
      FOREIGN KEY ("referred_by_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    // Создаем индекс для ускорения поиска по referred_by_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_referred_by" 
      ON "users" ("referred_by_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем индекс
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_referred_by"
    `);

    // Удаляем внешний ключ
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT IF EXISTS "FK_users_referred_by"
    `);

    // Удаляем поля
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "referral_code",
      DROP COLUMN IF EXISTS "referred_by_id",
      DROP COLUMN IF EXISTS "referral_level",
      DROP COLUMN IF EXISTS "referral_count",
      DROP COLUMN IF EXISTS "referral_streak",
      DROP COLUMN IF EXISTS "last_referral_date",
      DROP COLUMN IF EXISTS "credits"
    `);
  }
}
