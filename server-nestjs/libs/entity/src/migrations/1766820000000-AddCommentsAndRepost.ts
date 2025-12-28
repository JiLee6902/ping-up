import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentsAndRepost1766820000000 implements MigrationInterface {
    name = 'AddCommentsAndRepost1766820000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create comments table
        await queryRunner.query(`
            CREATE TABLE "comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMP,
                "post_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "content" text NOT NULL,
                "parent_id" uuid,
                CONSTRAINT "PK_comments_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for comments
        await queryRunner.query(`CREATE INDEX "IDX_comments_created_at" ON "comments" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_comments_post_id" ON "comments" ("post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_comments_user_id" ON "comments" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_comments_parent_id" ON "comments" ("parent_id")`);

        // Add foreign keys for comments
        await queryRunner.query(`
            ALTER TABLE "comments"
            ADD CONSTRAINT "FK_comments_post_id"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "comments"
            ADD CONSTRAINT "FK_comments_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "comments"
            ADD CONSTRAINT "FK_comments_parent_id"
            FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add new columns to posts table
        await queryRunner.query(`ALTER TABLE "posts" ADD "original_post_id" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "shares_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "comments_count" integer NOT NULL DEFAULT 0`);

        // Create index for original_post_id
        await queryRunner.query(`CREATE INDEX "IDX_posts_original_post_id" ON "posts" ("original_post_id")`);

        // Add foreign key for original_post
        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_posts_original_post_id"
            FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Update post_type enum to include 'repost'
        await queryRunner.query(`ALTER TYPE "public"."posts_post_type_enum" ADD VALUE IF NOT EXISTS 'repost'`);

        // Add last_activity_at column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "last_activity_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove last_activity_at from users
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_activity_at"`);

        // Remove foreign key from posts
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_original_post_id"`);

        // Remove index
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_original_post_id"`);

        // Remove columns from posts
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "comments_count"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "shares_count"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "original_post_id"`);

        // Remove foreign keys from comments
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_parent_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_post_id"`);

        // Remove indexes from comments
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_created_at"`);

        // Drop comments table
        await queryRunner.query(`DROP TABLE "comments"`);
    }
}
