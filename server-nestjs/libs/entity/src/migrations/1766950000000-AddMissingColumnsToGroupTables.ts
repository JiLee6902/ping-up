import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToGroupTables1766950000000 implements MigrationInterface {
    name = 'AddMissingColumnsToGroupTables1766950000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to group_chats
        await queryRunner.query(`
            ALTER TABLE "group_chats"
            ADD COLUMN IF NOT EXISTS "created_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "updated_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE
        `);

        // Add missing columns to group_members
        await queryRunner.query(`
            ALTER TABLE "group_members"
            ADD COLUMN IF NOT EXISTS "created_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "updated_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE
        `);

        // Add missing columns to group_messages
        await queryRunner.query(`
            ALTER TABLE "group_messages"
            ADD COLUMN IF NOT EXISTS "created_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "updated_by" character varying DEFAULT 'SYSTEM',
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE
        `);

        // Add index on created_at for group_chats
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_group_chats_created_at" ON "group_chats" ("created_at")
        `);

        // Add index on created_at for group_members
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_group_members_created_at" ON "group_members" ("created_at")
        `);

        // Add index on created_at for group_messages
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_group_messages_created_at" ON "group_messages" ("created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_messages_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_members_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_chats_created_at"`);

        // Remove columns from group_messages
        await queryRunner.query(`
            ALTER TABLE "group_messages"
            DROP COLUMN IF EXISTS "deleted_at",
            DROP COLUMN IF EXISTS "updated_by",
            DROP COLUMN IF EXISTS "created_by"
        `);

        // Remove columns from group_members
        await queryRunner.query(`
            ALTER TABLE "group_members"
            DROP COLUMN IF EXISTS "deleted_at",
            DROP COLUMN IF EXISTS "updated_by",
            DROP COLUMN IF EXISTS "created_by"
        `);

        // Remove columns from group_chats
        await queryRunner.query(`
            ALTER TABLE "group_chats"
            DROP COLUMN IF EXISTS "deleted_at",
            DROP COLUMN IF EXISTS "updated_by",
            DROP COLUMN IF EXISTS "created_by"
        `);
    }
}
