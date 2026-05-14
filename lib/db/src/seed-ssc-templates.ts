/**
 * seed-ssc-templates.ts — seeds SSC exam templates (CGL Tier-1, CGL Tier-2 Paper-1,
 * CHSL Tier-1) plus their sectional layout (subject / question count / time / marking).
 *
 * Idempotent: every template is upserted by `code`, sections are reset on re-seed.
 *
 * Run: pnpm --filter @workspace/db exec tsx src/seed-ssc-templates.ts
 */

import { Pool } from "pg";

const DB_URL = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: DB_URL });

type Section = {
  name: string;
  subject: string;          // must match question_bank.subject values
  questionCount: number;
  durationMinutes?: number; // null for non-sectional timed papers
  sortOrder: number;
};

type Template = {
  code: string;
  name: string;
  examFamily: "SSC_CGL" | "SSC_CHSL";
  tier: "Tier1" | "Tier2";
  totalDurationMinutes: number;
  marksPerCorrect: string;  // numeric as text — preserves "0.5" exactly
  negativeMarks: string;
  description: string;
  sections: Section[];
};

const TEMPLATES: Template[] = [
  {
    code: "SSC_CGL_TIER_1",
    name: "SSC CGL Tier-1 (CBT)",
    examFamily: "SSC_CGL",
    tier: "Tier1",
    totalDurationMinutes: 60,
    marksPerCorrect: "2",
    negativeMarks: "0.5",
    description:
      "100 questions across 4 sections (25 each). 60-minute composite timer. " +
      "Marking: +2 / -0.5. Bilingual paper (English + Hindi).",
    sections: [
      { name: "General Intelligence & Reasoning", subject: "Reasoning",                questionCount: 25, sortOrder: 0 },
      { name: "General Awareness",                subject: "General Awareness",        questionCount: 25, sortOrder: 1 },
      { name: "Quantitative Aptitude",            subject: "Quantitative Aptitude",    questionCount: 25, sortOrder: 2 },
      { name: "English Comprehension",            subject: "English",                  questionCount: 25, sortOrder: 3 },
    ],
  },
  {
    code: "SSC_CGL_TIER_2_PAPER_1",
    name: "SSC CGL Tier-2 Paper-1 (Mandatory)",
    examFamily: "SSC_CGL",
    tier: "Tier2",
    totalDurationMinutes: 150,
    marksPerCorrect: "3",
    negativeMarks: "1",
    description:
      "Mandatory paper for all CGL aspirants. 150 questions across Math (30), " +
      "Reasoning (30), English (45), GA (25), Computer (20). +3 / -1 marking.",
    sections: [
      { name: "Mathematical Abilities",        subject: "Quantitative Aptitude", questionCount: 30, sortOrder: 0 },
      { name: "Reasoning & General Intelligence", subject: "Reasoning",          questionCount: 30, sortOrder: 1 },
      { name: "English Language & Comprehension", subject: "English",            questionCount: 45, sortOrder: 2 },
      { name: "General Awareness",             subject: "General Awareness",     questionCount: 25, sortOrder: 3 },
      { name: "Computer Knowledge",            subject: "General Awareness",     questionCount: 20, sortOrder: 4 },
    ],
  },
  {
    code: "SSC_CHSL_TIER_1",
    name: "SSC CHSL Tier-1 (CBT)",
    examFamily: "SSC_CHSL",
    tier: "Tier1",
    totalDurationMinutes: 60,
    marksPerCorrect: "2",
    negativeMarks: "0.5",
    description:
      "100 questions across 4 sections (25 each). Identical structure to CGL Tier-1 " +
      "but pitched at 10+2 level. 60-minute composite timer. Bilingual.",
    sections: [
      { name: "General Intelligence",  subject: "Reasoning",             questionCount: 25, sortOrder: 0 },
      { name: "General Awareness",     subject: "General Awareness",     questionCount: 25, sortOrder: 1 },
      { name: "Quantitative Aptitude", subject: "Quantitative Aptitude", questionCount: 25, sortOrder: 2 },
      { name: "English Language",      subject: "English",               questionCount: 25, sortOrder: 3 },
    ],
  },
];

async function upsertTemplate(t: Template): Promise<void> {
  // Upsert template, then wipe + reinsert sections so re-seeding stays idempotent.
  const { rows } = await pool.query(
    `INSERT INTO exam_templates
       (code, name, exam_family, tier, total_duration_minutes,
        marks_per_correct, negative_marks, description, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       exam_family = EXCLUDED.exam_family,
       tier = EXCLUDED.tier,
       total_duration_minutes = EXCLUDED.total_duration_minutes,
       marks_per_correct = EXCLUDED.marks_per_correct,
       negative_marks = EXCLUDED.negative_marks,
       description = EXCLUDED.description,
       is_active = true
     RETURNING id`,
    [t.code, t.name, t.examFamily, t.tier, t.totalDurationMinutes,
     t.marksPerCorrect, t.negativeMarks, t.description],
  );
  const templateId = rows[0].id as string;

  await pool.query(`DELETE FROM exam_template_sections WHERE template_id = $1`, [templateId]);

  for (const s of t.sections) {
    await pool.query(
      `INSERT INTO exam_template_sections
         (template_id, name, subject, question_count, duration_minutes, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [templateId, s.name, s.subject, s.questionCount, s.durationMinutes ?? null, s.sortOrder],
    );
  }
  console.log(`  ✓ ${t.code} (${t.sections.length} sections, ${t.sections.reduce((a, s) => a + s.questionCount, 0)} questions)`);
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("SSC Exam Template Seeder");
  console.log("=".repeat(60));
  for (const t of TEMPLATES) await upsertTemplate(t);
  console.log(`\n✅ ${TEMPLATES.length} templates seeded.`);
  await pool.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
