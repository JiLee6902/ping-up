import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReactions1767100000000 implements MigrationInterface {
    name = 'AddReactions1767100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create reaction_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."reactions_reaction_type_enum" AS ENUM ('heart', 'laugh', 'wow', 'sad', 'angry')
        `);

        // Create reactions table
        await queryRunner.query(`
            CREATE TABLE "reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "user_id" uuid NOT NULL,
                "post_id" uuid NOT NULL,
                "reaction_type" "public"."reactions_reaction_type_enum" NOT NULL,
                CONSTRAINT "PK_reactions_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_reactions_user_post" UNIQUE ("user_id", "post_id")
            )
        `);

        // Create indexes for reactions
        await queryRunner.query(`CREATE INDEX "IDX_reactions_user_id" ON "reactions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reactions_post_id" ON "reactions" ("post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_reactions_post_type" ON "reactions" ("post_id", "reaction_type")`);

        // Add foreign keys for reactions
        await queryRunner.query(`
            ALTER TABLE "reactions"
            ADD CONSTRAINT "FK_reactions_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reactions"
            ADD CONSTRAINT "FK_reactions_post_id"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add reactions_count column to posts table
        await queryRunner.query(`
            ALTER TABLE "posts" ADD COLUMN "reactions_count" jsonb NOT NULL DEFAULT '{}'
        `);

        // Migrate existing likes to heart reactions
        await queryRunner.query(`
            INSERT INTO "reactions" (user_id, post_id, reaction_type, created_at)
            SELECT pl.user_id, pl.post_id, 'heart', NOW()
            FROM post_likes pl
            ON CONFLICT DO NOTHING
        `);

        // Update reactions_count for existing posts based on migrated data
        await queryRunner.query(`
            UPDATE posts p
            SET reactions_count = (
                SELECT COALESCE(jsonb_object_agg(reaction_type, cnt), '{}')
                FROM (
                    SELECT reaction_type, COUNT(*) as cnt
                    FROM reactions
                    WHERE post_id = p.id
                    GROUP BY reaction_type
                ) sub
            )
            WHERE EXISTS (SELECT 1 FROM reactions WHERE post_id = p.id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove reactions_count column
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "reactions_count"`);

        // Drop reactions table
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_reactions_post_id"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_reactions_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_post_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_post_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_user_id"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_reaction_type_enum"`);
    }
}
