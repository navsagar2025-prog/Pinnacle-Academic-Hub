import app from "./app";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import { startFeeReminderScheduler, startSocialPostScheduler } from "./lib/scheduler.js";
import { warnSocialEnvMisconfig } from "./lib/social.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure the unique partial index that guards reminder deduplication exists.
// Using IF NOT EXISTS makes this idempotent across all deployments/restarts.
async function applyStartupMigrations(): Promise<void> {
  // One row per (fee_record_id, reminder_date) — prevents duplicate reminders.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_reminder_dedup_idx
      ON audit_logs (action, entity_type, entity_id, (details->>'date'))
      WHERE action       = 'fee_reminder_sent'
        AND entity_type  = 'fee_record'
        AND details->>'date' IS NOT NULL
  `);
  // One row per fee_record_id — prevents duplicate confirmation receipts.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_confirmation_dedup_idx
      ON audit_logs (action, entity_type, entity_id)
      WHERE action      = 'fee_confirmation_sent'
        AND entity_type = 'fee_record'
  `);

  // Social media tables — idempotent creation for fresh deployments
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      platform TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ,
      page_id TEXT,
      status TEXT NOT NULL DEFAULT 'connected',
      connected_by TEXT,
      connected_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_platform_uq ON social_accounts (platform)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      media_urls JSONB DEFAULT '[]',
      platform_targets JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      posted_by_name TEXT,
      approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      rejection_note TEXT,
      linked_blog_id UUID,
      linked_notice_id UUID,
      published_urls JSONB DEFAULT '{}',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts (status)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS social_posts_scheduled_at_idx ON social_posts (scheduled_at)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_teacher_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platforms_allowed JSONB NOT NULL DEFAULT '[]',
      is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      granted_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS social_teacher_access_user_uq ON social_teacher_access (user_id)
  `);
  // Additive column: teacher acknowledgement timestamp for rejection read-state
  await db.execute(sql`
    ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS teacher_seen_at TIMESTAMPTZ
  `);

  // Engagement metrics cache per post per platform
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_post_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      likes INTEGER,
      shares INTEGER,
      comments INTEGER,
      reach INTEGER,
      impressions INTEGER,
      fetch_error TEXT,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS social_post_metrics_post_platform_uq
      ON social_post_metrics (post_id, platform)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS social_post_metrics_post_id_idx
      ON social_post_metrics (post_id)
  `);

  // Assignment submissions table (added for demo-seed submitted state)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id    UUID NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      file_url      TEXT,
      note          TEXT,
      marks_awarded INTEGER,
      feedback      TEXT,
      graded_by     UUID REFERENCES users(id),
      graded_at     TIMESTAMPTZ,
      status        TEXT NOT NULL DEFAULT 'submitted',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS assignment_submissions_assignment_student_uq
      ON assignment_submissions (assignment_id, student_id)
  `);

  logger.info("Startup migrations applied");
}

// ── Gallery seed ────────────────────────────────────────────────────────────
// Replaces any existing locally-served gallery rows (image_url LIKE '/gallery/%')
// with the curated Pinnacle photo catalogue downloaded from JustDial and stored
// under the website's public/gallery/ tree.  Runs on every startup so the
// catalogue stays in sync with the codebase — safe because admin-uploaded items
// (those whose image_url does NOT start with '/gallery/') are left untouched.
//
// Category values match the title-case CATEGORIES constant in GalleryPage.tsx
// ("Classroom", "Events", "Results", "Campus").
async function seedGalleryCatalogue(): Promise<void> {
  // Delete stale locally-served entries so re-seeding is idempotent.
  await db.execute(sql`DELETE FROM gallery_items WHERE image_url LIKE '/gallery/%'`);

  type GalleryEntry = { title: string; imageUrl: string; caption: string; category: string; sortOrder: number };
  const items: GalleryEntry[] = [
    // ── Results ──────────────────────────────────────────────────────────────
    { title: "Maths 100% · Science 100% · SST 96% — Board Results",          imageUrl: "/gallery/results/img01.jpg",                        caption: "Outstanding board exam pass rates across all core subjects",  category: "Results",   sortOrder: 1  },
    { title: "CBSE Class XII Commerce 2020 — Toppers Banner",                 imageUrl: "/gallery/results/img03.jpg",                        caption: "Commerce stream toppers celebrating CBSE 2020 board results", category: "Results",   sortOrder: 2  },
    { title: "Achievement Banner — Board Toppers",                             imageUrl: "/gallery/results/img40.jpg",                        caption: "Pinnacle toppers celebrate their board exam success",          category: "Results",   sortOrder: 3  },
    { title: "Student Achievement — Score Banner",                            imageUrl: "/gallery/results/img41.jpg",                        caption: "Celebrating exceptional board scores at Pinnacle",            category: "Results",   sortOrder: 4  },
    { title: "Toppers Board — Annual Results",                                imageUrl: "/gallery/results/img42.jpg",                        caption: "Annual results board showcasing our star achievers",          category: "Results",   sortOrder: 5  },
    { title: "Pinnacle Toppers 2020 — CBSE Board",                           imageUrl: "/gallery/results/pinnacle-toppers-banner-2020.png", caption: "CBSE Board 2020 toppers from Pinnacle Academic Classes",      category: "Results",   sortOrder: 6  },
    // ── Campus ───────────────────────────────────────────────────────────────
    { title: "Pinnacle Academic Classes — Building Exterior",                 imageUrl: "/gallery/campus/img04.jpg",                         caption: "The Pinnacle Academic Classes campus in Greater Noida",       category: "Campus",    sortOrder: 1  },
    { title: "Campus Corridor — Study Environment",                           imageUrl: "/gallery/campus/img02.jpg",                         caption: "Well-maintained corridors at Pinnacle campus",                category: "Campus",    sortOrder: 2  },
    { title: "Campus Infrastructure",                                         imageUrl: "/gallery/campus/img17.jpg",                         caption: "Modern infrastructure supporting quality education",           category: "Campus",    sortOrder: 3  },
    { title: "Campus Facilities",                                             imageUrl: "/gallery/campus/img18.jpg",                         caption: "State-of-the-art facilities at Pinnacle Academic Classes",    category: "Campus",    sortOrder: 4  },
    { title: "Campus Common Area",                                            imageUrl: "/gallery/campus/img30.jpg",                         caption: "Spacious common areas for students at Pinnacle",              category: "Campus",    sortOrder: 5  },
    { title: "Campus View — Alpha II, Greater Noida",                        imageUrl: "/gallery/campus/img57.jpg",                         caption: "Pinnacle Academic Classes campus in Alpha II, Greater Noida", category: "Campus",    sortOrder: 6  },
    { title: "Campus Premises",                                               imageUrl: "/gallery/campus/img58.jpg",                         caption: "Well-equipped premises at Pinnacle Academic Classes",         category: "Campus",    sortOrder: 7  },
    // ── Classroom ────────────────────────────────────────────────────────────
    { title: "Students in Classroom — Group Study",                           imageUrl: "/gallery/classroom/img05.jpg",                      caption: "Students engaged in an interactive classroom session",        category: "Classroom", sortOrder: 1  },
    { title: "Classroom Session — Physics",                                   imageUrl: "/gallery/classroom/img06.jpg",                      caption: "An engaging Physics lecture session at Pinnacle",             category: "Faculty",   sortOrder: 2  },
    { title: "Students Learning — Mathematics",                               imageUrl: "/gallery/classroom/img08.jpg",                      caption: "Mathematics class in session at Pinnacle Academic Classes",   category: "Classroom", sortOrder: 3  },
    { title: "Interactive Classroom — Science",                               imageUrl: "/gallery/classroom/img09.jpg",                      caption: "Science students actively participating in class",            category: "Classroom", sortOrder: 4  },
    { title: "Classroom Engagement",                                          imageUrl: "/gallery/classroom/img10.jpg",                      caption: "Students attentively following a lecture at Pinnacle",        category: "Classroom", sortOrder: 5  },
    { title: "Group Learning Session",                                        imageUrl: "/gallery/classroom/img11.jpg",                      caption: "Collaborative learning environment at Pinnacle",              category: "Classroom", sortOrder: 6  },
    { title: "Classroom — Focused Study",                                     imageUrl: "/gallery/classroom/img12.jpg",                      caption: "Students focused on solving problems in class",               category: "Classroom", sortOrder: 7  },
    { title: "Students — Active Participation",                               imageUrl: "/gallery/classroom/img13.jpg",                      caption: "Active classroom participation at Pinnacle Academic Classes",  category: "Classroom", sortOrder: 8  },
    { title: "Classroom Session",                                             imageUrl: "/gallery/classroom/img14.jpg",                      caption: "A productive classroom session at Pinnacle",                  category: "Classroom", sortOrder: 9  },
    { title: "Learning Environment",                                          imageUrl: "/gallery/classroom/img15.jpg",                      caption: "The well-structured learning environment at Pinnacle",        category: "Classroom", sortOrder: 10 },
    { title: "Classroom — JEE Preparation",                                  imageUrl: "/gallery/classroom/img16.jpg",                      caption: "JEE preparation in progress at Pinnacle Academic Classes",    category: "Classroom", sortOrder: 11 },
    { title: "Classroom Study Session",                                       imageUrl: "/gallery/classroom/img19.jpg",                      caption: "Students in a focused study session",                         category: "Classroom", sortOrder: 12 },
    { title: "Classroom — NEET Batch",                                        imageUrl: "/gallery/classroom/img20.jpg",                      caption: "NEET batch students studying Biology at Pinnacle",            category: "Classroom", sortOrder: 13 },
    { title: "Interactive Learning",                                          imageUrl: "/gallery/classroom/img21.jpg",                      caption: "Interactive learning session at Pinnacle Academic Classes",   category: "Classroom", sortOrder: 14 },
    { title: "Classroom — Chemistry Lecture",                                 imageUrl: "/gallery/classroom/img22.jpg",                      caption: "Chemistry lecture in progress at Pinnacle",                   category: "Classroom", sortOrder: 15 },
    { title: "Students — Problem Solving",                                    imageUrl: "/gallery/classroom/img23.jpg",                      caption: "Students solving complex problems in class",                  category: "Classroom", sortOrder: 16 },
    { title: "Classroom — Board Prep",                                        imageUrl: "/gallery/classroom/img31.jpg",                      caption: "Board exam preparation session at Pinnacle",                  category: "Classroom", sortOrder: 17 },
    { title: "Faculty — Concept Guidance",                                    imageUrl: "/gallery/classroom/img32.jpg",                      caption: "Faculty guiding students through key concepts at Pinnacle",   category: "Faculty",   sortOrder: 1  },
    { title: "Classroom — Senior Batch",                                      imageUrl: "/gallery/classroom/img33.jpg",                      caption: "Senior batch classroom session at Pinnacle",                  category: "Classroom", sortOrder: 19 },
    { title: "Classroom — Junior Batch",                                      imageUrl: "/gallery/classroom/img34.jpg",                      caption: "Junior batch students in a learning session",                 category: "Classroom", sortOrder: 20 },
    { title: "Faculty — Class Lecture",                                       imageUrl: "/gallery/classroom/img35.jpg",                      caption: "Faculty delivering an engaging lecture at Pinnacle",          category: "Faculty",   sortOrder: 3  },
    // ── Events ───────────────────────────────────────────────────────────────
    { title: "Award Ceremony — Toppers Felicitation",                         imageUrl: "/gallery/events/img07.jpg",                         caption: "Felicitation ceremony for board toppers at Pinnacle",         category: "Events",    sortOrder: 1  },
    { title: "Annual Function — Student Performance",                         imageUrl: "/gallery/events/img24.jpg",                         caption: "Students performing at Pinnacle annual function",             category: "Events",    sortOrder: 2  },
    { title: "Prize Distribution Ceremony",                                   imageUrl: "/gallery/events/img25.jpg",                         caption: "Prize distribution celebrating student achievements",          category: "Events",    sortOrder: 3  },
    { title: "Orientation Day — New Batch",                                   imageUrl: "/gallery/events/img26.jpg",                         caption: "Orientation day for the new batch at Pinnacle",               category: "Events",    sortOrder: 4  },
    { title: "Seminar — Career Guidance",                                     imageUrl: "/gallery/events/img27.jpg",                         caption: "Career guidance seminar for students and parents",            category: "Events",    sortOrder: 5  },
    { title: "Workshop — Exam Strategy",                                      imageUrl: "/gallery/events/img28.jpg",                         caption: "Exam strategy workshop for JEE and NEET aspirants",           category: "Events",    sortOrder: 6  },
    { title: "Student Gathering — Celebration",                               imageUrl: "/gallery/events/img29.jpg",                         caption: "Students celebrating success at Pinnacle Academic Classes",   category: "Events",    sortOrder: 7  },
    { title: "Special Lecture — Guest Faculty",                               imageUrl: "/gallery/events/img59.jpg",                         caption: "Special lecture by guest faculty at Pinnacle",                category: "Events",    sortOrder: 8  },
    { title: "Student Event — Group Photo",                                   imageUrl: "/gallery/events/img60.jpg",                         caption: "Group photo at a Pinnacle student event",                     category: "Events",    sortOrder: 9  },
    { title: "Felicitation — Board Exam Toppers",                             imageUrl: "/gallery/events/img61.jpg",                         caption: "Board exam toppers being felicitated at Pinnacle",            category: "Events",    sortOrder: 10 },
    { title: "Parent-Teacher Meeting",                                        imageUrl: "/gallery/events/img62.jpg",                         caption: "Parent-teacher interaction at Pinnacle Academic Classes",     category: "Events",    sortOrder: 11 },
    { title: "Annual Prize Day",                                              imageUrl: "/gallery/events/img63.jpg",                         caption: "Annual prize day celebrating student excellence",              category: "Events",    sortOrder: 12 },
    { title: "Cultural Program — Students",                                   imageUrl: "/gallery/events/img64.jpg",                         caption: "Students participating in a cultural program",                category: "Events",    sortOrder: 13 },
    { title: "Topper Felicitation Function",                                  imageUrl: "/gallery/events/img65.jpg",                         caption: "Topper felicitation function at Pinnacle Academic Classes",   category: "Events",    sortOrder: 14 },
    { title: "Special Session — Motivational Talk",                           imageUrl: "/gallery/events/img66.jpg",                         caption: "Motivational talk session for Pinnacle students",             category: "Events",    sortOrder: 15 },
    { title: "Student Achievement — Celebration",                             imageUrl: "/gallery/events/img67.jpg",                         caption: "Celebrating student achievements at Pinnacle",                category: "Events",    sortOrder: 16 },
    { title: "Annual Gathering",                                              imageUrl: "/gallery/events/img68.jpg",                         caption: "Annual gathering of students and faculty at Pinnacle",        category: "Events",    sortOrder: 17 },
  ];

  for (const item of items) {
    await db.execute(sql`
      INSERT INTO gallery_items (id, title, image_url, caption, category, sort_order, is_visible, created_at, updated_at)
      VALUES (gen_random_uuid(), ${item.title}, ${item.imageUrl}, ${item.caption}, ${item.category}, ${item.sortOrder}, true, NOW(), NOW())
    `);
  }
  logger.info({ count: items.length }, "Gallery seed: replaced local photo catalogue");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Warn early if social media env vars look misconfigured (missing required pair)
  warnSocialEnvMisconfig();

  applyStartupMigrations()
    .then(() => seedGalleryCatalogue())
    .then(() => {
      startFeeReminderScheduler();
      startSocialPostScheduler();
    })
    .catch((migErr) => {
      logger.error({ err: migErr }, "Startup migration failed");
      startFeeReminderScheduler();
      startSocialPostScheduler();
    });
});
