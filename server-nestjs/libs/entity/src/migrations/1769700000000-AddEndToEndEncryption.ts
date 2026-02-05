import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEndToEndEncryption1769700000000 implements MigrationInterface {
  name = 'AddEndToEndEncryption1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_key_bundles table
    await queryRunner.query(`
      CREATE TABLE "user_key_bundles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying DEFAULT 'SYSTEM',
        "updated_by" character varying DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "identity_public_key" text NOT NULL,
        "signed_prekey" text,
        "prekey_signature" text,
        "key_version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_user_key_bundles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_key_bundles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_key_bundles_user_id" ON "user_key_bundles" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_key_bundles_created_at" ON "user_key_bundles" ("created_at")`,
    );

    // Add encryption columns to messages
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "encrypted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "encryption_iv" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "encryption_iv"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "encrypted"`);
    await queryRunner.query(`DROP INDEX "IDX_user_key_bundles_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_user_key_bundles_user_id"`);
    await queryRunner.query(`DROP TABLE "user_key_bundles"`);
  }
}
