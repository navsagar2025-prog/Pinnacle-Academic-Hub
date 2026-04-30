# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### 1. API Server (`artifacts/api-server`)
- Express 5 + Drizzle ORM + PostgreSQL backend
- Workflow: `artifacts/api-server: API Server` on port 8080
- **OCR Router**: Switchable OCR engine backend with 5 adapters (Pix2Text default, SimpleTex, LaTeX-OCR, MathPix, Google Vision)
- Config persisted in `artifacts/api-server/data/ocr-config.json` (auto-created, JSON file store)
- Key endpoints:
  - `POST /api/scan` — OCR scan (multipart image upload, routes to active engine)
  - `GET /api/settings/ocr` — get active provider + per-provider config (keys sanitized)
  - `PUT /api/settings/ocr` — switch active provider + update credentials
  - `POST /api/export/pdf` — generate branded PDF from OCR result (pdf-lib)
  - `POST /api/export/docx` — generate DOCX from OCR result (docx.js)
  - `GET /api/health` — status + activeProvider + uptime
- OCR adapters: `src/ocr/pix2text.ts`, `simpletex.ts`, `latexocr.ts`, `mathpix.ts`, `google-vision.ts`
- OCR factory: `src/ocr/factory.ts` — reads config, instantiates correct adapter
- Config store: `src/lib/config-store.ts` — load/save JSON config with env var fallbacks

### 2. Mockup Sandbox (`artifacts/mockup-sandbox`)
- Vite dev server for canvas component previews
- Workflow: `artifacts/mockup-sandbox: Component Preview Server` on port 8081

### 3. Pinnacle Proposal (`artifacts/pinnacle-proposal`)
- 25-slide pitch deck for Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.)
- React + Vite, slides-style artifact at `/pinnacle-proposal`
- Workflow: `artifacts/pinnacle-proposal: web` on port 23973

### 4. Pinnacle Demo Website (`artifacts/pinnacle-demo`)
- Full demo website for Pinnacle Academic Classes coaching institute
- React + Vite + shadcn/ui + Tailwind CSS v4 + wouter routing
- Brand: Navy #0A1F5C, Teal #0D7377, Maroon #8B1A1A, Gold #C9A84C; Fonts: Playfair Display + Plus Jakarta Sans
- 30+ pages: 12 public pages + Student/Parent/Teacher portals (15 portal pages)
- Role selector login (demo mode, no real auth); role stored in localStorage as `pinnacle_role`
- All portal forms disabled with "Demo mode" tooltip
- Workflow: `artifacts/pinnacle-demo: web` on port 24694

#### Key files (Pinnacle Demo):
- `src/App.tsx` — all 30+ routes (wouter Switch)
- `src/components/layout/Navbar.tsx` — public navbar with hamburger menu
- `src/components/layout/PortalLayout.tsx` — role-aware sidebar portal layout
- `src/pages/Login.tsx` — role selector (Student / Parent / Teacher)
- `src/index.css` — brand tokens and Tailwind theme
- `vite.config.ts` — PORT + BASE_PATH env vars

### 5. Pinnacle Mobile App (`artifacts/pinnacle-mobile`)
- Expo React Native app (iOS + Android + Web) for Pinnacle Academic Classes
- Brand: Navy #0A1F5C, Teal #0D7377, Maroon #8B1A1A, Gold #C9A84C (same as web)
- Workflow: `artifacts/pinnacle-mobile: expo` on port 19049
- 4 roles: Student (5 tabs), Parent (3 tabs), Teacher (5 tabs), Admin (5 tabs)
- Role stored in AsyncStorage (`pinnacle_role`); role selector on root screen
- All write-action buttons trigger Alert.alert("Demo Mode") — read-only demo
- Scan Document screen: camera/gallery image picker → simulated OCR → export demo
- Key screens by role:
  - **Student**: Dashboard, Live Classes, Materials, Timetable, More (Recordings + Papers + Fees)
  - **Parent**: Dashboard, Fees (payment history + next due), Timetable
  - **Teacher**: Dashboard, Schedule, Batches, Materials Upload, Scan Document
  - **Admin**: Dashboard, Students (searchable list), Finance (overview/due/recent), Notices, More (Teachers + Results + Enquiries + Settings)
- Key files:
  - `app/_layout.tsx` — Root layout with RoleContext, providers
  - `app/index.tsx` — Role selector landing screen (navy gradient UI)
  - `context/RoleContext.tsx` — Role state with AsyncStorage persistence
  - `constants/colors.ts` — Brand color tokens (Navy/Teal/Maroon/Gold)
  - `components/` — Reusable: ClassRow, NoticeRow, StatCard, DemoButton, RoleHeader, ScreenContainer
