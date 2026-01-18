import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoryLikes1766960000000 implements MigrationInterface {
  name = 'AddStoryLikes1766960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create story_likes junction table
    await queryRunner.query(`
      CREATE TABLE "story_likes" (
        "story_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_story_likes" PRIMARY KEY ("story_id", "user_id"),
        CONSTRAINT "FK_story_likes_story" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_story_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Add likes_count column to stories table
    await queryRunner.query(`
      ALTER TABLE "stories" ADD COLUMN "likes_count" integer NOT NULL DEFAULT 0
    `);

    // Create index for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_story_likes_story_id" ON "story_likes" ("story_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_story_likes_user_id" ON "story_likes" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_story_likes_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_story_likes_story_id"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "likes_count"`);
    await queryRunner.query(`DROP TABLE "story_likes"`);
  }
}
