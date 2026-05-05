# Overview

This is a pnpm workspace monorepo using TypeScript, designed for an academic coaching institute, Pinnacle Academic Classes. The project encompasses a full-stack web platform, a mobile application, and a robust API server with OCR capabilities. The overarching goal is to provide a comprehensive digital ecosystem for students, parents, teachers, and administrators, enhancing learning, communication, and administrative efficiency.

Key capabilities include:
- A centralized API server for OCR scanning, document export (PDF/DOCX), and configuration management.
- A full-fledged Next.js web platform offering public pages, role-based portals (Student, Parent, Teacher, Admin), AI-powered tools, object storage, and advanced content management (question bank, gallery, SEO).
- A React Native mobile application providing a tailored experience for different user roles, including features like document scanning, offline timetable access, and push notifications.
- A system for managing academic content, including a vast question bank with AI generation capabilities.

# User Preferences

No specific user preferences were provided in the original document.

# System Architecture

The project is structured as a pnpm workspace monorepo, with each package managing its own dependencies. Node.js 24 and TypeScript 5.9 are the core technologies.

## Core Technologies:
- **Monorepo Tool**: pnpm workspaces
- **Package Manager**: pnpm
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (v4) and drizzle-zod
- **API Codegen**: Orval (from OpenAPI spec)
- **Build Tool**: esbuild (CJS bundle)

