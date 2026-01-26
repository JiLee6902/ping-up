import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentSystem1767300000000 implements MigrationInterface {
  name = 'AddPaymentSystem1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_tier enum
    await queryRunner.query(`
      CREATE TYPE "public"."subscription_tier_enum" AS ENUM ('free', 'premium')
    `);

    // Create transaction_type enum
    await queryRunner.query(`
      CREATE TYPE "public"."transaction_type_enum" AS ENUM ('top_up', 'purchase', 'refund', 'bonus')
    `);

    // Create payment_status enum
    await queryRunner.query(`
      CREATE TYPE "public"."payment_status_enum" AS ENUM ('pending', 'success', 'failed', 'cancelled')
    `);

    // Add subscription columns to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "subscription_tier" "public"."subscription_tier_enum" NOT NULL DEFAULT 'free',
      ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "profile_theme" varchar,
      ADD COLUMN "pinned_post_ids" text
    `);

    // Create user_wallets table
    await queryRunner.query(`
      CREATE TABLE "user_wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "balance" integer NOT NULL DEFAULT 0,
        "total_top_up" integer NOT NULL DEFAULT 0,
        "total_spent" integer NOT NULL DEFAULT 0,
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_user_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_user_wallets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_wallets_user_id" ON "user_wallets" ("user_id")`);

    // Create coin_transactions table
    await queryRunner.query(`
      CREATE TABLE "coin_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "type" "public"."transaction_type_enum" NOT NULL,
        "amount" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "description" varchar,
        "reference_id" varchar,
        CONSTRAINT "PK_coin_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_coin_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_coin_transactions_user_id" ON "coin_transactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_coin_transactions_reference_id" ON "coin_transactions" ("reference_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_coin_transactions_created_at" ON "coin_transactions" ("created_at")`);

    // Create payment_orders table
    await queryRunner.query(`
      CREATE TABLE "payment_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "order_code" varchar NOT NULL,
        "amount" integer NOT NULL,
        "coin_amount" integer NOT NULL,
        "status" "public"."payment_status_enum" NOT NULL DEFAULT 'pending',
        "vnpay_transaction_no" varchar,
        "vnpay_response_code" varchar,
        "vnpay_data" jsonb,
        CONSTRAINT "PK_payment_orders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_orders_order_code" UNIQUE ("order_code"),
        CONSTRAINT "FK_payment_orders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_payment_orders_user_id" ON "payment_orders" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_orders_order_code" ON "payment_orders" ("order_code")`);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "tier" "public"."subscription_tier_enum" NOT NULL DEFAULT 'free',
        "premium_expires_at" TIMESTAMP WITH TIME ZONE,
        "total_premium_days" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscriptions_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);

    // Create profile_views table
    await queryRunner.query(`
      CREATE TABLE "profile_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "profile_owner_id" uuid NOT NULL,
        "viewer_id" uuid NOT NULL,
        CONSTRAINT "PK_profile_views" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profile_views_owner" FOREIGN KEY ("profile_owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_profile_views_viewer" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_profile_views_owner" ON "profile_views" ("profile_owner_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_profile_views_viewer" ON "profile_views" ("viewer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_profile_views_compound" ON "profile_views" ("profile_owner_id", "viewer_id", "created_at")`);

    // Create scheduled_posts table
    await queryRunner.query(`
      CREATE TABLE "scheduled_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" varchar DEFAULT 'SYSTEM',
        "updated_by" varchar DEFAULT 'SYSTEM',
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "images" text,
        "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_published" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_scheduled_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scheduled_posts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_posts_user_id" ON "scheduled_posts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_scheduled_posts_scheduled_at" ON "scheduled_posts" ("scheduled_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop scheduled_posts
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_posts_scheduled_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_scheduled_posts_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scheduled_posts"`);

    // Drop profile_views
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profile_views_compound"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profile_views_viewer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profile_views_owner"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profile_views"`);

    // Drop subscriptions
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);

    // Drop payment_orders
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_orders_order_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_orders_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_orders"`);

    // Drop coin_transactions
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coin_transactions_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coin_transactions_reference_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coin_transactions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coin_transactions"`);

    // Drop user_wallets
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_wallets_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_wallets"`);

    // Remove columns from users
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "pinned_post_ids",
      DROP COLUMN IF EXISTS "profile_theme",
      DROP COLUMN IF EXISTS "is_verified",
      DROP COLUMN IF EXISTS "subscription_tier"
    `);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."subscription_tier_enum"`);
  }
}
