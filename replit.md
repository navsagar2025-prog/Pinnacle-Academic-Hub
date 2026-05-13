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

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
