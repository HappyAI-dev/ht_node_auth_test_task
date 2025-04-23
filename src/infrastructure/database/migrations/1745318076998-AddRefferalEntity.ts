import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefferalEntity1745318076998 implements MigrationInterface {
    name = 'AddRefferalEntity1745318076998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "credits" integer NOT NULL DEFAULT '0', "referral_level" integer NOT NULL DEFAULT '1', "referral_streak" integer NOT NULL DEFAULT '0', "referral_streak_updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "referred_by" uuid, CONSTRAINT "REL_2f8fb8a07f16dea31f65be9955" UNIQUE ("userId"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`);
        const users: { id: string }[] = await queryRunner.query(`SELECT id FROM "users"`);
        for (const user of users) {
            await queryRunner.query(`
                INSERT INTO "referrals" (
                    "id", "userId", "credits", "referral_level", "referral_streak", "referral_streak_updated_at", "referred_by"
                ) VALUES (
                    uuid_generate_v4(), $1, 0, 1, 0, now(), NULL
                )
          `, [user.id]);
            }
        
        await queryRunner.query(`CREATE TABLE "referral_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "inviter_id" uuid, "invitee_id" uuid, CONSTRAINT "PK_a09e5fca033f189bd757a535e9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "credits"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_streak"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_streak_updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referred_by"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referral_level"`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD CONSTRAINT "FK_2f8fb8a07f16dea31f65be9955d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral_history" ADD CONSTRAINT "FK_e3f50e82fada8d350ffecb64bec" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral_history" ADD CONSTRAINT "FK_fe9dcf474ec381a6d83bccc0db2" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "referral_history" DROP CONSTRAINT "FK_fe9dcf474ec381a6d83bccc0db2"`);
        await queryRunner.query(`ALTER TABLE "referral_history" DROP CONSTRAINT "FK_e3f50e82fada8d350ffecb64bec"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_2f8fb8a07f16dea31f65be9955d"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referral_level" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referred_by" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referral_streak_updated_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referral_streak" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "credits" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP TABLE "referral_history"`);
        await queryRunner.query(`DROP TABLE "referrals"`);
    }

}
