import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToPosts1766910000000 implements MigrationInterface {
    name = 'AddLocationToPosts1766910000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "location_lat" numeric(10,8)`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "location_lng" numeric(11,8)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "location_lng"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "location_lat"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "location"`);
    }
}
