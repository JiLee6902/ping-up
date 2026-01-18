import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageRequestColumns1766951000000 implements MigrationInterface {
  name = 'AddMessageRequestColumns1766951000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN IF NOT EXISTS "is_message_request" BOOLEAN DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN IF NOT EXISTS "is_request_accepted" BOOLEAN DEFAULT false
    `);

    // Update existing messages to have isRequestAccepted = true
    await queryRunner.query(`
      UPDATE "messages" SET "is_request_accepted" = true WHERE "is_message_request" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages" DROP COLUMN IF EXISTS "is_message_request"
    `);
    await queryRunner.query(`
      ALTER TABLE "messages" DROP COLUMN IF EXISTS "is_request_accepted"
    `);
  }
}
