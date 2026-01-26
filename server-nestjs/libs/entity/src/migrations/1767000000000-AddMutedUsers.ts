import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMutedUsers1767000000000 implements MigrationInterface {
    name = 'AddMutedUsers1767000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create muted_users table
        await queryRunner.query(`
            CREATE TABLE "muted_users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "created_by" character varying DEFAULT 'SYSTEM',
                "updated_by" character varying DEFAULT 'SYSTEM',
                "deleted_at" TIMESTAMPTZ,
                "muter_id" uuid NOT NULL,
                "muted_id" uuid NOT NULL,
                "mute_until" TIMESTAMPTZ,
                CONSTRAINT "PK_muted_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_muted_users_muter_muted" UNIQUE ("muter_id", "muted_id")
            )
        `);

        // Create indexes for muted_users
        await queryRunner.query(`CREATE INDEX "IDX_muted_users_muter_id" ON "muted_users" ("muter_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_muted_users_muted_id" ON "muted_users" ("muted_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_muted_users_muter_created" ON "muted_users" ("muter_id", "created_at")`);

        // Add foreign keys for muted_users
        await queryRunner.query(`
            ALTER TABLE "muted_users"
            ADD CONSTRAINT "FK_muted_users_muter_id"
            FOREIGN KEY ("muter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "muted_users"
            ADD CONSTRAINT "FK_muted_users_muted_id"
            FOREIGN KEY ("muted_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop muted_users table
        await queryRunner.query(`ALTER TABLE "muted_users" DROP CONSTRAINT "FK_muted_users_muted_id"`);
        await queryRunner.query(`ALTER TABLE "muted_users" DROP CONSTRAINT "FK_muted_users_muter_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_muted_users_muter_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_muted_users_muted_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_muted_users_muter_id"`);
        await queryRunner.query(`DROP TABLE "muted_users"`);
    }
}
