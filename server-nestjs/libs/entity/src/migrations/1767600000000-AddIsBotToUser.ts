import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsBotToUser1767600000000 implements MigrationInterface {
    name = 'AddIsBotToUser1767600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_bot" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_bot"`);
    }
}
