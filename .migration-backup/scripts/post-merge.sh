#!/bin/bash
set -e
pnpm install --frozen-lockfile
# `pnpm --filter db push` already runs the question_bank pre-push SQL hook
# (data-preserving ALTER TABLE … SET SCHEMA) before drizzle-kit push.
pnpm --filter db push
