import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuestLogin1769600000000 implements MigrationInterface {
    name = 'AddGuestLogin1769600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "is_guest" boolean NOT NULL DEFAULT false,
            ADD COLUMN "guest_visit_count" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "guest_visit_count",
            DROP COLUMN "is_guest"
        `);
    }
}
