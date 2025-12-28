import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBackgroundImageToChatSettings1766810373256 implements MigrationInterface {
    name = 'AddBackgroundImageToChatSettings1766810373256'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD "background_image" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP COLUMN "background_image"`);
    }

}
