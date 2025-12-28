import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBackgroundColorToChatSettings1766809247366 implements MigrationInterface {
    name = 'AddBackgroundColorToChatSettings1766809247366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD "background_color" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP COLUMN "background_color"`);
    }

}
