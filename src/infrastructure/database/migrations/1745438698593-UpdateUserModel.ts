import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserModel1745438698593 implements MigrationInterface {
    name = 'UpdateUserModel1745438698593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP CONSTRAINT "FK_77607c5b6af821ec294d33aab0c"`);
        await queryRunner.query(`
            ALTER TABLE "users" ADD "refCode" varchar(255) NULL;
          `);
        await queryRunner.query(`
            ALTER TABLE "users" ADD "referralData" jsonb NULL;
          `);
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" ADD CONSTRAINT "FK_77607c5b6af821ec294d33aab0c" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refCode";`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referralData";`);
    }

}
