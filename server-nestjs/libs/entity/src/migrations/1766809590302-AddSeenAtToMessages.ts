import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeenAtToMessages1766809590302 implements MigrationInterface {
    name = 'AddSeenAtToMessages1766809590302'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "seen_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "seen_at"`);
    }

}
