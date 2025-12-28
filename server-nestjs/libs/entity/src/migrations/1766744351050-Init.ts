import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1766744351050 implements MigrationInterface {
    name = 'Init1766744351050'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."posts_post_type_enum" AS ENUM('text', 'image', 'text_with_image')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "content" text, "image_urls" text, "post_type" "public"."posts_post_type_enum" NOT NULL DEFAULT 'text', "likes_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60818528127866f5002e7f826d" ON "posts" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c4f9a7bd77b489e711277ee598" ON "posts" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."messages_message_type_enum" AS ENUM('text', 'image')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, "text" text, "message_type" "public"."messages_message_type_enum" NOT NULL DEFAULT 'text', "media_url" character varying, "seen" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0777b63da90c27d6ed993dc60b" ON "messages" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4068260b3a12ab373f70adfcd8" ON "messages" ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a659ce2caa1c25f0d9161d0aaa" ON "messages" ("to_user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."connections_status_enum" AS ENUM('pending', 'accepted')`);
        await queryRunner.query(`CREATE TABLE "connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "from_user_id" uuid NOT NULL, "to_user_id" uuid NOT NULL, "status" "public"."connections_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_3cc54df53b692d1ad9df3998a33" UNIQUE ("from_user_id", "to_user_id"), CONSTRAINT "PK_0a1f844af3122354cbd487a8d03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6741e87a256d8d5f02d54dcc8b" ON "connections" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4074fab22792a9f475468ed50" ON "connections" ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d5f81e21721ba6be913d3cb84" ON "connections" ("to_user_id") `);
        await queryRunner.query(`CREATE TABLE "user_refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "refresh_token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_revoked" boolean NOT NULL DEFAULT false, "user_agent" character varying, "ip_address" character varying, CONSTRAINT "PK_c5f5cf35bd8aabd1ebe9bb13409" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_49c4fe8fead4b8d0cdbf71dd2c" ON "user_refresh_tokens" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_15ffbf3cf712c581611caf2130" ON "user_refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d9375f004983dfbd113aba713d" ON "user_refresh_tokens" ("refresh_token") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "full_name" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "bio" character varying, "location" character varying, "profile_picture" character varying, "cover_photo" character varying, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE TYPE "public"."stories_media_type_enum" AS ENUM('text', 'image', 'video')`);
        await queryRunner.query(`CREATE TABLE "stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "content" text, "media_url" character varying, "media_type" "public"."stories_media_type_enum" NOT NULL DEFAULT 'text', "background_color" character varying, "expires_at" TIMESTAMP NOT NULL, "views_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f4f25ac6c2a2446902d1db1d36" ON "stories" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ab4ee230faf536e7c5aee12f4e" ON "stories" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b268ef13743e47999b36cb1470" ON "stories" ("expires_at") `);
        await queryRunner.query(`CREATE TABLE "post_likes" ("post_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_8f64693922a9e8c4e2605850d0b" PRIMARY KEY ("post_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b40d37469c501092203d285af8" ON "post_likes" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b9a7fc5eeff133cf71b8e06a7" ON "post_likes" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "user_followers" ("follower_id" uuid NOT NULL, "following_id" uuid NOT NULL, CONSTRAINT "PK_81bc622bd88e6ea821f9fa0ed97" PRIMARY KEY ("follower_id", "following_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da722d93356ae3119d6be40d98" ON "user_followers" ("follower_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0092daece8ed943fec27d37c41" ON "user_followers" ("following_id") `);
        await queryRunner.query(`CREATE TABLE "story_views" ("story_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_3b8ffe2eee1959849d3dd21bc35" PRIMARY KEY ("story_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e30910f5c5e7cefc96f92d1733" ON "story_views" ("story_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_957569250010b2ec66127999d1" ON "story_views" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_4068260b3a12ab373f70adfcd84" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_a659ce2caa1c25f0d9161d0aaaa" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "connections" ADD CONSTRAINT "FK_f4074fab22792a9f475468ed50a" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "connections" ADD CONSTRAINT "FK_6d5f81e21721ba6be913d3cb848" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "FK_15ffbf3cf712c581611caf2130a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_b40d37469c501092203d285af80" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_9b9a7fc5eeff133cf71b8e06a7b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_followers" ADD CONSTRAINT "FK_da722d93356ae3119d6be40d988" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_followers" ADD CONSTRAINT "FK_0092daece8ed943fec27d37c413" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_views" ADD CONSTRAINT "FK_e30910f5c5e7cefc96f92d17331" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "story_views" ADD CONSTRAINT "FK_957569250010b2ec66127999d15" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "story_views" DROP CONSTRAINT "FK_957569250010b2ec66127999d15"`);
        await queryRunner.query(`ALTER TABLE "story_views" DROP CONSTRAINT "FK_e30910f5c5e7cefc96f92d17331"`);
        await queryRunner.query(`ALTER TABLE "user_followers" DROP CONSTRAINT "FK_0092daece8ed943fec27d37c413"`);
        await queryRunner.query(`ALTER TABLE "user_followers" DROP CONSTRAINT "FK_da722d93356ae3119d6be40d988"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_9b9a7fc5eeff133cf71b8e06a7b"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_b40d37469c501092203d285af80"`);
        await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea"`);
        await queryRunner.query(`ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "FK_15ffbf3cf712c581611caf2130a"`);
        await queryRunner.query(`ALTER TABLE "connections" DROP CONSTRAINT "FK_6d5f81e21721ba6be913d3cb848"`);
        await queryRunner.query(`ALTER TABLE "connections" DROP CONSTRAINT "FK_f4074fab22792a9f475468ed50a"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_a659ce2caa1c25f0d9161d0aaaa"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_4068260b3a12ab373f70adfcd84"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_957569250010b2ec66127999d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e30910f5c5e7cefc96f92d1733"`);
        await queryRunner.query(`DROP TABLE "story_views"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0092daece8ed943fec27d37c41"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da722d93356ae3119d6be40d98"`);
        await queryRunner.query(`DROP TABLE "user_followers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b9a7fc5eeff133cf71b8e06a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b40d37469c501092203d285af8"`);
        await queryRunner.query(`DROP TABLE "post_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b268ef13743e47999b36cb1470"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ab4ee230faf536e7c5aee12f4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4f25ac6c2a2446902d1db1d36"`);
        await queryRunner.query(`DROP TABLE "stories"`);
        await queryRunner.query(`DROP TYPE "public"."stories_media_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9b5b525a96ddc2c5647d7f7fa"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9375f004983dfbd113aba713d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15ffbf3cf712c581611caf2130"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_49c4fe8fead4b8d0cdbf71dd2c"`);
        await queryRunner.query(`DROP TABLE "user_refresh_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6d5f81e21721ba6be913d3cb84"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4074fab22792a9f475468ed50"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6741e87a256d8d5f02d54dcc8b"`);
        await queryRunner.query(`DROP TABLE "connections"`);
        await queryRunner.query(`DROP TYPE "public"."connections_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a659ce2caa1c25f0d9161d0aaa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4068260b3a12ab373f70adfcd8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0777b63da90c27d6ed993dc60b"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4f9a7bd77b489e711277ee598"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60818528127866f5002e7f826d"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_post_type_enum"`);
    }

}
