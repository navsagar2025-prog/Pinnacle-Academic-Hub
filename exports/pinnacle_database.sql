--
-- PostgreSQL database dump
--

\restrict gHIzFneqzBgYe0CRbSA1tG2zCKFOhRSzEctg6XD2iHNBFEZX69glFwcT4EJHAL8

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY question_bank.question_bookmarks DROP CONSTRAINT IF EXISTS question_bookmarks_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY question_bank.question_bookmarks DROP CONSTRAINT IF EXISTS question_bookmarks_question_id_question_bank_id_fk;
ALTER TABLE IF EXISTS ONLY question_bank.question_bank DROP CONSTRAINT IF EXISTS question_bank_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY question_bank.question_attempts DROP CONSTRAINT IF EXISTS question_attempts_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY question_bank.question_attempts DROP CONSTRAINT IF EXISTS question_attempts_question_id_question_bank_id_fk;
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS teachers_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.study_materials DROP CONSTRAINT IF EXISTS study_materials_uploaded_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.study_materials DROP CONSTRAINT IF EXISTS study_materials_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.student_test_results DROP CONSTRAINT IF EXISTS student_test_results_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.student_test_results DROP CONSTRAINT IF EXISTS student_test_results_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.schedules DROP CONSTRAINT IF EXISTS schedules_teacher_id_teachers_id_fk;
ALTER TABLE IF EXISTS ONLY public.schedules DROP CONSTRAINT IF EXISTS schedules_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.practice_papers DROP CONSTRAINT IF EXISTS practice_papers_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.parents DROP CONSTRAINT IF EXISTS parents_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.parents DROP CONSTRAINT IF EXISTS parents_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.notices DROP CONSTRAINT IF EXISTS notices_target_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.notices DROP CONSTRAINT IF EXISTS notices_posted_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_tests DROP CONSTRAINT IF EXISTS mock_tests_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_tests DROP CONSTRAINT IF EXISTS mock_tests_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_test_questions DROP CONSTRAINT IF EXISTS mock_test_questions_test_id_mock_tests_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_test_attempts DROP CONSTRAINT IF EXISTS mock_test_attempts_test_id_mock_tests_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_test_attempts DROP CONSTRAINT IF EXISTS mock_test_attempts_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_test_answers DROP CONSTRAINT IF EXISTS mock_test_answers_question_id_mock_test_questions_id_fk;
ALTER TABLE IF EXISTS ONLY public.mock_test_answers DROP CONSTRAINT IF EXISTS mock_test_answers_attempt_id_mock_test_attempts_id_fk;
ALTER TABLE IF EXISTS ONLY public.live_classes DROP CONSTRAINT IF EXISTS live_classes_teacher_id_teachers_id_fk;
ALTER TABLE IF EXISTS ONLY public.live_classes DROP CONSTRAINT IF EXISTS live_classes_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.fee_records DROP CONSTRAINT IF EXISTS fee_records_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubts DROP CONSTRAINT IF EXISTS doubts_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubts DROP CONSTRAINT IF EXISTS doubts_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubt_answers DROP CONSTRAINT IF EXISTS doubt_answers_doubt_id_doubts_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubt_answers DROP CONSTRAINT IF EXISTS doubt_answers_author_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubt_answer_votes DROP CONSTRAINT IF EXISTS doubt_answer_votes_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.doubt_answer_votes DROP CONSTRAINT IF EXISTS doubt_answer_votes_answer_id_doubt_answers_id_fk;
ALTER TABLE IF EXISTS ONLY public.class_recordings DROP CONSTRAINT IF EXISTS class_recordings_live_class_id_live_classes_id_fk;
ALTER TABLE IF EXISTS ONLY public.class_recordings DROP CONSTRAINT IF EXISTS class_recordings_batch_id_batches_id_fk;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_course_id_courses_id_fk;
ALTER TABLE IF EXISTS ONLY public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.attendance DROP CONSTRAINT IF EXISTS attendance_marked_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.attendance_low_alerts DROP CONSTRAINT IF EXISTS attendance_low_alerts_student_id_students_id_fk;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_posted_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_batch_id_batches_id_fk;
DROP INDEX IF EXISTS question_bank.question_bank_year_idx;
DROP INDEX IF EXISTS question_bank.question_bank_topic_idx;
DROP INDEX IF EXISTS question_bank.question_bank_subject_idx;
DROP INDEX IF EXISTS question_bank.question_bank_search_vector_idx;
ALTER TABLE IF EXISTS ONLY question_bank.question_bookmarks DROP CONSTRAINT IF EXISTS question_bookmarks_pkey;
ALTER TABLE IF EXISTS ONLY question_bank.question_bank DROP CONSTRAINT IF EXISTS question_bank_pkey;
ALTER TABLE IF EXISTS ONLY question_bank.question_attempts DROP CONSTRAINT IF EXISTS question_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_clerk_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS teachers_pkey;
ALTER TABLE IF EXISTS ONLY public.study_materials DROP CONSTRAINT IF EXISTS study_materials_pkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_roll_number_unique;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY public.student_test_results DROP CONSTRAINT IF EXISTS student_test_results_pkey;
ALTER TABLE IF EXISTS ONLY public.site_settings DROP CONSTRAINT IF EXISTS site_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.site_settings DROP CONSTRAINT IF EXISTS site_settings_key_unique;
ALTER TABLE IF EXISTS ONLY public.seo_overrides DROP CONSTRAINT IF EXISTS seo_overrides_route_unique;
ALTER TABLE IF EXISTS ONLY public.seo_overrides DROP CONSTRAINT IF EXISTS seo_overrides_pkey;
ALTER TABLE IF EXISTS ONLY public.schedules DROP CONSTRAINT IF EXISTS schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.results DROP CONSTRAINT IF EXISTS results_pkey;
ALTER TABLE IF EXISTS ONLY public.practice_papers DROP CONSTRAINT IF EXISTS practice_papers_pkey;
ALTER TABLE IF EXISTS ONLY public.parents DROP CONSTRAINT IF EXISTS parents_pkey;
ALTER TABLE IF EXISTS ONLY public.notices DROP CONSTRAINT IF EXISTS notices_pkey;
ALTER TABLE IF EXISTS ONLY public.mock_tests DROP CONSTRAINT IF EXISTS mock_tests_pkey;
ALTER TABLE IF EXISTS ONLY public.mock_test_questions DROP CONSTRAINT IF EXISTS mock_test_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.mock_test_attempts DROP CONSTRAINT IF EXISTS mock_test_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.mock_test_answers DROP CONSTRAINT IF EXISTS mock_test_answers_pkey;
ALTER TABLE IF EXISTS ONLY public.live_classes DROP CONSTRAINT IF EXISTS live_classes_pkey;
ALTER TABLE IF EXISTS ONLY public.gallery_items DROP CONSTRAINT IF EXISTS gallery_items_pkey;
ALTER TABLE IF EXISTS ONLY public.fee_records DROP CONSTRAINT IF EXISTS fee_records_pkey;
ALTER TABLE IF EXISTS ONLY public.enquiries DROP CONSTRAINT IF EXISTS enquiries_pkey;
ALTER TABLE IF EXISTS ONLY public.doubts DROP CONSTRAINT IF EXISTS doubts_pkey;
ALTER TABLE IF EXISTS ONLY public.doubt_answers DROP CONSTRAINT IF EXISTS doubt_answers_pkey;
ALTER TABLE IF EXISTS ONLY public.doubt_answer_votes DROP CONSTRAINT IF EXISTS doubt_answer_votes_pkey;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_slug_unique;
ALTER TABLE IF EXISTS ONLY public.courses DROP CONSTRAINT IF EXISTS courses_pkey;
ALTER TABLE IF EXISTS ONLY public.class_recordings DROP CONSTRAINT IF EXISTS class_recordings_pkey;
ALTER TABLE IF EXISTS ONLY public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_unique;
ALTER TABLE IF EXISTS ONLY public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_pkey;
ALTER TABLE IF EXISTS ONLY public.batches DROP CONSTRAINT IF EXISTS batches_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance DROP CONSTRAINT IF EXISTS attendance_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_low_alerts DROP CONSTRAINT IF EXISTS attendance_low_alerts_student_id_unique;
ALTER TABLE IF EXISTS ONLY public.attendance_low_alerts DROP CONSTRAINT IF EXISTS attendance_low_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;
DROP TABLE IF EXISTS question_bank.question_bookmarks;
DROP TABLE IF EXISTS question_bank.question_bank;
DROP TABLE IF EXISTS question_bank.question_attempts;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.teachers;
DROP TABLE IF EXISTS public.study_materials;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.student_test_results;
DROP TABLE IF EXISTS public.site_settings;
DROP TABLE IF EXISTS public.seo_overrides;
DROP TABLE IF EXISTS public.schedules;
DROP TABLE IF EXISTS public.results;
DROP TABLE IF EXISTS public.practice_papers;
DROP TABLE IF EXISTS public.parents;
DROP TABLE IF EXISTS public.notices;
DROP TABLE IF EXISTS public.mock_tests;
DROP TABLE IF EXISTS public.mock_test_questions;
DROP TABLE IF EXISTS public.mock_test_attempts;
DROP TABLE IF EXISTS public.mock_test_answers;
DROP TABLE IF EXISTS public.live_classes;
DROP TABLE IF EXISTS public.gallery_items;
DROP TABLE IF EXISTS public.fee_records;
DROP TABLE IF EXISTS public.enquiries;
DROP TABLE IF EXISTS public.doubts;
DROP TABLE IF EXISTS public.doubt_answers;
DROP TABLE IF EXISTS public.doubt_answer_votes;
DROP TABLE IF EXISTS public.courses;
DROP TABLE IF EXISTS public.class_recordings;
DROP TABLE IF EXISTS public.blog_posts;
DROP TABLE IF EXISTS public.batches;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.attendance_low_alerts;
DROP TABLE IF EXISTS public.attendance;
DROP TABLE IF EXISTS public.assignments;
DROP TYPE IF EXISTS public.role;
DROP TYPE IF EXISTS public.question_type;
DROP TYPE IF EXISTS public.question_difficulty;
DROP TYPE IF EXISTS public.notice_category;
DROP TYPE IF EXISTS public.material_type;
DROP TYPE IF EXISTS public.fee_status;
DROP TYPE IF EXISTS public.enquiry_status;
DROP TYPE IF EXISTS public.class_status;
DROP TYPE IF EXISTS public.blog_status;
DROP TYPE IF EXISTS public.batch_status;
DROP TYPE IF EXISTS public.attendance_status;
DROP SCHEMA IF EXISTS question_bank;
--
-- Name: question_bank; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA question_bank;


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'present',
    'absent',
    'late'
);


