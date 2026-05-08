CREATE SCHEMA "question_bank";
--> statement-breakpoint
CREATE TYPE "public"."ai_feature_key" AS ENUM('ai_assistant', 'question_generation', 'solution_writer', 'classifier');--> statement-breakpoint
CREATE TYPE "public"."ai_provider" AS ENUM('openai', 'gemini', 'anthropic', 'openrouter');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('active', 'upcoming', 'full', 'completed');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."class_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'interested', 'converted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."fee_status" AS ENUM('paid', 'partial', 'due', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('notes', 'formula', 'exercise', 'summary', 'paper');--> statement-breakpoint
CREATE TYPE "public"."notice_category" AS ENUM('Academic', 'Test', 'Fee', 'Event', 'Admissions', 'General');--> statement-breakpoint
CREATE TYPE "public"."question_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'short', 'long', 'numerical');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'parent', 'teacher', 'admin');--> statement-breakpoint
CREATE TYPE "public"."schedule_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TABLE "ai_feature_models" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "feature_key" "ai_feature_key" NOT NULL,
        "provider" "ai_provider" NOT NULL,
        "model" text NOT NULL,
        "updated_by" uuid,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "ai_feature_models_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "assignment_schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid NOT NULL,
        "posted_by" uuid NOT NULL,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "description" text,
        "file_url" text,
        "max_marks" integer,
        "frequency" "schedule_frequency" NOT NULL,
        "days_of_week" integer[],
        "day_of_month" integer,
        "interval_days" integer,
        "due_time_of_day" text DEFAULT '23:59' NOT NULL,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp,
        "status" "schedule_status" DEFAULT 'active' NOT NULL,
        "last_materialised_date" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid,
        "posted_by" uuid,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "description" text,
        "file_url" text,
        "due_date" timestamp NOT NULL,
        "max_marks" integer,
        "is_visible" boolean DEFAULT true NOT NULL,
        "schedule_id" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "date" timestamp NOT NULL,
        "subject" text NOT NULL,
        "status" "attendance_status" DEFAULT 'present' NOT NULL,
        "note" text,
        "marked_by" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_low_alerts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "notified_at" timestamp DEFAULT now() NOT NULL,
        "notified_pct" integer NOT NULL,
        "has_recovered" boolean DEFAULT false NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "attendance_low_alerts_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "actor_id" uuid,
        "actor_name" text,
        "action" text NOT NULL,
        "entity_type" text,
        "entity_id" text,
        "details" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "course_id" uuid,
        "name" text NOT NULL,
        "timing_label" text NOT NULL,
        "days_label" text NOT NULL,
        "start_date" timestamp,
        "end_date" timestamp,
        "max_students" integer DEFAULT 30,
        "status" "batch_status" DEFAULT 'active',
        "room" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "excerpt" text,
        "content" text,
        "category" text DEFAULT 'General' NOT NULL,
        "tags" text[],
        "author_name" text NOT NULL,
        "featured_image_url" text,
        "status" "blog_status" DEFAULT 'draft' NOT NULL,
        "read_minutes" integer DEFAULT 5,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "class_recordings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "live_class_id" uuid,
        "batch_id" uuid,
        "batch_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "teacher_name" text,
        "recording_url" text NOT NULL,
        "source_provider" text DEFAULT 'zoom',
        "class_date" timestamp,
        "duration_minutes" integer,
        "is_visible" boolean DEFAULT true,
        "view_count" integer DEFAULT 0,
        "created_by_id" uuid,
        "archived_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "category" text DEFAULT 'General',
        "start_date" timestamp,
        "duration_label" text,
        "annual_fee" integer NOT NULL,
        "admission_fee" integer DEFAULT 2000,
        "max_batch_size" integer DEFAULT 35,
        "eligibility" text,
        "highlights" text[],
        "featured_image_url" text,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "doubt_answer_votes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "answer_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doubt_answers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "doubt_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "author_role" text NOT NULL,
        "answer_text" text NOT NULL,
        "image_url" text,
        "upvotes" integer DEFAULT 0 NOT NULL,
        "is_official" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doubts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "batch_id" uuid,
        "subject" text NOT NULL,
        "topic" text,
        "question_text" text NOT NULL,
        "image_url" text,
        "status" text DEFAULT 'open' NOT NULL,
        "is_resolved" boolean DEFAULT false NOT NULL,
        "answer_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "phone" text NOT NULL,
        "email" text,
        "course_interest" text,
        "message" text,
        "source" text DEFAULT 'website',
        "is_followed_up" boolean DEFAULT false,
        "admission_status" "enquiry_status" DEFAULT 'new',
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid,
        "period" text NOT NULL,
        "amount" integer NOT NULL,
        "paid_amount" integer DEFAULT 0 NOT NULL,
        "due_date" timestamp NOT NULL,
        "paid_date" timestamp,
        "status" "fee_status" DEFAULT 'due' NOT NULL,
        "payment_method" text,
        "transaction_ref" text,
        "razorpay_order_id" text,
        "razorpay_payment_id" text,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "caption" text,
        "category" text DEFAULT 'General' NOT NULL,
        "image_url" text NOT NULL,
        "sort_order" integer DEFAULT 0,
        "is_visible" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impersonation_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "token_hash" text NOT NULL,
        "admin_user_id" uuid NOT NULL,
        "target_user_id" uuid NOT NULL,
        "started_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp NOT NULL,
        "ended_at" timestamp,
        "ended_reason" text,
        "ip_address" text,
        "user_agent" text,
        CONSTRAINT "impersonation_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "ip_lockouts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "ip" text NOT NULL,
        "attempts" integer DEFAULT 0 NOT NULL,
        "locked_until" timestamp,
        "route" text,
        "unlocked_at" timestamp,
        "unlocked_by" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "ip_lockouts_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "live_classes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid,
        "teacher_id" uuid,
        "topic" text NOT NULL,
        "subject" text,
        "zoom_meeting_id" text,
        "zoom_join_url" text,
        "zoom_host_url" text,
        "zoom_passcode" text,
        "scheduled_at" timestamp NOT NULL,
        "status" "class_status" DEFAULT 'scheduled',
        "duration_minutes" integer,
        "recording_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_answers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "attempt_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "selected_option" text,
        "selected_options" text[],
        "numerical_response" real,
        "is_correct" boolean,
        "marks_awarded" real DEFAULT 0,
        "is_marked_for_review" boolean DEFAULT false NOT NULL,
        "time_spent_seconds" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_attempts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" uuid NOT NULL,
        "student_id" uuid,
        "guest_name" text,
        "guest_email" text,
        "guest_phone" text,
        "started_at" timestamp DEFAULT now() NOT NULL,
        "submitted_at" timestamp,
        "total_questions" integer DEFAULT 0 NOT NULL,
        "attempted_count" integer DEFAULT 0 NOT NULL,
        "correct_count" integer DEFAULT 0 NOT NULL,
        "wrong_count" integer DEFAULT 0 NOT NULL,
        "score" integer DEFAULT 0 NOT NULL,
        "max_score" integer DEFAULT 0 NOT NULL,
        "time_spent_seconds" integer DEFAULT 0 NOT NULL,
        "is_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" uuid NOT NULL,
        "kind" text NOT NULL,
        "recipient_count" integer DEFAULT 0 NOT NULL,
        "sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" uuid NOT NULL,
        "section_id" uuid,
        "question_number" integer NOT NULL,
        "question_text" text NOT NULL,
        "question_type" text DEFAULT 'mcq' NOT NULL,
        "option_a" text,
        "option_b" text,
        "option_c" text,
        "option_d" text,
        "correct_option" text,
        "correct_options" text[],
        "numerical_answer" real,
        "numerical_tolerance" real DEFAULT 0,
        "topic" text,
        "explanation" text,
        "image_url" text,
        "option_a_image_url" text,
        "option_b_image_url" text,
        "option_c_image_url" text,
        "option_d_image_url" text,
        "explanation_image_url" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_sections" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "test_id" uuid NOT NULL,
        "name" text NOT NULL,
        "ordering" integer DEFAULT 0 NOT NULL,
        "instructions" text,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_tests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "exam_type" text DEFAULT 'Mixed',
        "batch_id" uuid,
        "duration_minutes" integer DEFAULT 60 NOT NULL,
        "marks_per_question" integer DEFAULT 4 NOT NULL,
        "negative_marking_percent" integer DEFAULT 25 NOT NULL,
        "instructions" text,
        "is_published" boolean DEFAULT false NOT NULL,
        "is_public" boolean DEFAULT false NOT NULL,
        "scheduled_start" timestamp,
        "scheduled_end" timestamp,
        "auto_publish_at_start" boolean DEFAULT false NOT NULL,
        "created_by" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "posted_by" uuid,
        "title" text NOT NULL,
        "body" text NOT NULL,
        "category" "notice_category" DEFAULT 'General' NOT NULL,
        "is_public" boolean DEFAULT true,
        "target_batch_id" uuid,
        "published_at" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "path" text NOT NULL,
        "country" text,
        "device_type" text DEFAULT 'desktop' NOT NULL,
        "referrer" text,
        "count" integer DEFAULT 1 NOT NULL,
        "date" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "student_id" uuid,
        "relation" text DEFAULT 'Parent',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_papers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid,
        "title" text NOT NULL,
        "paper_type" text NOT NULL,
        "subject" text NOT NULL,
        "duration_minutes" integer,
        "total_questions" integer,
        "max_marks" integer,
        "file_url" text,
        "download_count" integer DEFAULT 0,
        "is_visible" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_set_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "set_id" uuid NOT NULL,
        "batch_id" uuid,
        "student_id" uuid,
        "assigned_by" uuid,
        "due_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_set_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "set_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "subject" text,
        "created_by" uuid,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_bank"."question_attempts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "practice_set_id" uuid,
        "submitted_answer" text,
        "is_correct" boolean,
        "time_spent_seconds" integer,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_bank"."question_bank" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "subject" text NOT NULL,
        "topic" text,
        "class_grade" text,
        "year" integer,
        "difficulty" "question_difficulty" DEFAULT 'medium' NOT NULL,
        "question_type" "question_type" DEFAULT 'mcq' NOT NULL,
        "question_text" text NOT NULL,
        "options" jsonb,
        "correct_answer" text NOT NULL,
        "solution" text,
        "image_url" text,
        "solution_image_url" text,
        "exam_name" text,
        "marks" integer DEFAULT 4 NOT NULL,
        "is_published" boolean DEFAULT true NOT NULL,
        "exam_target" text[],
        "source" text DEFAULT 'MANUAL' NOT NULL,
        "review_status" text DEFAULT 'approved' NOT NULL,
        "language" text DEFAULT 'en' NOT NULL,
        "created_by" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "deletion_requested_at" timestamp,
        "deletion_requested_by" uuid,
        "deletion_reason" text,
        "deleted_at" timestamp,
        "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(question_text, '')), 'A') || setweight(to_tsvector('english', coalesce(topic, '')), 'B') || setweight(to_tsvector('english', coalesce(solution, '')), 'C')) STORED
);
--> statement-breakpoint
CREATE TABLE "question_bank_saved_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "query_string" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_bank"."question_bookmarks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_hits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "hit_key" text NOT NULL,
        "route" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recording_stream_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "token" text NOT NULL,
        "recording_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "ip" text,
        "user_agent" text,
        "expires_at" timestamp NOT NULL,
        "consumed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "recording_stream_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "results" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_name" text NOT NULL,
        "exam_name" text NOT NULL,
        "subject" text,
        "marks" text,
        "rank" text NOT NULL,
        "college" text,
        "batch" text,
        "academic_year" text NOT NULL,
        "quote" text,
        "initials" text NOT NULL,
        "is_topper" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid,
        "teacher_id" uuid,
        "subject" text NOT NULL,
        "topic" text,
        "day_of_week" integer NOT NULL,
        "start_time" text NOT NULL,
        "end_time" text NOT NULL,
        "room" text,
        "is_recurring" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "event_type" text NOT NULL,
        "actor_email" text,
        "ip" text,
        "user_agent" text,
        "route" text,
        "outcome" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_overrides" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "route" text NOT NULL,
        "title" text,
        "description" text,
        "focus_keyword" text,
        "no_index" boolean DEFAULT false,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "seo_overrides_route_unique" UNIQUE("route")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "key" text NOT NULL,
        "value" text,
        "label" text,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "student_test_results" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "student_id" uuid NOT NULL,
        "batch_id" uuid,
        "exam_name" text NOT NULL,
        "subject" text NOT NULL,
        "total_marks" integer NOT NULL,
        "marks_obtained" integer NOT NULL,
        "rank" text,
        "exam_date" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "batch_id" uuid,
        "roll_number" text NOT NULL,
        "guardian_name" text,
        "guardian_phone" text,
        "date_of_birth" timestamp,
        "address" text,
        "previous_school" text,
        "fee_plan" text DEFAULT 'annual',
        "enrolled_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "students_roll_number_unique" UNIQUE("roll_number")
);
--> statement-breakpoint
CREATE TABLE "study_materials" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "batch_id" uuid,
        "uploaded_by" uuid,
        "title" text NOT NULL,
        "subject" text NOT NULL,
        "type" "material_type" DEFAULT 'notes' NOT NULL,
        "file_url" text,
        "file_size" text,
        "download_count" integer DEFAULT 0,
        "is_visible" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "designation" text NOT NULL,
        "qualification" text,
        "subjects" text[],
        "experience_years" integer,
        "bio" text,
        "initials" text,
        "is_examiner" boolean DEFAULT false NOT NULL,
        "joined_at" timestamp DEFAULT now() NOT NULL,
        "is_active" boolean DEFAULT true,
        "photo_url" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "clerk_user_id" text NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "role" "role" DEFAULT 'student' NOT NULL,
        "fcm_token" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watermark_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "doc_type" text NOT NULL,
        "enabled" boolean DEFAULT true NOT NULL,
        "text_template" text DEFAULT '{{centreName}} • {{userName}} • {{date}}' NOT NULL,
        "position" text DEFAULT 'tile' NOT NULL,
        "opacity" integer DEFAULT 12 NOT NULL,
        "rotation" integer DEFAULT 45 NOT NULL,
        "font_size" integer DEFAULT 36 NOT NULL,
        "color" text DEFAULT '#888888' NOT NULL,
        "logo_object_path" text,
        "use_global" boolean DEFAULT true NOT NULL,
        "updated_by" uuid,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "watermark_settings_doc_type_unique" UNIQUE("doc_type")
);
--> statement-breakpoint
ALTER TABLE "ai_feature_models" ADD CONSTRAINT "ai_feature_models_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_schedules" ADD CONSTRAINT "assignment_schedules_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_schedules" ADD CONSTRAINT "assignment_schedules_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_schedule_id_assignment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."assignment_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_low_alerts" ADD CONSTRAINT "attendance_low_alerts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_recordings" ADD CONSTRAINT "class_recordings_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_recordings" ADD CONSTRAINT "class_recordings_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_recordings" ADD CONSTRAINT "class_recordings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_answer_votes" ADD CONSTRAINT "doubt_answer_votes_answer_id_doubt_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."doubt_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_answer_votes" ADD CONSTRAINT "doubt_answer_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_answers" ADD CONSTRAINT "doubt_answers_doubt_id_doubts_id_fk" FOREIGN KEY ("doubt_id") REFERENCES "public"."doubts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubt_answers" ADD CONSTRAINT "doubt_answers_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_answers" ADD CONSTRAINT "mock_test_answers_attempt_id_mock_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."mock_test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_answers" ADD CONSTRAINT "mock_test_answers_question_id_mock_test_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."mock_test_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_attempts" ADD CONSTRAINT "mock_test_attempts_test_id_mock_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_attempts" ADD CONSTRAINT "mock_test_attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_notifications" ADD CONSTRAINT "mock_test_notifications_test_id_mock_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_test_id_mock_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_questions" ADD CONSTRAINT "mock_test_questions_section_id_mock_test_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."mock_test_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_sections" ADD CONSTRAINT "mock_test_sections_test_id_mock_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_target_batch_id_batches_id_fk" FOREIGN KEY ("target_batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_papers" ADD CONSTRAINT "practice_papers_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_assignments" ADD CONSTRAINT "practice_set_assignments_set_id_practice_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."practice_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_assignments" ADD CONSTRAINT "practice_set_assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_assignments" ADD CONSTRAINT "practice_set_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_assignments" ADD CONSTRAINT "practice_set_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_questions" ADD CONSTRAINT "practice_set_questions_set_id_practice_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."practice_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_set_questions" ADD CONSTRAINT "practice_set_questions_question_id_question_bank_id_fk" FOREIGN KEY ("question_id") REFERENCES "question_bank"."question_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sets" ADD CONSTRAINT "practice_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_attempts" ADD CONSTRAINT "question_attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_attempts" ADD CONSTRAINT "question_attempts_question_id_question_bank_id_fk" FOREIGN KEY ("question_id") REFERENCES "question_bank"."question_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_bank" ADD CONSTRAINT "question_bank_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_bank" ADD CONSTRAINT "question_bank_deletion_requested_by_users_id_fk" FOREIGN KEY ("deletion_requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank_saved_views" ADD CONSTRAINT "question_bank_saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_bookmarks" ADD CONSTRAINT "question_bookmarks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank"."question_bookmarks" ADD CONSTRAINT "question_bookmarks_question_id_question_bank_id_fk" FOREIGN KEY ("question_id") REFERENCES "question_bank"."question_bank"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_stream_tokens" ADD CONSTRAINT "recording_stream_tokens_recording_id_class_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."class_recordings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_stream_tokens" ADD CONSTRAINT "recording_stream_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_test_results" ADD CONSTRAINT "student_test_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_test_results" ADD CONSTRAINT "student_test_results_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watermark_settings" ADD CONSTRAINT "watermark_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_schedule_due_uq" ON "assignments" USING btree ("schedule_id","due_date") WHERE schedule_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "ip_lockouts_ip_idx" ON "ip_lockouts" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "ip_lockouts_locked_until_idx" ON "ip_lockouts" USING btree ("locked_until");--> statement-breakpoint
CREATE UNIQUE INDEX "mock_test_answers_attempt_question_uq" ON "mock_test_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mock_test_notifications_test_kind_uniq" ON "mock_test_notifications" USING btree ("test_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "page_views_path_date_device_ref_uq" ON "page_views" USING btree ("path","date","device_type","referrer");--> statement-breakpoint
CREATE INDEX "page_views_date_idx" ON "page_views" USING btree ("date");--> statement-breakpoint
CREATE INDEX "practice_set_assignments_set_idx" ON "practice_set_assignments" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "practice_set_assignments_batch_idx" ON "practice_set_assignments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "practice_set_assignments_student_idx" ON "practice_set_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "practice_set_questions_unique_idx" ON "practice_set_questions" USING btree ("set_id","question_id");--> statement-breakpoint
CREATE INDEX "practice_set_questions_set_idx" ON "practice_set_questions" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "practice_sets_created_by_idx" ON "practice_sets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "practice_sets_subject_idx" ON "practice_sets" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "question_bank_subject_idx" ON "question_bank"."question_bank" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "question_bank_topic_idx" ON "question_bank"."question_bank" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "question_bank_year_idx" ON "question_bank"."question_bank" USING btree ("year");--> statement-breakpoint
CREATE INDEX "question_bank_exam_name_idx" ON "question_bank"."question_bank" USING btree ("exam_name");--> statement-breakpoint
CREATE INDEX "question_bank_deleted_at_idx" ON "question_bank"."question_bank" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "question_bank_deletion_requested_at_idx" ON "question_bank"."question_bank" USING btree ("deletion_requested_at");--> statement-breakpoint
CREATE INDEX "question_bank_search_vector_idx" ON "question_bank"."question_bank" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "question_bank_source_idx" ON "question_bank"."question_bank" USING btree ("source");--> statement-breakpoint
CREATE INDEX "question_bank_review_status_idx" ON "question_bank"."question_bank" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "question_bank_class_grade_idx" ON "question_bank"."question_bank" USING btree ("class_grade");--> statement-breakpoint
CREATE INDEX "question_bank_exam_target_idx" ON "question_bank"."question_bank" USING gin ("exam_target");--> statement-breakpoint
CREATE INDEX "question_bank_saved_views_user_idx" ON "question_bank_saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_bank_saved_views_user_name_uq" ON "question_bank_saved_views" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "rl_hits_key_route_created_idx" ON "rate_limit_hits" USING btree ("hit_key","route","created_at");--> statement-breakpoint
CREATE INDEX "security_events_ip_idx" ON "security_events" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "security_events_created_at_idx" ON "security_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_events_event_type_idx" ON "security_events" USING btree ("event_type");