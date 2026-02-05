import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageDeletionAndUnsend1769800000000 implements MigrationInterface {
    name = 'AddMessageDeletionAndUnsend1769800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create message_deletions table (for "delete for me" on 1-on-1 messages)
        await queryRunner.query(`
            CREATE TABLE "message_deletions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "message_id" uuid NOT NULL,
                "user_id" character varying NOT NULL,
                CONSTRAINT "UQ_message_deletions_message_user" UNIQUE ("message_id", "user_id"),
                CONSTRAINT "PK_message_deletions" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for message_deletions
        await queryRunner.query(`CREATE INDEX "IDX_message_deletions_message_id" ON "message_deletions" ("message_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_message_deletions_user_id" ON "message_deletions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_message_deletions_created_at" ON "message_deletions" ("created_at")`);

        // Add foreign keys for message_deletions
        await queryRunner.query(`
            ALTER TABLE "message_deletions"
            ADD CONSTRAINT "FK_message_deletions_message"
            FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "message_deletions"
            ADD CONSTRAINT "FK_message_deletions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create group_message_deletions table (for "delete for me" on group messages)
        await queryRunner.query(`
            CREATE TABLE "group_message_deletions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "group_message_id" uuid NOT NULL,
                "user_id" character varying NOT NULL,
                CONSTRAINT "UQ_group_message_deletions_message_user" UNIQUE ("group_message_id", "user_id"),
                CONSTRAINT "PK_group_message_deletions" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for group_message_deletions
        await queryRunner.query(`CREATE INDEX "IDX_group_message_deletions_group_message_id" ON "group_message_deletions" ("group_message_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_message_deletions_user_id" ON "group_message_deletions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_group_message_deletions_created_at" ON "group_message_deletions" ("created_at")`);

        // Add foreign keys for group_message_deletions
        await queryRunner.query(`
            ALTER TABLE "group_message_deletions"
            ADD CONSTRAINT "FK_group_message_deletions_group_message"
            FOREIGN KEY ("group_message_id") REFERENCES "group_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "group_message_deletions"
            ADD CONSTRAINT "FK_group_message_deletions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add unsend columns to messages table
        await queryRunner.query(`ALTER TABLE "messages" ADD "is_unsent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "unsent_at" TIMESTAMP WITH TIME ZONE`);

        // Add unsend columns to group_messages table
        await queryRunner.query(`ALTER TABLE "group_messages" ADD "is_unsent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "group_messages" ADD "unsent_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove unsend columns from group_messages
        await queryRunner.query(`ALTER TABLE "group_messages" DROP COLUMN "unsent_at"`);
        await queryRunner.query(`ALTER TABLE "group_messages" DROP COLUMN "is_unsent"`);

        // Remove unsend columns from messages
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "unsent_at"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "is_unsent"`);

        // Drop group_message_deletions table
        await queryRunner.query(`ALTER TABLE "group_message_deletions" DROP CONSTRAINT "FK_group_message_deletions_user"`);
        await queryRunner.query(`ALTER TABLE "group_message_deletions" DROP CONSTRAINT "FK_group_message_deletions_group_message"`);
        await queryRunner.query(`DROP INDEX "IDX_group_message_deletions_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_group_message_deletions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_group_message_deletions_group_message_id"`);
        await queryRunner.query(`DROP TABLE "group_message_deletions"`);

        // Drop message_deletions table
        await queryRunner.query(`ALTER TABLE "message_deletions" DROP CONSTRAINT "FK_message_deletions_user"`);
        await queryRunner.query(`ALTER TABLE "message_deletions" DROP CONSTRAINT "FK_message_deletions_message"`);
        await queryRunner.query(`DROP INDEX "IDX_message_deletions_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_message_deletions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_message_deletions_message_id"`);
        await queryRunner.query(`DROP TABLE "message_deletions"`);
    }
}
