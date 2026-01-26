import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolls1767200000000 implements MigrationInterface {
  name = 'AddPolls1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add POLL to post_type enum
    await queryRunner.query(`
      ALTER TYPE "public"."posts_post_type_enum" ADD VALUE IF NOT EXISTS 'poll'
    `);

    // Create polls table
    await queryRunner.query(`
      CREATE TABLE "polls" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "post_id" uuid NOT NULL,
        "question" text NOT NULL,
        "options" jsonb NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "is_multiple_choice" boolean NOT NULL DEFAULT false,
        "total_votes" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_polls" PRIMARY KEY ("id"),
        CONSTRAINT "FK_polls_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);

    // Create index on post_id
    await queryRunner.query(`
      CREATE INDEX "IDX_polls_post_id" ON "polls" ("post_id")
    `);

    // Create poll_votes table
    await queryRunner.query(`
      CREATE TABLE "poll_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "poll_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "option_id" integer NOT NULL,
        CONSTRAINT "PK_poll_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_poll_votes_unique" UNIQUE ("poll_id", "user_id", "option_id"),
        CONSTRAINT "FK_poll_votes_poll" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_poll_votes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for poll_votes
    await queryRunner.query(`
      CREATE INDEX "IDX_poll_votes_poll_user" ON "poll_votes" ("poll_id", "user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_poll_votes_user_id" ON "poll_votes" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_poll_votes_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_poll_votes_poll_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "poll_votes"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_polls_post_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "polls"`);
    // Note: Cannot easily remove enum values in PostgreSQL
  }
}
