import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageColorAndChatEvents1766812511624 implements MigrationInterface {
    name = 'AddMessageColorAndChatEvents1766812511624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "chat_with_user_id" uuid NOT NULL, "event_type" character varying NOT NULL, "event_data" text, CONSTRAINT "PK_0c2aa488dfb84768fac1198b629" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1368e32abe2771f5c1dd1f87bf" ON "chat_events" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3e7067203f9e5d3e5ce60db0e" ON "chat_events" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1fe708fd46d8ba73a479f4ab2" ON "chat_events" ("chat_with_user_id") `);
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD "message_color" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_events" ADD CONSTRAINT "FK_a3e7067203f9e5d3e5ce60db0e0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_events" ADD CONSTRAINT "FK_c1fe708fd46d8ba73a479f4ab27" FOREIGN KEY ("chat_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_events" DROP CONSTRAINT "FK_c1fe708fd46d8ba73a479f4ab27"`);
        await queryRunner.query(`ALTER TABLE "chat_events" DROP CONSTRAINT "FK_a3e7067203f9e5d3e5ce60db0e0"`);
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP COLUMN "message_color"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1fe708fd46d8ba73a479f4ab2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3e7067203f9e5d3e5ce60db0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1368e32abe2771f5c1dd1f87bf"`);
        await queryRunner.query(`DROP TABLE "chat_events"`);
    }

}
