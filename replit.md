# Overview

This project is a pnpm workspace monorepo utilizing TypeScript, designed for Pinnacle Academic Classes, an academic coaching institute. It aims to establish a comprehensive digital ecosystem for students, parents, teachers, and administrators. This ecosystem includes a full-stack web platform, a mobile application, and a robust API server with advanced OCR capabilities. The primary goal is to enhance learning, communication, and administrative efficiency through a unified digital experience. Key features include a centralized API for OCR and document export, a Next.js web platform with role-based portals and AI tools, and a React Native mobile app for tailored user experiences, document scanning, and offline access. The system also supports extensive academic content management, including an AI-powered question bank.

# User Preferences

No specific user preferences were provided in the original document.

# System Architecture

The project is structured as a pnpm workspace monorepo, leveraging Node.js 24 and TypeScript 5.9.

## Core Technologies
- **Monorepo Tool**: pnpm workspaces
- **Package Manager**: pnpm
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (v4) and drizzle-zod
- **API Codegen**: Orval (from OpenAPI spec)
- **Build Tool**: esbuild

## UI/UX and Branding
A consistent brand identity is maintained across all platforms:
- **Colors**: Navy (#0A1F5C), Teal (#0D7377), Maroon (#8B1A1A), Gold (#C9A84C)
- **Fonts**: Playfair Display (headings), Plus Jakarta Sans (body), Inter (monospace for mobile)
- **UI Frameworks**: shadcn/ui and Tailwind CSS v4 for web interfaces.

## Technical Implementations and Features

### API Server (`artifacts/api-server`)
- Express 5 backend with Drizzle ORM and PostgreSQL.
- **OCR Router**: Supports 5 switchable OCR engines (Pix2Text default, SimpleTex, LaTeX-OCR, MathPix, Google Vision) with configurable persistence.
- **Endpoints**: `/api/scan` (multipart image upload), `/api/settings/ocr` (GET/PUT config), `/api/export/pdf`, `/api/export/docx`, `/api/health`.
- OCR adapters are factory-managed based on configuration.

### Pinnacle Full Platform (`artifacts/pinnacle-website`)
- Built with Next.js 15 (App Router) and Tailwind CSS v4.
- **Authentication**: Clerk (`@clerk/nextjs`) for user management and route protection.
- **Database**: PostgreSQL + Drizzle ORM, shared `lib/db` schema, including a question bank with `tsvector` for full-text search.
- **Content**: 16 public pages and role-specific portals (Student, Parent, Teacher, Admin).
- **Teacher Mock Tests**: Creation and management of mock tests with performance analytics, scheduling, diagrams/figures via object storage, inline LaTeX support (KaTeX), and bulk CSV import. Supports multiple question types: `mcq`, `multi`, and `numerical`. Includes mock test sections for grouping questions, per-question analytics, autosave, and resume functionality for student attempts. Features student rank, percentile, leaderboard, and section-wise performance.
- **AI Assistant**: Admin and Teacher portals include an AI workspace powered by Replit AI Integrations for various academic tasks, utilizing SSE for streaming.
- **Object Storage**: GCS-backed for image and PDF uploads and serving.
- **API Routes (`/api/v1/`)**: Comprehensive APIs for health, courses, notices, enquiries (with CSV export and email triggers), materials, assignments, teachers, upload, storage, AI generation, gallery, SEO, and user management.
- **Transactional Email**: Resend integration for various notifications, including weekly parent progress digests.
- **Bulk Import Templates**: Downloadable sample templates for all CSV/XLSX importers.
- **Previous-Year Questions (PYQ)**: Question bank entries with `year` and `examName` fields, enabling filtering and display.
- **Adaptive Practice & Engagement**: Features for weak topic identification, practice streaks, and a public weekly leaderboard.
- **Gallery**: DB-backed `galleryItems` with admin CRUD and public display.
- **SEO Overrides**: DB-backed `seoOverrides` for route-specific metadata.
- **User Management**: Admin interface for user and role management.
- **JSON-LD Structured Data**: Implemented for homepage and courses page.
- **Question Bank**: Seeded with 11,595 MCQ questions, includes an AI Question Generator, and a two-stage soft-delete governance process with an admin-managed Recycle Bin and audit logs.
- **Practice Sets**: Teacher/admin-curated question bundles assigned to students with optional due dates, accessible via student portal.

### Pinnacle Mobile App (`artifacts/pinnacle-mobile`)
- Expo React Native app (iOS, Android, Web).
- **Role-based Access**: Distinct tab navigations for Student, Parent, Teacher, Admin.
- **Demo Mode**: Read-only functionality for write actions.
- **Scan Document**: Uses `expo-camera` for document scanning, OCR API integration, KaTeX WebView preview, and PDF/DOCX export with native sharing.
- **Push Notifications**: `expo-notifications` for permissions and notifications.
- **Offline Caching**: Timetable screens cache data to AsyncStorage.

### Other Artifacts
- **Mockup Sandbox (`artifacts/mockup-sandbox`)**: Vite dev server for canvas component previews.
- **Pinnacle Proposal (`artifacts/pinnacle-proposal`)**: React + Vite based 25-slide pitch deck.

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