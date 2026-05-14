/**
 * seed-ssc-questions.ts — bilingual (English + Hindi) SSC question bank seeder.
 *
 * Generates ~180 PYQ-flavoured questions per SSC subject (Quant, Reasoning,
 * English, General Awareness) ⇒ ~720 rows on top of the existing 19.6 k JEE/NEET
 * bank. Each question is stored with `language='bi'` and both English + Hindi
 * fields populated (questionText / questionTextHi, options / optionsHi,
 * solution / solutionHi). Skips Hindi for the English subject — that section is
 * inherently English-only.
 *
 * Insert is dedupe-safe: ON CONFLICT against the new
 * `(subject, language, normalized_text)` partial unique index.
 *
 * Run: pnpm --filter @workspace/db exec tsx src/seed-ssc-questions.ts
 */

import { Pool } from "pg";
import { randomUUID } from "crypto";

const DB_URL = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!DB_URL) throw new Error("DATABASE_URL not set");
if (!ANTHROPIC_BASE) throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL not set");
if (!ANTHROPIC_KEY) throw new Error("AI_INTEGRATIONS_ANTHROPIC_API_KEY not set");

const pool = new Pool({ connectionString: DB_URL });

const BATCH_SIZE = 12;
const CONCURRENCY = 4;
const TARGET_PER_SUBJECT = 180;
const MAX_OUTPUT_TOKENS = 16384;

type SubjectKey = "Quantitative Aptitude" | "Reasoning" | "English" | "General Awareness";

const SUBJECT_CONFIG: Record<SubjectKey, {
  examTargets: string[];
  topics: string[];
  bilingual: boolean;        // false for English (no Hindi mirror)
  pyqFlavour: string;        // hint for the prompt
}> = {
  "Quantitative Aptitude": {
    examTargets: ["SSC_CGL", "SSC_CHSL", "SSC_TIER_1"],
    bilingual: true,
    pyqFlavour: "Modelled on actual SSC CGL/CHSL Tier-1 PYQs (2018-2024).",
    topics: [
      "Number System", "HCF and LCM", "Percentage", "Profit and Loss",
      "Simple and Compound Interest", "Ratio and Proportion", "Average",
      "Time and Work", "Time Speed and Distance", "Pipes and Cisterns",
      "Mixture and Alligation", "Mensuration 2D", "Mensuration 3D",
      "Geometry — Triangles", "Geometry — Circles", "Trigonometry",
      "Heights and Distances", "Algebra — Identities", "Linear Equations",
      "Data Interpretation — Bar Graph", "Data Interpretation — Pie Chart",
      "Statistics", "Boat and Stream", "Partnership", "Discount",
    ],
  },
  Reasoning: {
    examTargets: ["SSC_CGL", "SSC_CHSL", "SSC_TIER_1"],
    bilingual: true,
    pyqFlavour: "Modelled on SSC CGL Tier-1 GI & Reasoning PYQs (2019-2024).",
    topics: [
      "Analogy", "Classification (Odd One Out)", "Series — Number",
      "Series — Letter", "Series — Mixed", "Coding-Decoding",
      "Blood Relations", "Direction Sense", "Ranking and Order",
      "Seating Arrangement", "Syllogism", "Statement and Conclusion",
      "Statement and Assumption", "Cube and Dice", "Mirror & Water Image",
      "Paper Folding and Cutting", "Embedded Figures", "Counting Figures",
      "Venn Diagram", "Matrix Reasoning", "Missing Number",
      "Mathematical Operations", "Word Formation", "Dictionary Order",
      "Non-Verbal Reasoning",
    ],
  },
  English: {
    examTargets: ["SSC_CGL", "SSC_CHSL", "SSC_TIER_1"],
    bilingual: false, // English Comprehension has no Hindi mirror by design
    pyqFlavour: "Modelled on SSC English Comprehension PYQs (2019-2024).",
    topics: [
      "Synonyms", "Antonyms", "One Word Substitution", "Idioms and Phrases",
      "Spelling Correction", "Sentence Improvement", "Error Spotting",
      "Active Passive Voice", "Direct Indirect Speech", "Cloze Test",
      "Para Jumbles", "Reading Comprehension", "Fill in the Blanks",
      "Phrase Substitution", "Spotting Errors — Articles",
      "Spotting Errors — Prepositions", "Spotting Errors — Tense",
      "Spotting Errors — Subject-Verb Agreement", "Vocabulary",
      "Sentence Rearrangement",
    ],
  },
  "General Awareness": {
    examTargets: ["SSC_CGL", "SSC_CHSL", "SSC_TIER_1"],
    bilingual: true,
    pyqFlavour: "Modelled on SSC CGL/CHSL GA & Current Affairs PYQs (2020-2024).",
    topics: [
      "Indian History — Ancient", "Indian History — Medieval",
      "Indian History — Modern (Freedom Struggle)", "Indian Polity — Constitution",
      "Indian Polity — Parliament", "Indian Geography — Physical",
      "Indian Geography — Economic", "World Geography",
      "Indian Economy — Banking", "Indian Economy — Budget",
      "General Science — Physics", "General Science — Chemistry",
      "General Science — Biology", "Static GK — Awards", "Static GK — Books",
      "Static GK — Sports", "Current Affairs — Schemes",
      "Current Affairs — International", "Current Affairs — Appointments",
      "Computer Awareness", "Important Days", "Indian Culture", "Defence",
      "Environment", "Indian Art and Culture",
    ],
  },
};

