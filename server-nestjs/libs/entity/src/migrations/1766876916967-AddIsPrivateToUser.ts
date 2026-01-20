import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPrivateToUser1766876916967 implements MigrationInterface {
    name = 'AddIsPrivateToUser1766876916967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_original_post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "fk_comments_parent_id"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_comment_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_user_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_original_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_comments_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_comments_parent_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_private" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "likes_count" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_3f7c083467ede0a2660bdb8011" ON "posts" ("original_post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e7c9a36c0ac867b543c6509aa" ON "comments" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_259bf9825d9d198608d1b46b0b" ON "comments" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c675567d2a58f0b07cef09c13" ON "comments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6f93329801a93536da4241e38" ON "comments" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2073bf518ef7017ec19319a65e" ON "comment_likes" ("comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bdba9a10c64ff58d36b09e3ac4" ON "comment_likes" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_3f7c083467ede0a2660bdb8011c" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_d6f93329801a93536da4241e386" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_2073bf518ef7017ec19319a65e5" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_bdba9a10c64ff58d36b09e3ac45" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_bdba9a10c64ff58d36b09e3ac45"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_2073bf518ef7017ec19319a65e5"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_d6f93329801a93536da4241e386"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_3f7c083467ede0a2660bdb8011c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bdba9a10c64ff58d36b09e3ac4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2073bf518ef7017ec19319a65e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6f93329801a93536da4241e38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c675567d2a58f0b07cef09c13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_259bf9825d9d198608d1b46b0b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e7c9a36c0ac867b543c6509aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f7c083467ede0a2660bdb8011"`);
        await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "likes_count" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_private"`);
        await queryRunner.query(`CREATE INDEX "idx_comments_parent_id" ON "comments" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comments_user_id" ON "comments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comments_post_id" ON "comments" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_comments_created_at" ON "comments" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_posts_original_post_id" ON "posts" ("original_post_id") `);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "fk_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_original_post_id" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