--
-- Name: batch_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.batch_status AS ENUM (
    'active',
    'upcoming',
    'full',
    'completed'
);


--
-- Name: blog_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.blog_status AS ENUM (
    'draft',
    'published'
);


--
-- Name: class_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.class_status AS ENUM (
    'scheduled',
    'live',
    'completed',
    'cancelled'
);


--
-- Name: enquiry_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enquiry_status AS ENUM (
    'new',
    'contacted',
    'interested',
    'converted',
    'declined'
);


--
-- Name: fee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fee_status AS ENUM (
    'paid',
    'partial',
    'due',
    'overdue',
    'waived'
);


--
-- Name: material_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.material_type AS ENUM (
    'notes',
    'formula',
    'exercise',
    'summary',
    'paper'
);


--
-- Name: notice_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notice_category AS ENUM (
    'Academic',
    'Test',
    'Fee',
    'Event',
    'Admissions',
    'General'
);


--
-- Name: question_difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_difficulty AS ENUM (
    'easy',
    'medium',
    'hard'
);


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'mcq',
    'short',
    'long',
    'numerical'
);


--
-- Name: role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role AS ENUM (
    'student',
    'parent',
    'teacher',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid,
    posted_by uuid,
    title text NOT NULL,
    subject text NOT NULL,
    description text,
    file_url text,
    due_date timestamp without time zone NOT NULL,
    max_marks integer,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    date timestamp without time zone NOT NULL,
    subject text NOT NULL,
    status public.attendance_status DEFAULT 'present'::public.attendance_status NOT NULL,
    note text,
    marked_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_low_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_low_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    notified_at timestamp without time zone DEFAULT now() NOT NULL,
    notified_pct integer NOT NULL,
    has_recovered boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    actor_name text,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    details jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    name text NOT NULL,
    timing_label text NOT NULL,
    days_label text NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    max_students integer DEFAULT 30,
    status public.batch_status DEFAULT 'active'::public.batch_status,
    room text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text,
    category text DEFAULT 'General'::text NOT NULL,
    author_name text NOT NULL,
    featured_image_url text,
    status public.blog_status DEFAULT 'draft'::public.blog_status NOT NULL,
    read_minutes integer DEFAULT 5,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tags text[]
);


--
-- Name: class_recordings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    live_class_id uuid,
    batch_id uuid,
    title text NOT NULL,
    subject text NOT NULL,
    teacher_name text,
    recording_url text NOT NULL,
    duration_minutes integer,
    is_visible boolean DEFAULT true,
    view_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    duration_label text,
    annual_fee integer NOT NULL,
    admission_fee integer DEFAULT 2000,
    max_batch_size integer DEFAULT 35,
    eligibility text,
    highlights text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'General'::text,
    start_date timestamp without time zone,
    featured_image_url text
);


--
-- Name: doubt_answer_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doubt_answer_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    answer_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: doubt_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doubt_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doubt_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_role text NOT NULL,
    answer_text text NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    is_official boolean DEFAULT false NOT NULL
);


--
-- Name: doubts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doubts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    batch_id uuid,
    subject text NOT NULL,
    topic text,
    question_text text NOT NULL,
    image_url text,
    status text DEFAULT 'open'::text NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    answer_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    course_interest text,
    message text,
    source text DEFAULT 'website'::text,
    is_followed_up boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    admission_status public.enquiry_status DEFAULT 'new'::public.enquiry_status,
    notes text
);


