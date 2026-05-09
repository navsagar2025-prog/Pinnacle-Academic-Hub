-- Migration: Add AI-generated metadata columns to blog_posts
-- Part of Task #141: Blog AI suite (enhance, SEO, hero image)
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "seo_title" text;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "meta_description" text;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "focus_keyword" text;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ai_enhanced_at" timestamp;
