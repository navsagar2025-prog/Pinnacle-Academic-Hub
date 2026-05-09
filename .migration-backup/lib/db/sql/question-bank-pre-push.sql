-- Data-preserving migration that runs BEFORE drizzle-kit push.
--
-- Goal: ensure the question_bank schema exists and that the three legacy
-- tables (question_bank, question_bookmarks, question_attempts) live inside
-- it, regardless of whether the database was provisioned before or after
-- the schema move. Idempotent and safe to run on every deploy/merge.
--
-- Once tables are in the question_bank schema, drizzle-kit push reconciles
-- the rest (search_vector generated column, GIN index, btree indexes) from
-- the Drizzle schema definition without dropping data.

CREATE SCHEMA IF NOT EXISTS question_bank;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['question_bank', 'question_bookmarks', 'question_attempts'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA question_bank', t);
    END IF;
  END LOOP;
END $$;
