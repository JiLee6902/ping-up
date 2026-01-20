import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsPrivateToUser1766876916967 implements MigrationInterface {
    name = 'AddIsPrivateToUser1766876916967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only add is_private column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_private" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_private"`);
    }
}
