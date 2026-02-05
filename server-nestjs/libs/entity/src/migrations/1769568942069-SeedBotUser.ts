import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedBotUser1769568942069 implements MigrationInterface {
    name = 'SeedBotUser1769568942069'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "users" (
                "id", "email", "full_name", "username", "password",
                "bio", "location", "profile_picture", "cover_photo",
                "is_private", "is_bot",
                "created_at", "updated_at", "created_by", "updated_by"
            ) VALUES (
                '00000000-0000-4000-a000-000000000001',
                'ai@pingup.com',
                'PingUp AI',
                'pingup_ai',
                '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                'I am PingUp AI assistant. Ask me anything!',
                'Cloud',
                'https://i.pravatar.cc/200?u=pingup_ai',
                'https://picsum.photos/seed/cover_ai/800/300',
                false,
                true,
                NOW(), NOW(), 'SYSTEM', 'SYSTEM'
            ) ON CONFLICT ("id") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "users" WHERE "id" = '00000000-0000-4000-a000-000000000001'
        `);
    }
}
