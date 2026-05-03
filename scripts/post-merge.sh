#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Pre-push: idempotent, data-preserving move of question_bank.* tables into
# their dedicated Postgres schema. Must run before drizzle-kit push so that
# drizzle reconciles a database where the tables already live in the right
# schema (preserving rows, FKs, and indexes).
if [ -n "$DATABASE_URL" ] && [ -f lib/db/sql/question-bank-pre-push.sql ]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f lib/db/sql/question-bank-pre-push.sql
fi
pnpm --filter db push
