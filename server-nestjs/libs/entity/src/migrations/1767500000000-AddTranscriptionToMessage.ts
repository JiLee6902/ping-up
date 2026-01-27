import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTranscriptionToMessage1767500000000 implements MigrationInterface {
    name = 'AddTranscriptionToMessage1767500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "transcription" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "transcription"`);
    }
}
