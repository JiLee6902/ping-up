import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideoToPosts1766920000000 implements MigrationInterface {
    name = 'AddVideoToPosts1766920000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "video_url" character varying`);

        // Update post_type enum to include VIDEO and TEXT_WITH_VIDEO
        await queryRunner.query(`ALTER TYPE "public"."posts_post_type_enum" ADD VALUE IF NOT EXISTS 'video'`);
        await queryRunner.query(`ALTER TYPE "public"."posts_post_type_enum" ADD VALUE IF NOT EXISTS 'text_with_video'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "video_url"`);
        // Note: PostgreSQL doesn't support removing enum values directly
    }
}
