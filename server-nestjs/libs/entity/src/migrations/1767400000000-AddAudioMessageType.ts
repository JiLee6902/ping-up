import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAudioMessageType1767400000000 implements MigrationInterface {
    name = 'AddAudioMessageType1767400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."messages_message_type_enum" ADD VALUE IF NOT EXISTS 'audio'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
    }
}