--
-- Name: fee_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    period text NOT NULL,
    amount integer NOT NULL,
    due_date timestamp without time zone NOT NULL,
    paid_date timestamp without time zone,
    status public.fee_status DEFAULT 'due'::public.fee_status NOT NULL,
    transaction_ref text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    paid_amount integer DEFAULT 0 NOT NULL,
    razorpay_order_id text,
    razorpay_payment_id text,
    payment_method text
);


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    caption text,
    category text DEFAULT 'General'::text NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: live_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.live_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid,
    teacher_id uuid,
    topic text NOT NULL,
    subject text,
    zoom_meeting_id text,
    zoom_join_url text,
    zoom_passcode text,
    scheduled_at timestamp without time zone NOT NULL,
    status public.class_status DEFAULT 'scheduled'::public.class_status,
    duration_minutes integer,
    recording_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    zoom_host_url text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mock_test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mock_test_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option text,
    is_correct boolean,
    marks_awarded integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mock_test_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mock_test_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    student_id uuid,
    guest_name text,
    guest_email text,
    guest_phone text,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    submitted_at timestamp without time zone,
    total_questions integer DEFAULT 0 NOT NULL,
    attempted_count integer DEFAULT 0 NOT NULL,
    correct_count integer DEFAULT 0 NOT NULL,
    wrong_count integer DEFAULT 0 NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    max_score integer DEFAULT 0 NOT NULL,
    time_spent_seconds integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL
);


--
-- Name: mock_test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mock_test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    question_number integer NOT NULL,
    question_text text NOT NULL,
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_option text NOT NULL,
    topic text,
    explanation text,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mock_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mock_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subject text NOT NULL,
    exam_type text DEFAULT 'Mixed'::text,
    batch_id uuid,
    duration_minutes integer DEFAULT 60 NOT NULL,
    marks_per_question integer DEFAULT 4 NOT NULL,
    negative_marking_percent integer DEFAULT 25 NOT NULL,
    instructions text,
    is_published boolean DEFAULT false NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    scheduled_start timestamp without time zone,
    scheduled_end timestamp without time zone,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    posted_by uuid,
    title text NOT NULL,
    body text NOT NULL,
    category public.notice_category DEFAULT 'General'::public.notice_category NOT NULL,
    is_public boolean DEFAULT true,
    target_batch_id uuid,
    published_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    student_id uuid,
    relation text DEFAULT 'Parent'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: practice_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_papers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid,
    title text NOT NULL,
    paper_type text NOT NULL,
    subject text NOT NULL,
    duration_minutes integer,
    total_questions integer,
    max_marks integer,
    file_url text,
    download_count integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_name text NOT NULL,
    exam_name text NOT NULL,
    rank text NOT NULL,
    college text,
    batch text,
    academic_year text NOT NULL,
    quote text,
    initials text NOT NULL,
    is_topper boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    subject text,
    marks text
);


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid,
    teacher_id uuid,
    subject text NOT NULL,
    topic text,
    day_of_week integer NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    room text,
    is_recurring boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: seo_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    route text NOT NULL,
    title text,
    description text,
    focus_keyword text,
    no_index boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    label text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: student_test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    batch_id uuid,
    exam_name text NOT NULL,
    subject text NOT NULL,
    total_marks integer NOT NULL,
    marks_obtained integer NOT NULL,
    rank text,
    exam_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    batch_id uuid,
    roll_number text NOT NULL,
    guardian_name text,
    guardian_phone text,
    date_of_birth timestamp without time zone,
    address text,
    previous_school text,
    enrolled_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    fee_plan text DEFAULT 'annual'::text
);


--
-- Name: study_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid,
    uploaded_by uuid,
    title text NOT NULL,
    subject text NOT NULL,
    type public.material_type DEFAULT 'notes'::public.material_type NOT NULL,
    file_url text,
    file_size text,
    download_count integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    designation text NOT NULL,
    qualification text,
    subjects text[],
    experience_years integer,
    bio text,
    initials text,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    photo_url text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clerk_user_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role public.role DEFAULT 'student'::public.role NOT NULL,
    fcm_token text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: question_attempts; Type: TABLE; Schema: question_bank; Owner: -
--

CREATE TABLE question_bank.question_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    question_id uuid NOT NULL,
    submitted_answer text,
    is_correct boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    time_spent_seconds integer
);


--
-- Name: question_bank; Type: TABLE; Schema: question_bank; Owner: -
--

