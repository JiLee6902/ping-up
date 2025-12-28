import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupChat1766930000000 implements MigrationInterface {
    name = 'AddGroupChat1766930000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create group_role enum
        await queryRunner.query(`
            CREATE TYPE "public"."group_members_role_enum" AS ENUM('admin', 'member')
        `);

        // Create group_message_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."group_messages_message_type_enum" AS ENUM('text', 'image', 'system')
        `);

        // Create group_chats table
        await queryRunner.query(`
            CREATE TABLE "group_chats" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "description" character varying,
                "avatar_url" character varying,
                "creator_id" uuid,
                "member_count" integer NOT NULL DEFAULT 1,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_group_chats" PRIMARY KEY ("id")
            )
        `);

        // Create group_members table
        await queryRunner.query(`
            CREATE TABLE "group_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "group_chat_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" "public"."group_members_role_enum" NOT NULL DEFAULT 'member',
                "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_read_at" TIMESTAMP,
                "is_muted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_group_members" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_group_members_group_user" UNIQUE ("group_chat_id", "user_id")
            )
        `);

        // Create group_messages table
        await queryRunner.query(`
            CREATE TABLE "group_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "group_chat_id" uuid NOT NULL,
                "sender_id" uuid,
                "content" text,
                "message_type" "public"."group_messages_message_type_enum" NOT NULL DEFAULT 'text',
                "media_url" character varying,
                CONSTRAINT "PK_group_messages" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_group_chats_creator" ON "group_chats" ("creator_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_members_group" ON "group_members" ("group_chat_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_members_user" ON "group_members" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_messages_group" ON "group_messages" ("group_chat_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_messages_sender" ON "group_messages" ("sender_id")`);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "group_chats"
            ADD CONSTRAINT "FK_group_chats_creator"
            FOREIGN KEY ("creator_id") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "group_members"
            ADD CONSTRAINT "FK_group_members_group"
            FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "group_members"
            ADD CONSTRAINT "FK_group_members_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "group_messages"
            ADD CONSTRAINT "FK_group_messages_group"
            FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "group_messages"
            ADD CONSTRAINT "FK_group_messages_sender"
            FOREIGN KEY ("sender_id") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "group_messages" DROP CONSTRAINT "FK_group_messages_sender"`);
        await queryRunner.query(`ALTER TABLE "group_messages" DROP CONSTRAINT "FK_group_messages_group"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_group_members_user"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_group_members_group"`);
        await queryRunner.query(`ALTER TABLE "group_chats" DROP CONSTRAINT "FK_group_chats_creator"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_group_messages_sender"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_group_messages_group"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_group_members_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_group_members_group"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_group_chats_creator"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "group_messages"`);
        await queryRunner.query(`DROP TABLE "group_members"`);
        await queryRunner.query(`DROP TABLE "group_chats"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "public"."group_messages_message_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
    }
}