## UI/UX and Branding:
Across all web and mobile platforms (Pinnacle Demo, Pinnacle Full Platform, Pinnacle Mobile App), a consistent brand identity is maintained:
- **Colors**: Navy (#0A1F5C), Teal (#0D7377), Maroon (#8B1A1A), Gold (#C9A84C)
- **Fonts**: Playfair Display (headings) and Plus Jakarta Sans (body), with Inter for monospaced text in mobile.
- **UI Frameworks**: shadcn/ui and Tailwind CSS v4 are used for web interfaces.

## Technical Implementations and Features:

### API Server (`artifacts/api-server`):
- Express 5 backend with Drizzle ORM and PostgreSQL.
- **OCR Router**: Supports 5 switchable OCR engines (Pix2Text default, SimpleTex, LaTeX-OCR, MathPix, Google Vision). Configuration is persisted in `ocr-config.json`.
- **Endpoints**: `/api/scan` (multipart image upload), `/api/settings/ocr` (GET/PUT for config), `/api/export/pdf`, `/api/export/docx`, `/api/health`.
- OCR adapters are factory-managed based on configuration.

### Pinnacle Full Platform (`artifacts/pinnacle-website`):
- Built with Next.js 15 (App Router) and Tailwind CSS v4.
- **Authentication**: Clerk (`@clerk/nextjs`) for user management, protecting `/portal/*` routes.
- **Database**: PostgreSQL + Drizzle ORM, with a shared `lib/db` schema. Includes a question bank schema with `tsvector` for full-text search and a pre-push SQL hook for schema management.
- **Content**: 16 public pages and role-specific portals (Student, Parent, Teacher, Admin).
- **Teacher Mock Tests**: Teachers can create and manage mock tests with performance analytics (attempt stats, topic-wise breakdown, student attempts table, CSV export). Tests can be scheduled to a specific date/time window (`scheduledStart`/`scheduledEnd`); the student-facing card shows a live countdown and disables Start outside the window, while the teacher list shows a "Scheduled" badge. Questions support **diagrams/figures** (image upload to object storage, category `mock_test_image`, public path) on the question, each option, and the explanation, plus **inline LaTeX** via the `RichText` component (`$…$` inline, `$$…$$` block, KaTeX). Bulk CSV import accepts the additional optional columns `imageUrl`, `optionAImageUrl`...`optionDImageUrl`, `explanationImageUrl`. **Question types** beyond standard MCQ are supported: `mcq` (single correct, default), `multi` (multiple correct — graded all-or-nothing on exact set match), and `numerical` (free-form number with optional ±tolerance, graded by `|response − answer| ≤ tolerance + 1e-9`). Schema columns added on `mock_test_questions` (`questionType`, `correctOptions text[]`, `numericalAnswer real`, `numericalTolerance real`) and `mock_test_answers` (`selectedOptions text[]`, `numericalResponse real`; `marksAwarded` widened from int → real for fractional scores). The take-test UI renders radios/checkboxes/numeric input per type (with a coloured type badge), and the result review shows per-type "Your answer / Correct answer ±tolerance" cards for numerical and lists `correctOptions` for multi. CSV importer accepts new columns `questionType`, `correctOptions` (e.g. `A|C` or `A,C`), `numericalAnswer`, `numericalTolerance`. Both teacher and admin question forms expose a 3-button type selector with conditional inputs. The student result page (`QuestionReview` client component) shows a filter chip row (All / Wrong / Skipped / Correct) with live counts, a coloured left-border accent per question, a prominent "Correct answer" badge for wrong/skipped questions, and a styled amber "Solution" card (lightbulb icon) for the explanation + explanation image. **Mock test sections** allow grouping questions (e.g. Physics / Chemistry / Maths). Schema: `mock_test_sections` (id, testId, name, ordering, instructions, createdAt) + nullable `sectionId` FK on `mock_test_questions` (on delete set null, so legacy/unsectioned questions fall through as "General"). CRUD endpoints under `/api/v1/mock-tests/[id]/sections` (GET/POST) and `/sections/[sectionId]` (PATCH/DELETE), teacher/admin scoped. Question POST and bulk CSV importer accept `sectionId` (and CSV `section` column matched by name, case-insensitive). The shared `<SectionsManager>` client (used by both teacher + admin manage pages) handles inline create/rename/delete; question form gets a "No section (General)" dropdown; question listings group by section header. The take-test palette splits into per-section sub-grids with section name + answered/total counts when sections exist (test-level timer is preserved — no per-section timers in this iteration). The student result page now also shows **rank, percentile, top score, average, and a top-5 anonymized leaderboard** (initials only, current student highlighted) computed from the best attempt per student (score desc, time asc tiebreak; percentile = strictly-below%), plus a **section-wise performance** table (attempted/correct/wrong/accuracy/marks per section, with un-sectioned questions grouped under "General"). **Per-question analytics** for teachers and admins: a `<QuestionAnalytics>` card on the manage-test page (built from `lib/server/question-analytics.ts`) lists every question with attempts, correct/wrong/skipped counts, accuracy %, average time spent, the most-picked wrong MCQ option ("top wrong"), and a derived difficulty label (Easy ≥70% / Medium 40–69% / Hard <40%). Sortable columns (Q#, attempts, accuracy asc by default, avg time) and CSV export included. Backed by a new `time_spent_seconds` integer column on `mock_test_answers`; the take-test client tracks per-question cumulative time (flushed on navigation, every 30s, and on submit) and the answer/submit APIs persist it via `GREATEST(existing, new)` so out-of-order autosaves never regress the value. The take-test client **autosaves** every answer change (debounced 500ms) and every mark-for-review toggle (immediate) via `POST /api/v1/mock-tests/attempts/[id]/answer`, an idempotent upsert keyed on the `(attempt_id, question_id)` unique index on `mock_test_answers`. The take page server also detects the latest in-progress attempt for the student and **resumes** it, hydrating saved answers, marked questions, and remaining time, so a refresh or disconnect doesn't lose work. The submit endpoint upserts (delete-then-merge with autosaved rows) so autosave + final submit cannot duplicate answer rows. Access and editing permissions are role and subject-based, enforced by API routes.
- **AI Assistant**: Admin and Teacher portals include an AI workspace powered by Replit AI Integrations (OpenAI, Gemini, Anthropic, OpenRouter) with tools for Notice Writing, Enquiry Response, Study Summarisation, Batch Performance Insights, and Fee Reminders. Uses SSE for streaming.
- **Object Storage**: GCS-backed via Replit sidecar auth, with presigned PUT URLs for uploads and direct serving of stored files. Supports PDF and image uploads.
- **API Routes (`/api/v1/`)**: Comprehensive set of APIs for health, courses, notices, enquiries (with CSV export and email triggers), materials, assignments, teachers, upload, storage, AI generation, gallery, SEO, and user management.
- **Transactional Email**: Resend integration for various email notifications (enquiry acknowledgement, admin alerts, payment confirmation, admission status).
- **Gallery**: DB-backed `galleryItems` with admin CRUD and public display.
- **SEO Overrides**: DB-backed `seoOverrides` for route-specific metadata, editable by admin.
- **User Management**: Admin interface for managing users and changing roles.
- **JSON-LD Structured Data**: Implemented for homepage (EducationalOrganization, LocalBusiness) and courses page (ItemList, Course).
- **Question Bank**: 11,595 MCQ questions across 4 subjects seeded. Includes an AI Question Generator tool for admins to create MCQs via API.

### Pinnacle Mobile App (`artifacts/pinnacle-mobile`):
- Expo React Native app (iOS, Android, Web).
- **Role-based Access**: 4 roles (Student, Parent, Teacher, Admin) with distinct tab navigations. Role stored in AsyncStorage.
- **Demo Mode**: Read-only functionality with visual disablement and demo alerts for write actions.
- **Scan Document**: Uses `expo-camera` for document scanning, OCR API integration, KaTeX WebView preview for LaTeX, and PDF/DOCX export with native sharing.
- **Push Notifications**: `expo-notifications` integrated for permission requests and demo notifications.
- **Offline Caching**: Student and Parent timetable screens cache data to AsyncStorage.

### Other Artifacts:
- **Mockup Sandbox (`artifacts/mockup-sandbox`)**: Vite dev server for canvas component previews.
- **Pinnacle Proposal (`artifacts/pinnacle-proposal`)**: React + Vite based 25-slide pitch deck.
- **Pinnacle Demo Website (`artifacts/pinnacle-demo`)**: React + Vite + shadcn/ui demo website with 30+ pages and role selector login (demo only).

# External Dependencies

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Clerk (`@clerk/nextjs`)
- **AI Integrations**: OpenAI, Google Gemini, Anthropic, OpenRouter (via Replit AI Integrations)
- **Email Service**: Resend
- **Object Storage**: Google Cloud Storage (GCS)
- **OCR Engines**: Pix2Text, SimpleTex, LaTeX-OCR, MathPix, Google Vision
- **PDF Generation**: pdf-lib
- **DOCX Generation**: docx.js
- **Mobile Push Notifications**: Expo Notifications
- **Mobile Camera Access**: expo-camera
- **Mobile File System/Sharing**: expo-file-system/legacy, expo-sharing
- **Mobile Webview**: react-native-webview