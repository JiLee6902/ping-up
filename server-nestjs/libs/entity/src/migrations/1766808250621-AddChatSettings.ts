import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatSettings1766808250621 implements MigrationInterface {
    name = 'AddChatSettings1766808250621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying DEFAULT 'SYSTEM', "updated_by" character varying DEFAULT 'SYSTEM', "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "chat_with_user_id" uuid NOT NULL, "nickname" character varying, "is_muted" boolean NOT NULL DEFAULT false, "is_blocked" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_e61d72ca47599d9fb59f0e47eac" UNIQUE ("user_id", "chat_with_user_id"), CONSTRAINT "PK_1802e10ebbe48cf6de0047de64d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_083e3a66015b047ea3bcdbe55d" ON "chat_settings" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e50016cc8f96412d68f82a53e7" ON "chat_settings" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ca4228380f1ca874861170276" ON "chat_settings" ("chat_with_user_id") `);
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD CONSTRAINT "FK_e50016cc8f96412d68f82a53e7e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_settings" ADD CONSTRAINT "FK_0ca4228380f1ca874861170276e" FOREIGN KEY ("chat_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP CONSTRAINT "FK_0ca4228380f1ca874861170276e"`);
        await queryRunner.query(`ALTER TABLE "chat_settings" DROP CONSTRAINT "FK_e50016cc8f96412d68f82a53e7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ca4228380f1ca874861170276"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e50016cc8f96412d68f82a53e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_083e3a66015b047ea3bcdbe55d"`);
        await queryRunner.query(`DROP TABLE "chat_settings"`);
    }

}
