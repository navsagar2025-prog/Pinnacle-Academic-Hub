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

### 5. Pinnacle Full Platform (`artifacts/pinnacle-website`)
- **Next.js 15** (App Router) + Tailwind CSS v4 + TypeScript full-stack platform for Pinnacle Academic Classes
- Brand: Navy #0A1F5C, Teal #0D7377, Maroon #8B1A1A, Gold #C9A84C; Fonts: Playfair Display + Plus Jakarta Sans
- Workflow: `artifacts/pinnacle-website: web` on port 24697 at `/pinnacle-website`
- **Auth**: Clerk (`@clerk/nextjs`) — keyless dev mode; middleware protects all `/portal/*` routes
- **Database**: PostgreSQL + Drizzle ORM (shared `lib/db` schema); seeded with courses, batches, notices, enquiries
- **16 public pages**: Home, About, Courses, Faculty, Admissions, Results, Notices, Contact, FAQ, Privacy Policy, Terms, Refund Policy, Blog, Gallery, Achievements, Fee Structure
- **Role portals**: Student (dashboard, timetable, materials, papers, fees, recordings), Parent (dashboard, fees, timetable, notices), Teacher (dashboard, schedule, materials, notices), Admin (dashboard, students, teachers, batches) — all DB-backed via Drizzle
- **AI Assistant** (`/portal/admin/ai`, `/portal/teacher/ai`): Multi-model AI workspace powered by Replit AI Integrations (OpenAI, Gemini, Anthropic, OpenRouter); 5 tools: Notice Writer, Enquiry Responder, Study Summariser, Batch Performance Insight, Fee Reminder Composer; SSE streaming; model selector persisted in localStorage; teachers see 3 tools (no enquiry responder or fee reminder)
- **Object Storage**: GCS-backed file storage via Replit sidecar auth (`lib/server/object-storage.ts`); bucket provisioned; `POST /api/v1/upload` returns presigned PUT URL; uploaded files served via `GET /api/v1/storage/[...path]`; reusable `<FileUpload>` component at `components/upload/FileUpload.tsx`; supports PDFs (max 20 MB) and images (max 5 MB)
- **File uploads integrated**: Teacher materials (PDF upload replaces URL field), Teacher assignments (new page at `/portal/teacher/assignments` with question paper PDF upload), Admin blog featured image upload, Admin course banner image upload, Admin faculty photo upload
- **API routes** (`/api/v1/`): health (with `error:null` envelope), courses, notices, enquiries, materials (auth-protected), assignments (GET+POST), teachers (GET+POST+PUT via `[id]`), upload (presigned URL), storage serving, `POST /api/v1/ai/generate` (SSE streaming, auth-gated to admin+teacher)
- **Navbar**: "Courses" dropdown (JEE, NEET, 11-12, 9-10, Fee Structure); "More" dropdown (Results, Achievements, Gallery, Blog, Notices, About)
- **All portal pages** use `requirePortalRole()` which auto-provisions DB user on first Clerk sign-in
- Seed command: `pnpm --filter @workspace/db run seed`
- Key files:
  - `artifacts/pinnacle-website/app/layout.tsx` — ClerkProvider + Playfair/Jakarta fonts
  - `artifacts/pinnacle-website/app/globals.css` — Tailwind v4 @theme with brand colors (pure CSS, no @apply chaining)
  - `artifacts/pinnacle-website/middleware.ts` — Clerk route protection for /portal/*
  - `artifacts/pinnacle-website/lib/data.ts` — All demo/static data (courses, faculty, toppers, testimonials)
  - `artifacts/pinnacle-website/next.config.ts` — basePath=/pinnacle-website, assetPrefix set
  - `lib/db/src/schema/index.ts` — Full Drizzle schema (16 tables: users, courses [+featuredImageUrl], batches, students, parents, teachers [+photoUrl], studyMaterials, practicePapers, feeRecords, notices, schedules, liveClasses, classRecordings, enquiries, assignments, attendance, studentTestResults)

### 6. Pinnacle Mobile App (`artifacts/pinnacle-mobile`)
- Expo React Native app (iOS + Android + Web) for Pinnacle Academic Classes
- Brand: Navy #0A1F5C, Teal #0D7377, Maroon #8B1A1A, Gold #C9A84C (same as web)
- Workflow: `artifacts/pinnacle-mobile: expo` on port 19049
- 4 roles: Student (5 tabs), Parent (3 tabs), Teacher (5 tabs), Admin (5 tabs)
- Role stored in AsyncStorage (`pinnacle_role`); role selector on root screen
- All write-action buttons are visually disabled + trigger Alert.alert("Demo Mode") — read-only demo; Demo Mode banner on all portal screens
- Scan Document screen: real expo-camera CameraView viewfinder → auto-crop suggestion → OCR API → KaTeX WebView preview for LaTeX → PDF/DOCX export with native share
- `eas.json`: development (APK + iOS simulator) / preview / production (app-bundle / App Store) profiles
- TypeScript: 0 errors; all Feather icon names typed via `ComponentProps<typeof Feather>["name"]`; no `as any` casts
- Brand fonts: Playfair Display (headings) + Plus Jakarta Sans (body) + Inter (mono) loaded in `_layout.tsx`
- Push notifications: `expo-notifications` wired; permission request + demo welcome notification on first launch
- Offline timetable cache: Student + Parent timetable screens cache to AsyncStorage; offline/cached indicator shown
- Dependencies: `expo-file-system/legacy`, `expo-sharing`, `expo-camera`, `expo-notifications`, `react-native-webview`, Playfair Display + Plus Jakarta Sans fonts
- Key screens by role:
  - **Student**: Dashboard, Live Classes, Materials, Timetable (offline cache), More → sub-screens: Recordings, Practice Papers (with scores), Fees (history + due)
  - **Parent**: Dashboard, Fees (payment history + next due), Timetable (offline cache)
  - **Teacher**: Dashboard, Schedule, Batches, Materials Upload, Scan (CameraView + KaTeX), Notices
  - **Admin**: Dashboard, Students (searchable list), Finance (overview/due/recent), Notices, More (Teachers + Results + Enquiries + Scan + Settings)
- Key files:
  - `app/_layout.tsx` — Root layout; loads Playfair/Jakarta fonts; expo-notifications permission + demo notification
  - `app/index.tsx` — Role selector (Playfair Display heading); Feather icons typed
  - `app/(student)/more.tsx` — Navigation hub to Recordings / Papers / Fees
  - `app/(student)/recordings.tsx` — Recorded lectures (distinct screen, disabled in demo)
  - `app/(student)/papers.tsx` — Practice papers + test scores (distinct screen)
  - `app/(student)/fees.tsx` — Fee history + next due + disabled pay button
  - `app/(student)/timetable.tsx` — Timetable with AsyncStorage offline cache
  - `app/(teacher)/scan.tsx` — CameraView viewfinder + auto-crop step + OCR + KaTeX WebView + export
  - `app/(teacher)/notices.tsx` — Teacher notices with type filter + modal detail
  - `app/(admin)/scan.tsx` — Admin scan (OCR flow, accessible from More)
  - `app/(admin)/more.tsx` — Admin More: Teachers + Enquiries + Scan link + Settings
  - `constants/fonts.ts` — Font family constants (Playfair Display / Plus Jakarta Sans / Inter)
  - `components/DemoBanner.tsx` — Gold "Demo Mode" banner on all portal screens
  - `components/ScreenContainer.tsx` — Wraps all screens with DemoBanner + safe area
