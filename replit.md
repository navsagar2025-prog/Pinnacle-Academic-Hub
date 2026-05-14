# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Database

- **Primary:** Supabase Postgres (region `ap-northeast-1`, accessed via Supavisor pooler).
  - Runtime uses the **Transaction-mode pooled URL on port 6543**, stored in the `SUPABASE_DATABASE_URL` secret.
  - For schema operations (`pnpm --filter @workspace/db run push`, `pg_dump`, `pg_restore`), use the **Session-mode pooler on port 5432** at the same hostname (the direct `db.<ref>.supabase.co` host is IPv6-only and unreachable from this sandbox without the IPv4 add-on).
- **Fallback:** Replit-hosted Postgres in the `DATABASE_URL` secret. `lib/db/src/index.ts` and `lib/db/drizzle.config.ts` both resolve `SUPABASE_DATABASE_URL ?? DATABASE_URL`, so Supabase wins whenever it is set.
- **Rollback:** delete the `SUPABASE_DATABASE_URL` secret (env-secrets skill) and restart the `artifacts/api-server: API Server` workflow. The app will fall back to the Replit DB. Keep the Replit `DATABASE_URL` set for ~14 days after the cutover as a safety net.
- **Re-running data migration:** dump with `pg_dump "$DATABASE_URL" --data-only --no-owner --no-privileges --exclude-schema=drizzle -f dump.sql`, then restore through the session pooler wrapped in `BEGIN; SET session_replication_role='replica'; \i dump.sql; SET session_replication_role='origin'; COMMIT;` (Supabase's `postgres` role can't `DISABLE TRIGGER`, so use `session_replication_role` to bypass FK checks).
- **Cutover log (May 13, 2026):** Initial Replit → Supabase cutover. Row counts verified parity across all 51 public tables (only delta: `gallery_items` had 51 pre-seeded rows in Supabase vs 0 in Replit — preserved, not lost). Owned-sequence audit returned 0 rows (all PKs are `uuid defaultRandom`), so no `setval()` resync was needed. `artifacts/api-server` restarted clean (`Startup migrations applied`, listening on 8080); `artifacts/pinnacle-website` restarted clean. `pinnacle-mobile` and `mockup-sandbox` don't open DB connections.
- **Question bank seed (May 13, 2026):** ran `lib/db/src/seed-questions.ts` (Anthropic `claude-haiku-4-5` via `AI_INTEGRATIONS_ANTHROPIC_*`, `BATCH_SIZE=20`, `CONCURRENCY=6`, `MAX_OUTPUT_TOKENS=16384`, pool-per-query). Inserted **+7,963** AI-generated JEE/NEET questions (Physics +2,239 → 5,170; Chemistry +1,968 → 4,568; Mathematics +1,995 → 6,252; Biology +2,002 → 4,026). Total `question_bank.question_bank` rows: **20,016** (≈348 / 1.7% near-duplicate `question_text` across the full table — within tolerance). Re-run command: build a session-mode DSN explicitly (port **5432**, not the transaction-mode 6543 in `SUPABASE_DATABASE_URL`) — e.g. `SESSION_URL="postgresql://postgres.<ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" DATABASE_URL="$SESSION_URL" pnpm --filter @workspace/db exec tsx src/seed-questions.ts`. Do **not** pass the 6543 URL — pgbouncer transaction mode breaks the long-lived `pg.Pool` connections this script uses. Note: PK is `uuid defaultRandom`, so `ON CONFLICT DO NOTHING` is a no-op — re-runs will append rather than dedupe.
- **Production zips (May 13, 2026):** `bash scripts/package-releases.sh` produced `releases/pinnacle-source-2026-05-13.zip` (~102 MB, 1,217 files) and `releases/pinnacle-dist-2026-05-13.zip` (~21 MB, 182 files: built `pinnacle-website`, `api-server`, `pinnacle-mobile`).
- **SSC 20k AI seed run (May 14, 2026 — Task #95):** Re-ran `lib/db/src/seed-ssc-questions.ts` against the **session-mode pooler** (port **5432**, transaction-mode 6543 breaks `pg.Pool`), with env overrides `SSC_TARGET=5000 SSC_BATCH_SIZE=12 SSC_CONCURRENCY=8`. Inserted **+18,087 bilingual SSC rows** (Quantitative Aptitude **4,739**, English **4,629** [English-only by design — Hindi columns null], Reasoning **4,489**, General Awareness **4,230**); shortfall vs the 20k target is normalized-text dedupe rejecting near-identical generations. Total `question_bank.question_bank` rows now **37,758** (≈ 19,671 JEE/NEET + 18,087 SSC). Long-running job ran via Replit `configureWorkflow({outputType:"console", autoStart:true})` because `nohup`/`setsid` background bash launched from agent shell gets reaped between turns. Resume / top-up command (idempotent — partial UNIQUE on `(subject, language, normalized_text)` skips dupes): `SUPABASE_DATABASE_URL="$(cat /tmp/.supabase_session_url)" SSC_TARGET=5000 SSC_CONCURRENCY=8 pnpm --filter @workspace/db exec tsx src/seed-ssc-questions.ts`. Smoke-checked `GET /api/v1/public/ssc/question-bank` returns bilingual rows.
- **Production zips (May 14, 2026):** `bash scripts/package-releases.sh` produced `releases/pinnacle-source-2026-05-14.zip` (~103 MB, 1,222 files) and `releases/pinnacle-dist-2026-05-14.zip` (~21 MB, 182 files). Stale 2026-05-13 zips removed.
- **SSC CGL/CHSL bilingual question bank (May 14, 2026 — Task #94):** Schema migration applied via session pooler — added `question_bank.{question_text_hi, options_hi, solution_hi}`, replaced `search_vector` with bilingual (`english` + `simple` Hindi) tsvector, added generated `normalized_text` + partial UNIQUE index `(subject, language, normalized_text) WHERE deleted_at IS NULL`. Created `exam_templates` + `exam_template_sections` (CGL Tier-1, CGL Tier-2 Paper-1, CHSL Tier-1 seeded with sections/timing/marking) and added nullable `mock_tests.exam_template_id` FK. Pre-migration dedupe removed 345 duplicate rows (now 19,671 base rows). New AI seeder: `lib/db/src/seed-ssc-questions.ts` (target 180×4 = 720 bilingual SSC questions, source = `AI_SSC`, BATCH_SIZE=12, CONCURRENCY=4, MAX_TOKENS=16384). Run with the **session-mode pooler** the same way as the JEE/NEET seeder. Public API: `/api/v1/public/ssc/{exam-templates,question-bank}` (unauthenticated, mounted before `requireAuth()` in `routes/index.ts`). Authenticated student API: `/portal/student/question-bank?examTrack={JEE_NEET|SSC_CGL|SSC_CHSL}`. Website: new `/ssc` route + Navbar link. Mobile: new `app/(student)/ssc.tsx` + `fetchSscQuestionBank/ExamTemplates` in `lib/api.ts`. Admin filter dropdown picks up the new `SSC_CGL/CHSL/TIER_1/TIER_2` enum values automatically.
- **PYQ-PDF ingestion (DEFERRED — May 14, 2026):** Real OCR/vision-extraction of SSC previous-year PDFs is **not implemented**; user has not yet provided source PDFs. As a stub, `POST /admin/question-bank/import-ssc-paper` accepts `{ paper: { exam, year, tier, shift? }, questions: [...] }` of pre-extracted bilingual rows and tags them with `source = SSC-<exam>-<year>-<tier>-<shift>`. When PDFs arrive, plug a vision pipeline (e.g. Anthropic vision or Tesseract+layout) in front of this endpoint — no schema/route changes needed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
