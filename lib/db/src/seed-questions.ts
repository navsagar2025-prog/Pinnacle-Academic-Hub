/**
 * seed-questions.ts — AI question bank seeder (8000 questions)
 * Run: pnpm --filter @workspace/db exec tsx src/seed-questions.ts
 */

import { Pool } from "pg";
import { randomUUID } from "crypto";

const DB_URL = process.env.DATABASE_URL!;
const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!;

if (!DB_URL) throw new Error("DATABASE_URL not set");
if (!ANTHROPIC_BASE) throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL not set");

const pool = new Pool({ connectionString: DB_URL });

const BATCH_SIZE = 40;
const CONCURRENCY = 4;
const TARGET_PER_SUBJECT = 2000;

// ── SVG diagram generator ────────────────────────────────────────────────
function makeSvg(subject: string, topic: string): string {
  const label = topic.substring(0, 20);
  const svgMap: Record<string, string> = {
    Physics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="300" height="200" fill="#f0f4ff" rx="8"/>
      <defs><marker id="a" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0A1F5C"/></marker></defs>
      <line x1="30" y1="100" x2="260" y2="100" stroke="#0A1F5C" stroke-width="2" marker-end="url(#a)"/>
      <line x1="150" y1="30" x2="150" y2="170" stroke="#0A1F5C" stroke-width="2" marker-end="url(#a)"/>
      <circle cx="150" cy="100" r="42" fill="none" stroke="#0D7377" stroke-width="2.5"/>
      <text x="155" y="95" font-size="11" fill="#0A1F5C" font-family="Arial">${label}</text>
    </svg>`,
    Chemistry: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="300" height="200" fill="#f0fff4" rx="8"/>
      <circle cx="100" cy="100" r="28" fill="#0D7377" opacity="0.15" stroke="#0D7377" stroke-width="2"/>
      <circle cx="200" cy="100" r="28" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" stroke-width="2"/>
      <circle cx="150" cy="55" r="22" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="2"/>
      <line x1="100" y1="100" x2="200" y2="100" stroke="#555" stroke-width="2"/>
      <line x1="100" y1="100" x2="150" y2="55" stroke="#555" stroke-width="2"/>
      <line x1="200" y1="100" x2="150" y2="55" stroke="#555" stroke-width="2"/>
      <text x="80" y="105" font-size="12" fill="#0D7377" font-family="Arial">A</text>
      <text x="207" y="105" font-size="12" fill="#C9A84C" font-family="Arial">B</text>
      <text x="145" y="50" font-size="12" fill="#0A1F5C" font-family="Arial">C</text>
      <text x="80" y="175" font-size="10" fill="#666" font-family="Arial">${label}</text>
    </svg>`,
    Mathematics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="300" height="200" fill="#fff8f0" rx="8"/>
      <line x1="20" y1="170" x2="280" y2="170" stroke="#333" stroke-width="1.5"/>
      <line x1="150" y1="10" x2="150" y2="185" stroke="#333" stroke-width="1.5"/>
      <path d="M30,170 Q150,20 270,170" fill="none" stroke="#0D7377" stroke-width="2.5"/>
      <circle cx="150" cy="95" r="4" fill="#C9A84C"/>
      <text x="155" y="90" font-size="10" fill="#C9A84C" font-family="Arial">vertex</text>
      <text x="155" y="178" font-size="9" fill="#333" font-family="Arial">x</text>
      <text x="153" y="22" font-size="9" fill="#333" font-family="Arial">y</text>
      <text x="65" y="190" font-size="10" fill="#666" font-family="Arial">${label}</text>
    </svg>`,
    Biology: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <rect width="300" height="200" fill="#f5fff5" rx="8"/>
      <ellipse cx="150" cy="100" rx="85" ry="65" fill="#0D7377" opacity="0.1" stroke="#0D7377" stroke-width="2"/>
      <ellipse cx="150" cy="100" rx="38" ry="28" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="1.5"/>
      <circle cx="128" cy="78" r="7" fill="#C9A84C" opacity="0.7"/>
      <circle cx="172" cy="88" r="6" fill="#C9A84C" opacity="0.7"/>
      <circle cx="155" cy="122" r="8" fill="#C9A84C" opacity="0.7"/>
      <text x="120" y="175" font-size="10" fill="#555" font-family="Arial">${label}</text>
    </svg>`,
  };
  const svg = svgMap[subject] ?? svgMap.Physics;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ── Topic maps ───────────────────────────────────────────────────────────
const SUBJECT_CONFIG: Record<string, { examTargets: string[]; topics: string[] }> = {
  Physics: {
    examTargets: ["JEE_MAIN", "JEE_ADVANCED", "NEET"],
    topics: [
      "Kinematics","Newton's Laws of Motion","Work Energy Power","Rotational Motion",
      "Gravitation","Simple Harmonic Motion","Waves and Sound","Fluid Mechanics",
      "Thermodynamics","Kinetic Theory of Gases","Electrostatics","Current Electricity",
      "Magnetic Effects of Current","Electromagnetic Induction","Alternating Current",
      "Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature of Matter",
      "Atoms and Nuclei","Semiconductor Devices","Units and Measurements","Heat Transfer",
      "Projectile Motion","Circular Motion",
    ],
  },
  Chemistry: {
    examTargets: ["JEE_MAIN", "JEE_ADVANCED", "NEET"],
    topics: [
      "Atomic Structure","Chemical Bonding","States of Matter","Thermodynamics",
      "Equilibrium","Redox Reactions","Electrochemistry","Chemical Kinetics",
      "Coordination Compounds","Solid State","Solutions","Surface Chemistry",
      "p-Block Elements","d and f Block Elements","Haloalkanes and Haloarenes",
      "Alcohols Phenols Ethers","Aldehydes Ketones Carboxylic Acids","Amines",
      "Biomolecules","Polymers","Hydrogen","s-Block Elements","Organic Chemistry Basics",
      "General Principles Isolation of Metals","Environmental Chemistry",
    ],
  },
  Mathematics: {
    examTargets: ["JEE_MAIN", "JEE_ADVANCED"],
    topics: [
      "Sets Relations Functions","Complex Numbers","Sequences and Series",
      "Quadratic Equations","Permutations and Combinations","Binomial Theorem",
      "Matrices and Determinants","Limits Continuity Differentiability",
      "Application of Derivatives","Integrals","Application of Integrals",
      "Differential Equations","Straight Lines","Circles","Conics",
      "Vectors","Three Dimensional Geometry","Probability",
      "Statistics","Trigonometry","Inverse Trigonometry",
      "Mathematical Reasoning","Linear Programming","Mathematical Induction","Parabola",
    ],
  },
  Biology: {
    examTargets: ["NEET"],
    topics: [
      "Cell Structure and Function","Cell Division","Biomolecules",
      "Photosynthesis","Respiration in Plants","Plant Growth and Development",
      "Digestion and Absorption","Breathing and Exchange of Gases",
      "Body Fluids and Circulation","Excretory Products and Elimination",
      "Locomotion and Movement","Neural Control and Coordination",
      "Chemical Coordination","Reproduction in Organisms",
      "Sexual Reproduction in Flowering Plants","Human Reproduction",
      "Reproductive Health","Principles of Inheritance","Molecular Basis of Inheritance",
      "Evolution","Human Health and Disease","Biotechnology Principles",
      "Biotechnology Applications","Organisms and Populations","Ecosystem",
    ],
  },
};

// ── Anthropic API call ───────────────────────────────────────────────────
async function generateBatch(
  subject: string,
  topics: string[],
  count: number,
  examTargets: string[],
  attempt = 0,
): Promise<any[]> {
  const topicSample = [...topics].sort(() => Math.random() - 0.5).slice(0, 5).join(", ");
  const prompt = `Generate exactly ${count} high-quality practice questions for ${subject}.
Topics to cover (mix them): ${topicSample}.
These questions are for Indian competitive exams: ${examTargets.join(", ")}.

Return ONLY a valid JSON array with no markdown, no explanation text. Each object must have EXACTLY:
{
  "questionText": "Question text using plain text math (no LaTeX)",
  "questionType": "mcq" | "numerical" | "short",
  "topic": "specific topic",
  "difficulty": "easy" | "medium" | "hard",
  "options": {"A":"...","B":"...","C":"...","D":"..."} (mcq only, else null),
  "correctAnswer": "A"/"B"/"C"/"D" for mcq, numeric value for numerical, key phrase for short,
  "solution": "Step-by-step solution explanation in plain text",
  "marks": 4,
  "needsFigure": true or false (true for ~25% that genuinely need a diagram)
}

Rules:
- Mix difficulties: 30% easy, 45% medium, 25% hard
- Mix types: 60% mcq, 25% numerical, 15% short
- For numerical: correctAnswer must be a number (e.g. "9.8" or "42")
- Questions must be original, accurate, and JEE/NEET level quality
- Exactly ${count} items in the array`;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 429 && attempt < 6) {
      const wait = Math.pow(2, attempt) * 2500 + Math.random() * 1000;
      console.log(`  ⏳ Rate limited (${resp.status}), waiting ${(wait / 1000).toFixed(1)}s…`);
      await new Promise((r) => setTimeout(r, wait));
      return generateBatch(subject, topics, count, examTargets, attempt + 1);
    }
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json() as any;
  const text: string = data.content?.[0]?.text ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response. Text: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ── Insert into DB ───────────────────────────────────────────────────────
async function insertBatch(
  client: InstanceType<typeof Pool>["prototype"],
  subject: string,
  questions: any[],
  examTargets: string[],
): Promise<number> {
  if (!questions?.length) return 0;
  let count = 0;
  for (const q of questions) {
    try {
      const needsFigure = q.needsFigure === true;
      const imageUrl = needsFigure ? makeSvg(subject, q.topic || subject) : null;
      const qType = ["mcq", "numerical", "short", "long"].includes(q.questionType)
        ? q.questionType : "mcq";
      const diff = ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium";
      await client.query(
        `INSERT INTO question_bank.question_bank
          (id, subject, topic, class_grade, difficulty, question_type,
           question_text, options, correct_answer, solution,
           image_url, exam_target, marks, source, review_status,
           is_published, language, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
         ON CONFLICT DO NOTHING`,
        [
          randomUUID(),
          subject,
          String(q.topic || subject).substring(0, 200),
          "12",
          diff,
          qType,
          String(q.questionText || "").substring(0, 2000),
          qType === "mcq" && q.options ? JSON.stringify(q.options) : null,
          String(q.correctAnswer ?? "A").substring(0, 200),
          String(q.solution || "").substring(0, 3000),
          imageUrl,
          examTargets,
          typeof q.marks === "number" ? q.marks : 4,
          "AI",
          "approved",
          true,
          "en",
        ],
      );
      count++;
    } catch (_) {
      // skip bad rows
    }
  }
  return count;
}

// ── Seed a single subject ────────────────────────────────────────────────
async function seedSubject(subject: string, cfg: { examTargets: string[]; topics: string[] }) {
  const { topics, examTargets } = cfg;
  const batches = Math.ceil(TARGET_PER_SUBJECT / BATCH_SIZE);
  let total = 0;
  const client = await pool.connect();

  console.log(`\n[${subject}] Generating ${TARGET_PER_SUBJECT} questions across ${batches} batches…`);

  for (let i = 0; i < batches; i += CONCURRENCY) {
    const group = Array.from({ length: Math.min(CONCURRENCY, batches - i) }, (_, j) => i + j);
    const results = await Promise.allSettled(
      group.map(async (bi) => {
        const slice = topics.slice((bi * 5) % topics.length).concat(topics.slice(0, 5));
        const qs = await generateBatch(subject, slice, BATCH_SIZE, examTargets);
        return insertBatch(client, subject, qs, examTargets);
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") total += r.value;
      else console.error(`  ✗ Batch error: ${r.reason?.message ?? r.reason}`);
    }
    process.stdout.write(`\r  [${subject}] ${total}/${TARGET_PER_SUBJECT} inserted…`);
    if (i + CONCURRENCY < batches) await new Promise((r) => setTimeout(r, 600));
  }

  client.release();
  console.log(`\n  ✓ [${subject}] Done: ${total} inserted.`);
  return total;
}

// ── Entry ────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(50));
  console.log("Pinnacle Question Bank Seeder");
  console.log(`Target: ${TARGET_PER_SUBJECT} × 4 subjects = ${TARGET_PER_SUBJECT * 4} questions`);
  console.log("=".repeat(50));

  let grand = 0;
  for (const [subj, cfg] of Object.entries(SUBJECT_CONFIG)) {
    grand += await seedSubject(subj, cfg);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Seeding complete! Total: ${grand} questions inserted.`);
  console.log("=".repeat(50));
  await pool.end();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
