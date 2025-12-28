import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewFeatureTables1766900000000 implements MigrationInterface {
    name = 'AddNewFeatureTables1766900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the bookmarks table if it was partially created
        await queryRunner.query(`DROP TABLE IF EXISTS "bookmarks" CASCADE`);

        // Create bookmarks table
        await queryRunner.query(`
            CREATE TABLE "bookmarks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "user_id" uuid NOT NULL,
                "post_id" uuid NOT NULL,
                CONSTRAINT "PK_bookmarks_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_bookmarks_user_post" UNIQUE ("user_id", "post_id")
            )
        `);

        // Create indexes for bookmarks
        await queryRunner.query(`CREATE INDEX "IDX_bookmarks_user_id" ON "bookmarks" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_bookmarks_post_id" ON "bookmarks" ("post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_bookmarks_user_created" ON "bookmarks" ("user_id", "created_at")`);

        // Add foreign keys for bookmarks
        await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_bookmarks_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookmarks"
            ADD CONSTRAINT "FK_bookmarks_post_id"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create blocked_users table
        await queryRunner.query(`
            CREATE TABLE "blocked_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "blocker_id" uuid NOT NULL,
                "blocked_id" uuid NOT NULL,
                "reason" character varying,
                CONSTRAINT "PK_blocked_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_blocked_users_blocker_blocked" UNIQUE ("blocker_id", "blocked_id")
            )
        `);

        // Create indexes for blocked_users
        await queryRunner.query(`CREATE INDEX "IDX_blocked_users_blocker_id" ON "blocked_users" ("blocker_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_blocked_users_blocked_id" ON "blocked_users" ("blocked_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_blocked_users_blocker_created" ON "blocked_users" ("blocker_id", "created_at")`);

        // Add foreign keys for blocked_users
        await queryRunner.query(`
            ALTER TABLE "blocked_users"
            ADD CONSTRAINT "FK_blocked_users_blocker_id"
            FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "blocked_users"
            ADD CONSTRAINT "FK_blocked_users_blocked_id"
            FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create notification_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM ('like', 'comment', 'follow', 'follow_request', 'follow_accepted', 'repost', 'mention')
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "recipient_id" uuid NOT NULL,
                "actor_id" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "post_id" uuid,
                "comment_id" uuid,
                "is_read" boolean NOT NULL DEFAULT false,
                "message" character varying,
                CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for notifications
        await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient_id" ON "notifications" ("recipient_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient_read_created" ON "notifications" ("recipient_id", "is_read", "created_at")`);

        // Add foreign keys for notifications
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_recipient_id"
            FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_actor_id"
            FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_post_id"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_notifications_comment_id"
            FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create report_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."reports_report_type_enum" AS ENUM ('post', 'user', 'comment')
        `);

        // Create report_reason enum
        await queryRunner.query(`
            CREATE TYPE "public"."reports_reason_enum" AS ENUM ('spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'false_information', 'scam', 'other')
        `);

        // Create report_status enum
        await queryRunner.query(`
            CREATE TYPE "public"."reports_status_enum" AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed')
        `);

        // Create reports table
        await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "reporter_id" uuid NOT NULL,
                "report_type" "public"."reports_report_type_enum" NOT NULL,
                "reason" "public"."reports_reason_enum" NOT NULL,
                "description" character varying,
                "status" "public"."reports_status_enum" NOT NULL DEFAULT 'pending',
                "reported_user_id" uuid,
                "reported_post_id" uuid,
                "reported_comment_id" uuid,
                CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for reports
        await queryRunner.query(`CREATE INDEX "IDX_reports_reporter_id" ON "reports" ("reporter_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reports_reported_user_id" ON "reports" ("reported_user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reports_reported_post_id" ON "reports" ("reported_post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reports_reported_comment_id" ON "reports" ("reported_comment_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reports_reporter_created" ON "reports" ("reporter_id", "created_at")`);

        // Add foreign keys for reports
        await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_reporter_id"
            FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_reported_user_id"
            FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_reported_post_id"
            FOREIGN KEY ("reported_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reports"
            ADD CONSTRAINT "FK_reports_reported_comment_id"
            FOREIGN KEY ("reported_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop reports table
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reported_comment_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reported_post_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reported_user_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reports_reporter_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reports_reported_comment_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reports_reported_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reports_reported_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reports_reporter_id"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_report_type_enum"`);

        // Drop notifications table
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_comment_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_post_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_actor_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_recipient_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_recipient_read_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_is_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_recipient_id"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);

        // Drop blocked_users table
        await queryRunner.query(`ALTER TABLE "blocked_users" DROP CONSTRAINT "FK_blocked_users_blocked_id"`);
        await queryRunner.query(`ALTER TABLE "blocked_users" DROP CONSTRAINT "FK_blocked_users_blocker_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_blocked_users_blocker_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_blocked_users_blocked_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_blocked_users_blocker_id"`);
        await queryRunner.query(`DROP TABLE "blocked_users"`);

        // Drop bookmarks table
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_bookmarks_post_id"`);
        await queryRunner.query(`ALTER TABLE "bookmarks" DROP CONSTRAINT "FK_bookmarks_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmarks_user_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmarks_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmarks_user_id"`);
        await queryRunner.query(`DROP TABLE "bookmarks"`);
    }
}
