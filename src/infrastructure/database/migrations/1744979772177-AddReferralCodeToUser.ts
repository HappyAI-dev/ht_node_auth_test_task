import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferralCodeToUser1744977721533 implements MigrationInterface {
  name = 'AddReferralCodeToUser1744977721533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Добавить колонку (nullable — чтобы сначала заполнить)
    await queryRunner.query(`
      ALTER TABLE "users" ADD "referral_code" character varying
    `);

    // 2. Заполнить уникальные значения (можно проще, если нет много пользователей)
    const users: { id: string }[] = await queryRunner.query(`SELECT id FROM "users"`);

    const used = new Set<string>();
    for (const user of users) {
      let code;
      do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
      } while (used.has(code));
      used.add(code);
      await queryRunner.query(
        `UPDATE "users" SET "referral_code" = $1 WHERE "id" = $2`,
        [code, user.id]
      );
    }

    // 3. Сделать колонку обязательной и уникальной
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "referral_code" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_referral_code" UNIQUE ("referral_code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_referral_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "referral_code"
    `);
  }
}