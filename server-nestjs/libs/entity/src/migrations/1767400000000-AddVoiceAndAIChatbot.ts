import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVoiceAndAIChatbot1767400000000 implements MigrationInterface {
    name = 'AddVoiceAndAIChatbot1767400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."messages_message_type_enum" ADD VALUE IF NOT EXISTS 'audio'`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "transcription" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_bot" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_bot"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "transcription"`);
    }
}
