-- Migration: Add promotions engine tables
-- Task #142: Promotions & announcement banner engine
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "promo_display_type" AS ENUM ('banner', 'popup');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "promo_audience" AS ENUM ('public', 'student', 'both');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "display_type" "promo_display_type" NOT NULL DEFAULT 'banner',
  "audience" "promo_audience" NOT NULL DEFAULT 'public',
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp NOT NULL,
  "cta_label" text,
  "cta_url" text,
  "bg_colour" text NOT NULL DEFAULT '#1a2e5a',
  "cta_colour" text NOT NULL DEFAULT '#2a9d8f',
  "created_by_id" uuid,
  "archived_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
);
