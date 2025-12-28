import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFactorAuth1766940000000 implements MigrationInterface {
    name = 'AddTwoFactorAuth1766940000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "two_factor_secret" character varying,
            ADD COLUMN "two_factor_enabled" boolean NOT NULL DEFAULT false,
            ADD COLUMN "two_factor_backup_codes" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "two_factor_backup_codes",
            DROP COLUMN "two_factor_enabled",
            DROP COLUMN "two_factor_secret"
        `);
    }
}
