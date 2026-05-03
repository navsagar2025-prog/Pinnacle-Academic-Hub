#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
# Apply the question_bank full-text search migration (idempotent).
if [ -n "$DATABASE_URL" ] && [ -f lib/db/sql/question-bank-search.sql ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f lib/db/sql/question-bank-search.sql
fi