CREATE TABLE question_bank.question_bank (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject text NOT NULL,
    topic text,
    class_grade text,
    year integer,
    difficulty public.question_difficulty DEFAULT 'medium'::public.question_difficulty NOT NULL,
    question_type public.question_type DEFAULT 'mcq'::public.question_type NOT NULL,
    question_text text NOT NULL,
    options jsonb,
    correct_answer text NOT NULL,
    solution text,
    image_url text,
    solution_image_url text,
    marks integer DEFAULT 4 NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (((setweight(to_tsvector('english'::regconfig, COALESCE(question_text, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(topic, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(solution, ''::text)), 'C'::"char"))) STORED
);


--
-- Name: question_bookmarks; Type: TABLE; Schema: question_bank; Owner: -
--

CREATE TABLE question_bank.question_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    question_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, batch_id, posted_by, title, subject, description, file_url, due_date, max_marks, is_visible, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance (id, student_id, date, subject, status, note, marked_by, created_at) FROM stdin;
\.


--
-- Data for Name: attendance_low_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_low_alerts (id, student_id, notified_at, notified_pct, has_recovered, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, actor_name, action, entity_type, entity_id, details, created_at) FROM stdin;
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at) FROM stdin;
7465dfd1-952b-4e6b-b029-ae13260672d3	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Morning Batch A	6:30 AM – 9:00 AM	Mon–Sat	\N	\N	30	active	Room 101	2026-04-30 13:17:49.315993	2026-04-30 13:26:19.394252
7813b426-fc9e-4678-bc20-51c33afc5cbd	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Evening Batch B	4:00 PM – 6:30 PM	Mon–Sat	\N	\N	30	active	Room 102	2026-04-30 13:17:49.315993	2026-04-30 13:26:19.394252
dbc03dd3-e7b0-49b4-9889-ccdd0d436ff0	7ee1d58e-83da-472a-84e8-292627153027	NEET Morning Batch	7:00 AM – 9:30 AM	Mon–Sat	\N	\N	30	active	Room 201	2026-04-30 13:17:49.315993	2026-04-30 13:26:19.394252
7d4fdd4f-40d1-485c-b547-0dc44cd5d91e	c5d0b90d-a71e-4c3a-b738-e21fa051a66e	Boards Afternoon Batch	2:00 PM – 4:30 PM	Mon–Fri	\N	\N	35	active	Room 301	2026-04-30 13:17:49.315993	2026-04-30 13:26:19.394252
f868391f-866c-49fa-97ed-3abdc622bbfb	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Morning Batch A	6:30 AM – 9:00 AM	Mon–Sat	\N	\N	30	active	Room 101	2026-04-30 13:18:38.172822	2026-04-30 13:26:19.394252
19e9a416-5a86-4446-aa42-0931718f2e71	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Evening Batch B	4:00 PM – 6:30 PM	Mon–Sat	\N	\N	30	active	Room 102	2026-04-30 13:18:38.172822	2026-04-30 13:26:19.394252
a86e62a9-a1d3-4157-a9e2-a851fa7e2bdb	7ee1d58e-83da-472a-84e8-292627153027	NEET Morning Batch	7:00 AM – 9:30 AM	Mon–Sat	\N	\N	30	active	Room 201	2026-04-30 13:18:38.172822	2026-04-30 13:26:19.394252
c5ff948f-aaf4-4f4d-bed8-947a31d5ceb1	c5d0b90d-a71e-4c3a-b738-e21fa051a66e	Boards Afternoon Batch	2:00 PM – 4:30 PM	Mon–Fri	\N	\N	35	active	Room 301	2026-04-30 13:18:38.172822	2026-04-30 13:26:19.394252
c158e637-9235-4f99-964e-3b4544df55e0	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Morning Batch A	6:30 AM – 9:00 AM	Mon–Sat	\N	\N	30	active	Room 101	2026-04-30 14:15:56.462625	2026-04-30 14:15:56.462625
1e5a20e3-da76-4f48-b36f-87239c4c37dd	c2bc9591-a2e1-435b-987a-fa0fb7b932be	JEE Evening Batch B	4:00 PM – 6:30 PM	Mon–Sat	\N	\N	30	active	Room 102	2026-04-30 14:15:56.462625	2026-04-30 14:15:56.462625
6101b463-b347-460d-bb76-d034986b7572	7ee1d58e-83da-472a-84e8-292627153027	NEET Morning Batch	7:00 AM – 9:30 AM	Mon–Sat	\N	\N	30	active	Room 201	2026-04-30 14:15:56.462625	2026-04-30 14:15:56.462625
ab1588d4-45e0-4da0-b1e0-ac45774027c7	c5d0b90d-a71e-4c3a-b738-e21fa051a66e	Boards Afternoon Batch	2:00 PM – 4:30 PM	Mon–Fri	\N	\N	35	active	Room 301	2026-04-30 14:15:56.462625	2026-04-30 14:15:56.462625
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, slug, title, excerpt, content, category, author_name, featured_image_url, status, read_minutes, published_at, created_at, updated_at, tags) FROM stdin;
\.


--
-- Data for Name: class_recordings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.class_recordings (id, live_class_id, batch_id, title, subject, teacher_name, recording_url, duration_minutes, is_visible, view_count, created_at, updated_at) FROM stdin;
a2c4e8c9-2f89-4a76-8108-49d8225e2c93	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Thermodynamics — Laws of Thermodynamics	Physics	Dr. Ramesh Kumar	#	105	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
d645fba5-59f4-40ae-80b5-4cc8b0dad9e2	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Coordination Compounds — Full Chapter	Chemistry	Ms. Priya Sharma	#	130	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
c409441c-edac-429d-9767-a3e8780ac7fd	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Differential Equations — Introduction	Mathematics	Mr. Ajay Tiwari	#	115	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
ab7cada9-b0b8-4cc3-85bf-1f11193634c9	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Wave Optics — Complete Chapter	Physics	Dr. Ramesh Kumar	#	125	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
98409251-624b-45ee-a026-111e3b3be12c	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Organic Chemistry — Named Reactions	Chemistry	Ms. Priya Sharma	#	100	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
417ea9e9-8a17-447b-b38e-54e5f452e9e8	\N	7813b426-fc9e-4678-bc20-51c33afc5cbd	Complex Numbers — Master Class	Mathematics	Mr. Ajay Tiwari	#	120	t	0	2026-04-30 14:15:56.817016	2026-04-30 14:15:56.817016
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, slug, title, description, duration_label, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at, category, start_date, featured_image_url) FROM stdin;
c2bc9591-a2e1-435b-987a-fa0fb7b932be	jee-main-advanced	JEE Main & Advanced	Comprehensive 2-year program covering Physics, Chemistry & Mathematics for IIT/NIT aspirants.	2 Years	95000	3000	30	Class 10 pass / Class 11 students	{"Expert IITian Faculty","Biweekly Full Tests","Doubt Sessions 6 Days/Week","Study Material + DPPs","Online + Offline Access"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
7ee1d58e-83da-472a-84e8-292627153027	neet-ug	NEET UG	Intensive Medical entrance preparation covering Physics, Chemistry & Biology with focus on NCERT mastery.	2 Years	90000	3000	30	Class 10 pass / Class 11 students	{"NEET-Focused Curriculum","NCERT Line-by-Line Coverage","Full-Length Mock Tests","Biology Deep-Dive Sessions","Video Recordings Available"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
c5d0b90d-a71e-4c3a-b738-e21fa051a66e	class-11-12-boards	Class 11–12 Boards	Strong foundation in CBSE/ICSE subjects to ensure 90%+ board results with holistic academic development.	1 Year	55000	2000	35	Class 10 pass (any board)	{"CBSE & ICSE Coverage","Sample Paper Practice","Chapter-wise Tests","Parent Progress Reports","Scholarship for Merit Students"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
f9469114-713d-46fe-a3b2-797b9a245201	foundation-class-9-10	Foundation (Class 9–10)	Early preparation for competitive exams alongside board exams. Builds conceptual clarity from the ground up.	1-2 Years	45000	2000	35	Class 8 pass / Class 9 students	{"NTSE / Olympiad Prep","Board Exam Alignment","Mental Math & Speed","Reasoning & Aptitude","Monthly Parent-Teacher Meet"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
095bb052-4aa8-4956-8dcf-2adaf2575fc7	dropper-jee	JEE Dropper Batch	Intensive 1-year revision and exam strategy program for repeat JEE aspirants targeting top NIT/IIT ranks.	1 Year	75000	2500	25	Class 12 pass (any stream with PCM)	{"Full Syllabus Revision","Rank Improvement Focus","3 Full Mocks/Week","Personal Mentor","Previous Year Analysis"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
35c911cb-e2ad-4242-9c00-567808d781a7	dropper-neet	NEET Dropper Batch	Structured revision program for NEET repeaters with intensive biology sessions and full mock test series.	1 Year	72000	2500	25	Class 12 pass with PCB	{"Biology Marathon Sessions","NTA-Pattern Mocks","Error Analysis Workshop","Counselling Support","Last-Mile Revision Modules"}	t	2026-04-30 13:17:49.271152	2026-04-30 13:26:19.381646	General	\N	\N
\.


--
-- Data for Name: doubt_answer_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doubt_answer_votes (id, answer_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: doubt_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doubt_answers (id, doubt_id, author_id, author_role, answer_text, image_url, created_at, upvotes, is_official) FROM stdin;
\.


--
-- Data for Name: doubts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doubts (id, student_id, batch_id, subject, topic, question_text, image_url, status, is_resolved, answer_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: enquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enquiries (id, name, phone, email, course_interest, message, source, is_followed_up, created_at, updated_at, admission_status, notes) FROM stdin;
89c6ccbb-f762-4786-afdc-5bbf36cf53e2	Arjun Mehta	+91 98100 11001	arjun.m@example.com	JEE Main & Advanced	My son is in Class 10 and wants to prepare for JEE. Can we visit for a demo class?	website	f	2026-04-30 13:18:38.216986	2026-04-30 13:26:19.364893	new	\N
287c855d-96ff-43ca-a098-720a561a8507	Priya Sharma	+91 99100 22002	priya.s@example.com	NEET UG	Interested in NEET preparation for my daughter. Please share fee structure and batch timings.	website	f	2026-04-30 13:18:38.216986	2026-04-30 13:26:19.364893	new	\N
86227e05-900c-44bc-959f-f123a1d78008	Rajesh Kumar	+91 97100 33003	rajesh.k@example.com	NEET Dropper Batch	I appeared in NEET 2024 and scored 540. Want to know about dropper batch and scholarship.	website	f	2026-04-30 13:18:38.216986	2026-04-30 13:26:19.364893	new	\N
076bf690-4cf4-4cba-afe6-db4e9c564252	Test Enquiry	+91 99999 00001	test@test.com	JEE Main & Advanced	Testing the enquiry API	website	f	2026-04-30 13:32:31.237443	2026-04-30 13:32:31.237443	new	\N
c90829f0-20bb-4ed2-b0d9-07bae1e14f53	E2E Test Student	+91 98100 11122	\N	NEET UG	Testing the enquiry submission	website	f	2026-04-30 13:45:00.852258	2026-04-30 13:45:00.852258	new	\N
c9813f79-c778-4895-8912-511cb447343e	Arjun Mehta	+91 98100 11001	arjun.m@example.com	JEE Main & Advanced	My son is in Class 10 and wants to prepare for JEE. Can we visit for a demo class?	website	f	2026-04-30 14:15:56.824265	2026-04-30 14:15:56.824265	new	\N
9d41d3b0-3c76-49f5-b1a6-bdcb53cf78f6	Priya Sharma	+91 99100 22002	priya.s@example.com	NEET UG	Interested in NEET preparation for my daughter. Please share fee structure and batch timings.	website	f	2026-04-30 14:15:56.824265	2026-04-30 14:15:56.824265	new	\N
cfcaf6e3-1757-45e9-860a-79bb09455702	Rajesh Kumar	+91 97100 33003	rajesh.k@example.com	NEET Dropper Batch	I appeared in NEET 2024 and scored 540. Want to know about dropper batch and scholarship.	website	f	2026-04-30 14:15:56.824265	2026-04-30 14:15:56.824265	new	\N
\.


--
-- Data for Name: fee_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_records (id, student_id, period, amount, due_date, paid_date, status, transaction_ref, notes, created_at, updated_at, paid_amount, razorpay_order_id, razorpay_payment_id, payment_method) FROM stdin;
\.


--
-- Data for Name: gallery_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery_items (id, title, caption, category, image_url, sort_order, is_visible, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: live_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.live_classes (id, batch_id, teacher_id, topic, subject, zoom_meeting_id, zoom_join_url, zoom_passcode, scheduled_at, status, duration_minutes, recording_url, created_at, zoom_host_url, updated_at) FROM stdin;
\.


--
-- Data for Name: mock_test_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mock_test_answers (id, attempt_id, question_id, selected_option, is_correct, marks_awarded, created_at) FROM stdin;
\.


--
-- Data for Name: mock_test_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mock_test_attempts (id, test_id, student_id, guest_name, guest_email, guest_phone, started_at, submitted_at, total_questions, attempted_count, correct_count, wrong_count, score, max_score, time_spent_seconds, is_completed) FROM stdin;
\.


--
-- Data for Name: mock_test_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mock_test_questions (id, test_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, topic, explanation, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: mock_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mock_tests (id, title, subject, exam_type, batch_id, duration_minutes, marks_per_question, negative_marking_percent, instructions, is_published, is_public, scheduled_start, scheduled_end, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, expires_at, created_at, updated_at) FROM stdin;
676e46e1-f2ca-4a63-911c-44d44aa9838b	\N	JEE Mains Mock Test — Schedule Released	The full-syllabus mock test for JEE Mains batch is scheduled for Sunday, 5th May 2024 at 9:00 AM in the examination hall. Admit cards will be issued on Friday. Students must carry their ID cards.	Test	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
5cd254b8-abed-405a-b2d7-28dcd05f7949	\N	Summer Vacation Schedule 2024	The institute will remain closed from 20th May to 2nd June 2024 for summer vacation. Special crash course batches will continue as per their separate schedules.	Academic	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
f6a49ca8-2244-43c5-bba9-8d7b47d42291	\N	Fee Payment Reminder — April Installment	This is a gentle reminder that the April installment fee is due by 15th April 2024. Parents/students are requested to complete payment through the fee portal or visit the accounts office.	Fee	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
96d43863-9b47-4f47-9da6-105cdc4e98ff	\N	Annual Science Exhibition — Registrations Open	We are delighted to announce the 5th Annual Science Exhibition on 20th April. Students from all batches are encouraged to participate. Register your project idea with your batch coordinator by 10th April.	Event	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
938c8751-edff-4155-ad17-b1fee42fb6ca	\N	New Batch Starting — NEET Dropper 2024	Admissions are now open for the NEET Dropper Batch 2024. Limited seats (25 only). Scholarship available for applicants scoring 85%+ in the entrance test. Contact admissions office for details.	Admissions	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
6f10a972-2d7b-4bd1-9d71-25506f818ecf	\N	Parent-Teacher Meeting — May 2024	The quarterly PTM is scheduled for Saturday, 11th May 2024 from 9:00 AM to 1:00 PM. Attendance is compulsory. Slot booking will open on 6th May via the parent portal.	General	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
93a38505-9745-4181-bf38-0b2ebcaa5fbe	\N	NEET Biology Marathon Sessions	Special 3-day Biology marathon revision sessions will be conducted from 25th–27th April for NEET students. Focus areas: Genetics, Ecology, and Human Physiology. Attendance mandatory.	Academic	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
fbcc18d3-4663-4a97-ba9a-46b2415dacdf	\N	Results — Internal Test Series #8	Results for Internal Test Series #8 (Physics + Chemistry) are now published on the student portal. Students are advised to collect their answer sheets and attend the solution session on Monday.	Test	t	\N	2026-04-30 13:18:38.208532	\N	2026-04-30 13:18:38.208532	2026-04-30 13:26:19.36836
d1bf0773-0678-4c63-bd29-0a950eb5a70b	\N	JEE Mains Mock Test — Schedule Released	The full-syllabus mock test for JEE Mains batch is scheduled for Sunday, 5th May 2024 at 9:00 AM in the examination hall. Admit cards will be issued on Friday. Students must carry their ID cards.	Test	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
a64efbc6-807f-4002-b004-d3c279a5a4b6	\N	Summer Vacation Schedule 2024	The institute will remain closed from 20th May to 2nd June 2024 for summer vacation. Special crash course batches will continue as per their separate schedules.	Academic	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
1968b787-951f-4f1b-9a72-a2d7360af9dd	\N	Fee Payment Reminder — April Installment	This is a gentle reminder that the April installment fee is due by 15th April 2024. Parents/students are requested to complete payment through the fee portal or visit the accounts office.	Fee	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
b423d0cb-eef3-4d59-bb60-3a8dd2b8d356	\N	Annual Science Exhibition — Registrations Open	We are delighted to announce the 5th Annual Science Exhibition on 20th April. Students from all batches are encouraged to participate. Register your project idea with your batch coordinator by 10th April.	Event	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
d6e34ca0-2f71-44f7-8477-e4997da9077f	\N	New Batch Starting — NEET Dropper 2024	Admissions are now open for the NEET Dropper Batch 2024. Limited seats (25 only). Scholarship available for applicants scoring 85%+ in the entrance test. Contact admissions office for details.	Admissions	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
01a7eb53-85a4-47d1-a5bd-2d402e6129b9	\N	Parent-Teacher Meeting — May 2024	The quarterly PTM is scheduled for Saturday, 11th May 2024 from 9:00 AM to 1:00 PM. Attendance is compulsory. Slot booking will open on 6th May via the parent portal.	General	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
70bcfb5c-5745-4ea6-8789-5f0f554e818e	\N	NEET Biology Marathon Sessions	Special 3-day Biology marathon revision sessions will be conducted from 25th–27th April for NEET students. Focus areas: Genetics, Ecology, and Human Physiology. Attendance mandatory.	Academic	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
7faaaea9-a00f-4edb-98be-2d3b7174013b	\N	Results — Internal Test Series #8	Results for Internal Test Series #8 (Physics + Chemistry) are now published on the student portal. Students are advised to collect their answer sheets and attend the solution session on Monday.	Test	t	\N	2026-04-30 14:15:56.820637	\N	2026-04-30 14:15:56.820637	2026-04-30 14:15:56.820637
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parents (id, user_id, student_id, relation, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: practice_papers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.practice_papers (id, batch_id, title, paper_type, subject, duration_minutes, total_questions, max_marks, file_url, download_count, is_visible, created_at, updated_at) FROM stdin;
bece1766-d828-4b43-b230-80d13d65ea21	7813b426-fc9e-4678-bc20-51c33afc5cbd	JEE Mains — Full Mock Test #8	Full Mock	PCM	180	90	300	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
d582865e-cb3e-4b02-84a1-9cefc3ba6752	7813b426-fc9e-4678-bc20-51c33afc5cbd	JEE Advanced — Paper 1 Practice	JEE Advanced	PCM	180	54	183	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
1b3c4958-e79a-4dbb-96c7-0b45a449fe90	7813b426-fc9e-4678-bc20-51c33afc5cbd	Physics — Wave Optics DPP	DPP	Physics	45	20	60	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
5ef99b63-6bac-4c17-9d2d-7f84218f46fa	7813b426-fc9e-4678-bc20-51c33afc5cbd	Chemistry — Organic Chemistry Test	Chapter Test	Chemistry	60	30	90	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
66601d6b-4dc1-4088-928e-e8e26634aed8	7813b426-fc9e-4678-bc20-51c33afc5cbd	Mathematics — Calculus Test	Chapter Test	Mathematics	90	30	90	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
18d4def1-2f84-4329-9bd7-22033214c831	7813b426-fc9e-4678-bc20-51c33afc5cbd	JEE Mains — Full Mock Test #7	Full Mock	PCM	180	90	300	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
101466ff-4694-4da9-89ea-734b64f0257b	7813b426-fc9e-4678-bc20-51c33afc5cbd	Previous Year — JEE Mains 2024	Previous Year	PCM	180	90	300	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
f8cafaad-6231-436d-befe-6b57e2dbb255	7813b426-fc9e-4678-bc20-51c33afc5cbd	Previous Year — JEE Mains 2023	Previous Year	PCM	180	90	300	\N	0	t	2026-04-30 14:15:56.811585	2026-04-30 14:15:56.811585
\.


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.results (id, student_name, exam_name, rank, college, batch, academic_year, quote, initials, is_topper, created_at, updated_at, subject, marks) FROM stdin;
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedules (id, batch_id, teacher_id, subject, topic, day_of_week, start_time, end_time, room, is_recurring, created_at, updated_at) FROM stdin;
70d1eaae-28aa-4abb-b6b7-1bc6e66735ed	7813b426-fc9e-4678-bc20-51c33afc5cbd	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Wave Optics	1	16:00	18:00	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
afb9f272-d525-417e-b3b4-a20032efa18e	7813b426-fc9e-4678-bc20-51c33afc5cbd	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Thermodynamics	3	16:00	18:00	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
46b3cac5-72fa-4897-b63f-c0ea7765a6ca	7813b426-fc9e-4678-bc20-51c33afc5cbd	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Electrodynamics	5	16:00	18:00	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
a3289076-85ce-4702-9a77-6fec55e15526	7813b426-fc9e-4678-bc20-51c33afc5cbd	b3204df5-c7e1-4236-aa05-759df8ab01fd	Chemistry	Organic Chemistry	2	16:00	18:00	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
9742a058-916b-431a-9165-5be28b3de98a	7813b426-fc9e-4678-bc20-51c33afc5cbd	b3204df5-c7e1-4236-aa05-759df8ab01fd	Chemistry	Physical Chemistry	4	16:00	18:00	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
b8d8157e-ca59-41af-8efd-5eb6b8a9f1a6	7813b426-fc9e-4678-bc20-51c33afc5cbd	d2c32cbc-9752-4a9f-b940-122b8a7d7217	Mathematics	Integral Calculus	1	18:15	19:15	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
ef512628-25d7-44c8-bcd5-892b7c425763	7813b426-fc9e-4678-bc20-51c33afc5cbd	d2c32cbc-9752-4a9f-b940-122b8a7d7217	Mathematics	Differential Equations	4	18:15	19:15	Room 102	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
6ce199b2-b122-4246-858c-b6c4f321853d	7465dfd1-952b-4e6b-b029-ae13260672d3	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Mechanics	1	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
b02f7902-bd32-45f5-9854-4ed35034146a	7465dfd1-952b-4e6b-b029-ae13260672d3	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Modern Physics	3	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
4f413f90-cc88-4557-bdf3-bf21d973c960	7465dfd1-952b-4e6b-b029-ae13260672d3	97c67117-19a3-4513-be64-9844c7b875ad	Physics	Optics	5	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
4d543332-11b7-4565-b646-32beb8ef483b	7465dfd1-952b-4e6b-b029-ae13260672d3	b3204df5-c7e1-4236-aa05-759df8ab01fd	Chemistry	Inorganic Chemistry	2	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
6d6518f8-acec-4208-a4fb-599aa1825e85	7465dfd1-952b-4e6b-b029-ae13260672d3	b3204df5-c7e1-4236-aa05-759df8ab01fd	Chemistry	Coordination Compounds	4	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
fc1865e8-1ada-4c33-9016-fde2dfed8422	7465dfd1-952b-4e6b-b029-ae13260672d3	d2c32cbc-9752-4a9f-b940-122b8a7d7217	Mathematics	Coordinate Geometry	2	08:15	09:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
9df9149e-a203-4970-9181-21d2614ec5ce	7465dfd1-952b-4e6b-b029-ae13260672d3	d2c32cbc-9752-4a9f-b940-122b8a7d7217	Mathematics	Complex Numbers	6	06:30	08:00	Room 101	t	2026-04-30 14:15:56.696491	2026-04-30 14:15:56.696491
\.


--
-- Data for Name: seo_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seo_overrides (id, route, title, description, focus_keyword, no_index, updated_at) FROM stdin;
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (id, key, value, label, updated_at) FROM stdin;
\.


--
-- Data for Name: student_test_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_test_results (id, student_id, batch_id, exam_name, subject, total_marks, marks_obtained, rank, exam_date, created_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, user_id, batch_id, roll_number, guardian_name, guardian_phone, date_of_birth, address, previous_school, enrolled_at, is_active, created_at, updated_at, fee_plan) FROM stdin;
\.


--
-- Data for Name: study_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_materials (id, batch_id, uploaded_by, title, subject, type, file_url, file_size, download_count, is_visible, created_at, updated_at) FROM stdin;
e38cdeb0-c7aa-4516-b195-8baa2c108f95	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Wave Optics — Complete Notes	Physics	notes	\N	2.4 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
e8d4cd40-9c51-43a1-aaf4-7f6b95651ac0	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Organic Chemistry — Haloalkanes	Chemistry	notes	\N	1.8 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
2c498e22-8aa8-4d6d-9e5d-a8525d4b7c75	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Integral Calculus — Formula Sheet	Mathematics	formula	\N	0.8 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
c01ae1bf-ed1b-472f-be89-9b526d60309d	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Thermodynamics — NCERT Exercises	Physics	exercise	\N	3.1 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
bc0fc4ca-2599-4a8d-8f26-ba83615b5c3f	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Coordination Compounds — Notes	Chemistry	notes	\N	2.2 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
1b9ff158-f0b0-4ba8-bade-394ebe353d37	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Differential Equations — Solved Examples	Mathematics	exercise	\N	1.9 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
8f8d2b3e-6c4c-44f4-84ca-bd08a3193a02	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Electrostatics — Chapter Summary	Physics	summary	\N	1.2 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
1d2cc1fa-3d00-4268-b4c4-f33684ab6bce	7813b426-fc9e-4678-bc20-51c33afc5cbd	\N	Physical Chemistry — Thermodynamics Notes	Chemistry	notes	\N	2.7 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
7af2139d-e272-45c3-b7d3-065470b336f4	7465dfd1-952b-4e6b-b029-ae13260672d3	\N	Mechanics — Rotation Notes	Physics	notes	\N	2.0 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
50cc2bb3-d49c-4faf-b1cc-9e2dc271500d	7465dfd1-952b-4e6b-b029-ae13260672d3	\N	Inorganic Chemistry — Periodic Table	Chemistry	formula	\N	1.5 MB	0	t	2026-04-30 14:15:56.701801	2026-04-30 14:15:56.701801
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teachers (id, user_id, designation, qualification, subjects, experience_years, bio, initials, joined_at, is_active, updated_at, photo_url) FROM stdin;
97c67117-19a3-4513-be64-9844c7b875ad	\N	Senior Faculty — Physics	M.Sc. Physics, IIT Kanpur	{Physics}	12	IIT Kanpur alumnus with 12 years of JEE coaching experience. Expert in Mechanics, Electrodynamics and Modern Physics.	RK	2026-04-30 14:15:56.685458	t	2026-04-30 14:15:56.685458	\N
b3204df5-c7e1-4236-aa05-759df8ab01fd	\N	Senior Faculty — Chemistry	M.Sc. Chemistry, Delhi University	{Chemistry}	9	Specialist in Organic and Physical Chemistry with a track record of 95%+ students clearing JEE Mains.	PS	2026-04-30 14:15:56.685458	t	2026-04-30 14:15:56.685458	\N
d2c32cbc-9752-4a9f-b940-122b8a7d7217	\N	Senior Faculty — Mathematics	M.Sc. Mathematics, NIT Allahabad	{Mathematics}	11	Expert in Calculus, Algebra and Coordinate Geometry. Known for breaking down complex problems into intuitive steps.	AT	2026-04-30 14:15:56.685458	t	2026-04-30 14:15:56.685458	\N
660bb628-7c5d-44f4-8107-5b7b9324a842	\N	Faculty — Biology	M.Sc. Botany, Lucknow University	{Biology}	7	NEET specialist with deep expertise in Plant Physiology, Genetics and Human Anatomy. 93% NEET selection rate.	SP	2026-04-30 14:15:56.685458	t	2026-04-30 14:15:56.685458	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, clerk_user_id, name, email, phone, role, fcm_token, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: question_attempts; Type: TABLE DATA; Schema: question_bank; Owner: -
--

COPY question_bank.question_attempts (id, student_id, question_id, submitted_answer, is_correct, created_at, time_spent_seconds) FROM stdin;
\.


--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: question_bank; Owner: -
--

COPY question_bank.question_bank (id, subject, topic, class_grade, year, difficulty, question_type, question_text, options, correct_answer, solution, image_url, solution_image_url, marks, is_published, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: question_bookmarks; Type: TABLE DATA; Schema: question_bank; Owner: -
--

COPY question_bank.question_bookmarks (id, student_id, question_id, created_at) FROM stdin;
\.


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: attendance_low_alerts attendance_low_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_low_alerts
    ADD CONSTRAINT attendance_low_alerts_pkey PRIMARY KEY (id);


--
-- Name: attendance_low_alerts attendance_low_alerts_student_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_low_alerts
    ADD CONSTRAINT attendance_low_alerts_student_id_unique UNIQUE (student_id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);


--
-- Name: class_recordings class_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_recordings
    ADD CONSTRAINT class_recordings_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_unique UNIQUE (slug);


--
-- Name: doubt_answer_votes doubt_answer_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answer_votes
    ADD CONSTRAINT doubt_answer_votes_pkey PRIMARY KEY (id);


--
-- Name: doubt_answers doubt_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answers
    ADD CONSTRAINT doubt_answers_pkey PRIMARY KEY (id);


--
-- Name: doubts doubts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubts
    ADD CONSTRAINT doubts_pkey PRIMARY KEY (id);


--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: fee_records fee_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_records
    ADD CONSTRAINT fee_records_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: live_classes live_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_pkey PRIMARY KEY (id);


--
-- Name: mock_test_answers mock_test_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_answers
    ADD CONSTRAINT mock_test_answers_pkey PRIMARY KEY (id);


--
-- Name: mock_test_attempts mock_test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_attempts
    ADD CONSTRAINT mock_test_attempts_pkey PRIMARY KEY (id);


--
-- Name: mock_test_questions mock_test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_questions
    ADD CONSTRAINT mock_test_questions_pkey PRIMARY KEY (id);


--
-- Name: mock_tests mock_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: practice_papers practice_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_papers
    ADD CONSTRAINT practice_papers_pkey PRIMARY KEY (id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: seo_overrides seo_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_overrides
    ADD CONSTRAINT seo_overrides_pkey PRIMARY KEY (id);


--
-- Name: seo_overrides seo_overrides_route_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_overrides
    ADD CONSTRAINT seo_overrides_route_unique UNIQUE (route);


--
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: student_test_results student_test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_results
    ADD CONSTRAINT student_test_results_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_roll_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_roll_number_unique UNIQUE (roll_number);


--
-- Name: study_materials study_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: users users_clerk_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: question_attempts question_attempts_pkey; Type: CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_attempts
    ADD CONSTRAINT question_attempts_pkey PRIMARY KEY (id);


--
-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


--
-- Name: question_bookmarks question_bookmarks_pkey; Type: CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_bookmarks
    ADD CONSTRAINT question_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: question_bank_search_vector_idx; Type: INDEX; Schema: question_bank; Owner: -
--

CREATE INDEX question_bank_search_vector_idx ON question_bank.question_bank USING gin (search_vector);


--
-- Name: question_bank_subject_idx; Type: INDEX; Schema: question_bank; Owner: -
--

CREATE INDEX question_bank_subject_idx ON question_bank.question_bank USING btree (subject);


--
-- Name: question_bank_topic_idx; Type: INDEX; Schema: question_bank; Owner: -
--

CREATE INDEX question_bank_topic_idx ON question_bank.question_bank USING btree (topic);


--
-- Name: question_bank_year_idx; Type: INDEX; Schema: question_bank; Owner: -
--

CREATE INDEX question_bank_year_idx ON question_bank.question_bank USING btree (year);


--
-- Name: assignments assignments_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_posted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_posted_by_users_id_fk FOREIGN KEY (posted_by) REFERENCES public.users(id);


--
-- Name: attendance_low_alerts attendance_low_alerts_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_low_alerts
    ADD CONSTRAINT attendance_low_alerts_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_marked_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_users_id_fk FOREIGN KEY (marked_by) REFERENCES public.users(id);


--
-- Name: attendance attendance_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: batches batches_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: class_recordings class_recordings_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_recordings
    ADD CONSTRAINT class_recordings_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: class_recordings class_recordings_live_class_id_live_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_recordings
    ADD CONSTRAINT class_recordings_live_class_id_live_classes_id_fk FOREIGN KEY (live_class_id) REFERENCES public.live_classes(id);


--
-- Name: doubt_answer_votes doubt_answer_votes_answer_id_doubt_answers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answer_votes
    ADD CONSTRAINT doubt_answer_votes_answer_id_doubt_answers_id_fk FOREIGN KEY (answer_id) REFERENCES public.doubt_answers(id) ON DELETE CASCADE;


--
-- Name: doubt_answer_votes doubt_answer_votes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answer_votes
    ADD CONSTRAINT doubt_answer_votes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: doubt_answers doubt_answers_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answers
    ADD CONSTRAINT doubt_answers_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: doubt_answers doubt_answers_doubt_id_doubts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubt_answers
    ADD CONSTRAINT doubt_answers_doubt_id_doubts_id_fk FOREIGN KEY (doubt_id) REFERENCES public.doubts(id) ON DELETE CASCADE;


--
-- Name: doubts doubts_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubts
    ADD CONSTRAINT doubts_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: doubts doubts_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doubts
    ADD CONSTRAINT doubts_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: fee_records fee_records_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_records
    ADD CONSTRAINT fee_records_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: live_classes live_classes_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: live_classes live_classes_teacher_id_teachers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.live_classes
    ADD CONSTRAINT live_classes_teacher_id_teachers_id_fk FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);


--
-- Name: mock_test_answers mock_test_answers_attempt_id_mock_test_attempts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_answers
    ADD CONSTRAINT mock_test_answers_attempt_id_mock_test_attempts_id_fk FOREIGN KEY (attempt_id) REFERENCES public.mock_test_attempts(id) ON DELETE CASCADE;


--
-- Name: mock_test_answers mock_test_answers_question_id_mock_test_questions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_answers
    ADD CONSTRAINT mock_test_answers_question_id_mock_test_questions_id_fk FOREIGN KEY (question_id) REFERENCES public.mock_test_questions(id) ON DELETE CASCADE;


--
-- Name: mock_test_attempts mock_test_attempts_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_attempts
    ADD CONSTRAINT mock_test_attempts_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: mock_test_attempts mock_test_attempts_test_id_mock_tests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_attempts
    ADD CONSTRAINT mock_test_attempts_test_id_mock_tests_id_fk FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: mock_test_questions mock_test_questions_test_id_mock_tests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_test_questions
    ADD CONSTRAINT mock_test_questions_test_id_mock_tests_id_fk FOREIGN KEY (test_id) REFERENCES public.mock_tests(id) ON DELETE CASCADE;


--
-- Name: mock_tests mock_tests_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: mock_tests mock_tests_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mock_tests
    ADD CONSTRAINT mock_tests_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notices notices_posted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_posted_by_users_id_fk FOREIGN KEY (posted_by) REFERENCES public.users(id);


--
-- Name: notices notices_target_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_target_batch_id_batches_id_fk FOREIGN KEY (target_batch_id) REFERENCES public.batches(id);


--
-- Name: parents parents_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: parents parents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: practice_papers practice_papers_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_papers
    ADD CONSTRAINT practice_papers_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: schedules schedules_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: schedules schedules_teacher_id_teachers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_teacher_id_teachers_id_fk FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);


--
-- Name: student_test_results student_test_results_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_results
    ADD CONSTRAINT student_test_results_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: student_test_results student_test_results_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_test_results
    ADD CONSTRAINT student_test_results_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: students students_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: study_materials study_materials_batch_id_batches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);


--
-- Name: study_materials study_materials_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: teachers teachers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: question_attempts question_attempts_question_id_question_bank_id_fk; Type: FK CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_attempts
    ADD CONSTRAINT question_attempts_question_id_question_bank_id_fk FOREIGN KEY (question_id) REFERENCES question_bank.question_bank(id) ON DELETE CASCADE;


--
-- Name: question_attempts question_attempts_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_attempts
    ADD CONSTRAINT question_attempts_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: question_bank question_bank_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_bank
    ADD CONSTRAINT question_bank_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: question_bookmarks question_bookmarks_question_id_question_bank_id_fk; Type: FK CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_bookmarks
    ADD CONSTRAINT question_bookmarks_question_id_question_bank_id_fk FOREIGN KEY (question_id) REFERENCES question_bank.question_bank(id) ON DELETE CASCADE;


--
-- Name: question_bookmarks question_bookmarks_student_id_students_id_fk; Type: FK CONSTRAINT; Schema: question_bank; Owner: -
--

ALTER TABLE ONLY question_bank.question_bookmarks
    ADD CONSTRAINT question_bookmarks_student_id_students_id_fk FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gHIzFneqzBgYe0CRbSA1tG2zCKFOhRSzEctg6XD2iHNBFEZX69glFwcT4EJHAL8