// ── Anthropic call ──────────────────────────────────────────────────────────
async function generateBatch(
  subject: SubjectKey,
  topics: string[],
  count: number,
  bilingual: boolean,
  pyqFlavour: string,
  attempt = 0,
): Promise<unknown[]> {
  const topicSample = [...topics].sort(() => Math.random() - 0.5).slice(0, 5).join(", ");
  const hindiBlock = bilingual
    ? `
- "questionTextHi": faithful Hindi translation of questionText (Devanagari script)
- "optionsHi": object {A,B,C,D} with Hindi translations of options (mcq only, else null)
- "solutionHi": Hindi translation of the solution`
    : "";
  const prompt = `Generate exactly ${count} high-quality SSC competitive-exam questions for "${subject}".
${pyqFlavour}
Topics to cover (mix them, do not repeat exact phrasing): ${topicSample}.

Return ONLY a valid JSON array, no markdown fence, no explanation. Each object must have EXACTLY these keys:
{
  "questionText": "Question in clear English (plain text, no LaTeX)",
  "questionType": "mcq" | "numerical" | "short",
  "topic": "specific topic from the list",
  "difficulty": "easy" | "medium" | "hard",
  "options": {"A":"...","B":"...","C":"...","D":"..."} (mcq only, else null),
  "correctAnswer": "A"/"B"/"C"/"D" for mcq, numeric value for numerical, key phrase for short,
  "solution": "Step-by-step explanation in plain English",
  "marks": 2${hindiBlock}
}

Rules:
- Mix difficulties: 35% easy, 45% medium, 20% hard
- Predominantly mcq (~80%); include some numerical for Quant
- Each question must be PYQ-flavoured: factual, concise, exam-appropriate
- Original wording — do not copy verbatim from any source
- Exactly ${count} items in the array`;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    if ((resp.status === 429 || resp.status === 529) && attempt < 6) {
      const wait = Math.pow(2, attempt) * 2500 + Math.random() * 1000;
      console.log(`  ⏳ ${resp.status}, retrying in ${(wait / 1000).toFixed(1)}s…`);
      await new Promise((r) => setTimeout(r, wait));
      return generateBatch(subject, topics, count, bilingual, pyqFlavour, attempt + 1);
    }
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json() as { content?: Array<{ text?: string }> };
  const text: string = data.content?.[0]?.text ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ── Insert ──────────────────────────────────────────────────────────────────
async function insertBatch(
  subject: SubjectKey,
  questions: unknown[],
  examTargets: string[],
  bilingual: boolean,
): Promise<number> {
  if (!questions?.length) return 0;
  let count = 0;
  for (const raw of questions) {
    try {
      const q = raw as Record<string, unknown>;
      const qType = ["mcq", "numerical", "short"].includes(q.questionType as string)
        ? (q.questionType as string) : "mcq";
      const diff = ["easy", "medium", "hard"].includes(q.difficulty as string)
        ? (q.difficulty as string) : "medium";
      const language = bilingual ? "bi" : "en";

      const result = await pool.query(
        `INSERT INTO question_bank.question_bank
          (id, subject, topic, class_grade, difficulty, question_type,
           question_text, options, correct_answer, solution,
           exam_target, marks, source, review_status,
           is_published, language,
           question_text_hi, options_hi, solution_hi,
           created_at, updated_at)
         VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
         ON CONFLICT (subject, language, normalized_text) WHERE deleted_at IS NULL DO NOTHING
         RETURNING id`,
        [
          randomUUID(),
          subject,
          String(q.topic || subject).substring(0, 200),
          diff,
          qType,
          String(q.questionText || "").substring(0, 2000),
          qType === "mcq" && q.options ? JSON.stringify(q.options) : null,
          String(q.correctAnswer ?? "A").substring(0, 200),
          String(q.solution || "").substring(0, 3000),
          examTargets,
          typeof q.marks === "number" ? q.marks : 2,
          "AI_SSC",
          "approved",
          true,
          language,
          bilingual ? String(q.questionTextHi || "").substring(0, 2000) : null,
          bilingual && q.optionsHi ? JSON.stringify(q.optionsHi) : null,
          bilingual ? String(q.solutionHi || "").substring(0, 3000) : null,
        ],
      );
      if (result.rowCount && result.rowCount > 0) count++;
    } catch (e) {
      // skip bad rows; conflicts already eaten by ON CONFLICT
      const msg = (e as Error)?.message ?? "";
      if (!msg.includes("duplicate key")) {
        console.warn(`  · skip: ${msg.slice(0, 100)}`);
      }
    }
  }
  return count;
}

async function seedSubject(subject: SubjectKey): Promise<number> {
  const cfg = SUBJECT_CONFIG[subject];
  const batches = Math.ceil(TARGET_PER_SUBJECT / BATCH_SIZE);
  let total = 0;
  console.log(`\n[${subject}] target=${TARGET_PER_SUBJECT}, batches=${batches}, bilingual=${cfg.bilingual}`);

  for (let i = 0; i < batches; i += CONCURRENCY) {
    const group = Array.from({ length: Math.min(CONCURRENCY, batches - i) }, (_, j) => i + j);
    const results = await Promise.allSettled(
      group.map(async (bi) => {
        const slice = cfg.topics.slice((bi * 5) % cfg.topics.length).concat(cfg.topics.slice(0, 5));
        const qs = await generateBatch(subject, slice, BATCH_SIZE, cfg.bilingual, cfg.pyqFlavour);
        return insertBatch(subject, qs, cfg.examTargets, cfg.bilingual);
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") total += r.value;
      else console.error(`  ✗ Batch error: ${(r.reason as Error)?.message ?? r.reason}`);
    }
    console.log(`  [${subject}] ${total}/${TARGET_PER_SUBJECT} (round ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(batches / CONCURRENCY)})`);
    if (i + CONCURRENCY < batches) await new Promise((r) => setTimeout(r, 800));
  }
  console.log(`  ✓ [${subject}] ${total} inserted`);
  return total;
}

process.on("unhandledRejection", (r) => { console.error("UNHANDLED:", r); process.exit(1); });
process.on("uncaughtException",  (e) => { console.error("UNCAUGHT:", e); process.exit(1); });

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("SSC Bilingual Question Bank Seeder");
  console.log(`Target: ${TARGET_PER_SUBJECT} × 4 subjects = ${TARGET_PER_SUBJECT * 4}`);
  console.log("=".repeat(60));
  let grand = 0;
  for (const subj of Object.keys(SUBJECT_CONFIG) as SubjectKey[]) {
    grand += await seedSubject(subj);
  }
  console.log(`\n✅ Seeding complete: ${grand} new SSC questions inserted.`);
  await pool.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
