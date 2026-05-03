-- Adds a generated tsvector column + GIN index to question_bank.question_bank
-- so the API can run plainto_tsquery / ts_rank full-text search efficiently.
-- Idempotent: safe to re-run after every drizzle-kit push.

ALTER TABLE question_bank.question_bank
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(question_text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(topic, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(solution, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS question_bank_search_vector_idx
  ON question_bank.question_bank USING GIN (search_vector);
