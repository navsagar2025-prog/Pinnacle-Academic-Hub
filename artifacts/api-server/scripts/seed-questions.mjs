#!/usr/bin/env node
/**
 * seed-questions.mjs — AI-powered question bank seeder
 * Generates 2000 questions per subject (Physics, Chemistry, Mathematics, Biology)
 * using Claude and inserts them into the question_bank PostgreSQL schema.
 *
 * Run: node artifacts/api-server/scripts/seed-questions.mjs
 */

import pg from 'pg';
import { randomUUID } from 'crypto';

const { Pool } = pg;
const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
const BATCH_SIZE     = 40;   // questions per API call
const CONCURRENCY    = 4;    // parallel API calls
const TARGET_PER_SUBJECT = 2000;

if (!DB_URL)       throw new Error('DATABASE_URL not set');
if (!ANTHROPIC_BASE) throw new Error('AI_INTEGRATIONS_ANTHROPIC_BASE_URL not set');

const pool = new Pool({ connectionString: DB_URL, ssl: DB_URL.includes('supabase') ? { rejectUnauthorized: false } : false });

// ── Subject topic maps ─────────────────────────────────────────────────────
const SUBJECT_CONFIG = {
  Physics: {
    examTargets: ['JEE_MAIN', 'JEE_ADVANCED', 'NEET'],
    topics: [
      'Kinematics','Newton\'s Laws of Motion','Work Energy Power','Rotational Motion',
      'Gravitation','Simple Harmonic Motion','Waves and Sound','Fluid Mechanics',
      'Thermodynamics','Kinetic Theory of Gases','Heat Transfer','Electrostatics',
      'Current Electricity','Magnetic Effects of Current','Electromagnetic Induction',
      'Alternating Current','Electromagnetic Waves','Ray Optics','Wave Optics',
      'Dual Nature of Matter','Atoms and Nuclei','Semiconductor Devices',
      'Communication Systems','Units and Measurements','Laws of Motion',
    ],
  },
  Chemistry: {
    examTargets: ['JEE_MAIN', 'JEE_ADVANCED', 'NEET'],
    topics: [
      'Atomic Structure','Chemical Bonding','States of Matter','Thermodynamics',
      'Equilibrium','Redox Reactions','Electrochemistry','Chemical Kinetics',
      'Coordination Compounds','Solid State','Solutions','Surface Chemistry',
      'General Principles of Isolation of Metals','p-Block Elements',
      'd and f Block Elements','Haloalkanes and Haloarenes','Alcohols Phenols Ethers',
      'Aldehydes Ketones Carboxylic Acids','Amines','Biomolecules','Polymers',
      'Environmental Chemistry','Hydrogen','s-Block Elements','Organic Chemistry Basics',
    ],
  },
  Mathematics: {
    examTargets: ['JEE_MAIN', 'JEE_ADVANCED'],
    topics: [
      'Sets Relations Functions','Complex Numbers','Sequences and Series',
      'Quadratic Equations','Permutations and Combinations','Binomial Theorem',
      'Matrices and Determinants','Limits Continuity Differentiability',
      'Application of Derivatives','Integrals','Application of Integrals',
      'Differential Equations','Coordinate Geometry - Straight Lines',
      'Coordinate Geometry - Circles','Coordinate Geometry - Conics',
      'Vectors','Three Dimensional Geometry','Probability',
      'Statistics','Trigonometry','Inverse Trigonometry',
      'Mathematical Reasoning','Linear Programming','Mathematical Induction',
    ],
  },
  Biology: {
    examTargets: ['NEET'],
    topics: [
      'Cell Structure and Function','Cell Division','Biomolecules',
      'Photosynthesis','Respiration in Plants','Plant Growth and Development',
      'Digestion and Absorption','Breathing and Exchange of Gases',
      'Body Fluids and Circulation','Excretory Products and Elimination',
      'Locomotion and Movement','Neural Control and Coordination',
      'Chemical Coordination','Reproduction in Organisms',
      'Sexual Reproduction in Flowering Plants','Human Reproduction',
      'Reproductive Health','Principles of Inheritance','Molecular Basis of Inheritance',
      'Evolution','Human Health and Disease','Strategies for Enhancement in Food Production',
      'Microbes in Human Welfare','Biotechnology Principles',
      'Biotechnology Applications','Organisms and Populations',
      'Ecosystem','Biodiversity and Conservation','Environmental Issues',
    ],
  },
};

// ── Simple SVG diagrams for questions that need figures ───────────────────
function makeSvgDataUri(subject, topic) {
  const svgs = {
    Physics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f0f4ff" rx="8"/>
      <line x1="30" y1="100" x2="270" y2="100" stroke="#0A1F5C" stroke-width="2" marker-end="url(#arr)"/>
      <line x1="150" y1="30" x2="150" y2="170" stroke="#0A1F5C" stroke-width="2" marker-end="url(#arr)"/>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0A1F5C"/></marker></defs>
      <circle cx="150" cy="100" r="40" fill="none" stroke="#0D7377" stroke-width="2"/>
      <text x="155" y="95" font-size="11" fill="#0A1F5C">${topic.split(' ')[0]}</text>
      <text x="155" y="108" font-size="9" fill="#666">Diagram</text>
    </svg>`,
    Chemistry: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f0fff4" rx="8"/>
      <circle cx="100" cy="100" r="25" fill="#0D7377" opacity="0.15" stroke="#0D7377" stroke-width="2"/>
      <circle cx="180" cy="100" r="25" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" stroke-width="2"/>
      <circle cx="140" cy="60" r="20" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="2"/>
      <line x1="100" y1="100" x2="180" y2="100" stroke="#333" stroke-width="2"/>
      <line x1="100" y1="100" x2="140" y2="60" stroke="#333" stroke-width="2"/>
      <line x1="180" y1="100" x2="140" y2="60" stroke="#333" stroke-width="2"/>
      <text x="85" y="105" font-size="11" fill="#0D7377">A</text>
      <text x="185" y="105" font-size="11" fill="#C9A84C">B</text>
      <text x="136" y="55" font-size="11" fill="#0A1F5C">C</text>
      <text x="95" y="170" font-size="10" fill="#666">${topic.substring(0,20)}</text>
    </svg>`,
    Mathematics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#fff8f0" rx="8"/>
      <line x1="20" y1="170" x2="280" y2="170" stroke="#333" stroke-width="1.5"/>
      <line x1="150" y1="10" x2="150" y2="190" stroke="#333" stroke-width="1.5"/>
      <path d="M30,170 Q150,20 270,170" fill="none" stroke="#0D7377" stroke-width="2.5"/>
      <circle cx="150" cy="95" r="3" fill="#C9A84C"/>
      <text x="155" y="90" font-size="10" fill="#C9A84C">vertex</text>
      <text x="85" y="190" font-size="10" fill="#666">${topic.split(' ')[0]}</text>
    </svg>`,
    Biology: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f5fff5" rx="8"/>
      <ellipse cx="150" cy="100" rx="80" ry="60" fill="#0D7377" opacity="0.1" stroke="#0D7377" stroke-width="2"/>
      <ellipse cx="150" cy="100" rx="35" ry="25" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="1.5"/>
      <circle cx="130" cy="80" r="6" fill="#C9A84C" opacity="0.6"/>
      <circle cx="170" cy="90" r="5" fill="#C9A84C" opacity="0.6"/>
      <circle cx="155" cy="120" r="7" fill="#C9A84C" opacity="0.6"/>
      <text x="130" y="170" font-size="10" fill="#666">${topic.split(' ')[0]}</text>
    </svg>`,
  };
  const svg = svgs[subject] || svgs.Physics;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ── Anthropic API call ────────────────────────────────────────────────────
async function generateBatch(subject, topics, count, examTargets, attempt = 0) {
  const topicSample = topics.sort(() => Math.random() - 0.5).slice(0, 4).join(', ');
  const prompt = `Generate exactly ${count} high-quality practice questions for ${subject} covering these topics: ${topicSample}.
These are for Indian competitive exams: ${examTargets.join(', ')}.

Return ONLY a valid JSON array. No markdown, no explanation, no extra text.
Each object must have EXACTLY these fields:
{
  "questionText": "Clear question text (no LaTeX, use plain text math notation)",
  "questionType": "mcq" | "numerical" | "short",
  "topic": "specific topic name",
  "difficulty": "easy" | "medium" | "hard",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."} (only for mcq, null otherwise),
  "correctAnswer": "A"/"B"/"C"/"D" for mcq, or the numerical answer, or short answer key phrase,
  "solution": "Clear step-by-step solution explanation",
  "marks": 4 (use 4 for MCQ, 4 for numerical, 2 for short),
  "examTarget": ["${examTargets[0]}"],
  "classGrade": "12",
  "needsFigure": true/false (true for ~25% of questions that genuinely need a diagram)
}

Mix difficulties: 30% easy, 45% medium, 25% hard.
Mix types: 60% mcq, 25% numerical, 15% short (ensure numerical has numeric answer).
Questions must be original, educationally sound, and appropriate for JEE/NEET level.`;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 429 && attempt < 5) {
      const wait = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
      console.log(`  Rate limited, waiting ${(wait/1000).toFixed(1)}s...`);
      await new Promise(r => setTimeout(r, wait));
      return generateBatch(subject, topics, count, examTargets, attempt + 1);
    }
    throw new Error(`Anthropic API ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text ?? '';

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`No JSON array in response. Got: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

// ── Insert batch into DB ─────────────────────────────────────────────────
async function insertQuestions(client, subject, questions) {
  if (!questions?.length) return 0;
  let inserted = 0;
  for (const q of questions) {
    try {
      const needsFigure = q.needsFigure === true;
      const imageUrl = needsFigure ? makeSvgDataUri(subject, q.topic || subject) : null;
      await client.query(`
        INSERT INTO question_bank.question_bank
          (id, subject, topic, class_grade, difficulty, question_type,
           question_text, options, correct_answer, solution,
           image_url, exam_target, exam_name, marks, source,
           review_status, is_published, language, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
        ON CONFLICT DO NOTHING
      `, [
        randomUUID(),
        subject,
        (q.topic || subject).substring(0, 200),
        q.classGrade || '12',
        ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        ['mcq','numerical','short','long'].includes(q.questionType) ? q.questionType : 'mcq',
        (q.questionText || '').substring(0, 2000),
        q.questionType === 'mcq' && q.options ? JSON.stringify(q.options) : null,
        String(q.correctAnswer || 'A').substring(0, 100),
        (q.solution || '').substring(0, 2000),
        imageUrl,
        q.examTarget || ['JEE_MAIN'],
        null,
        typeof q.marks === 'number' ? q.marks : 4,
        'AI',
        'approved',
        true,
        'en',
      ]);
      inserted++;
    } catch (e) {
      // skip individual bad rows silently
    }
  }
  return inserted;
}

// ── Main seeding loop ────────────────────────────────────────────────────
async function seedSubject(subject, config) {
  const { topics, examTargets } = config;
  const batchCount = Math.ceil(TARGET_PER_SUBJECT / BATCH_SIZE);
  let totalInserted = 0;
  const client = await pool.connect();

  console.log(`\n[${subject}] Generating ${TARGET_PER_SUBJECT} questions in ${batchCount} batches...`);

  // Process in groups of CONCURRENCY
  for (let i = 0; i < batchCount; i += CONCURRENCY) {
    const group = [];
    for (let j = i; j < Math.min(i + CONCURRENCY, batchCount); j++) {
      group.push(j);
    }

    const results = await Promise.allSettled(
      group.map(async (batchIdx) => {
        const topicSlice = topics.slice((batchIdx * 4) % topics.length);
        const qs = await generateBatch(subject, topicSlice, BATCH_SIZE, examTargets);
        return insertQuestions(client, subject, qs);
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') totalInserted += r.value;
      else console.error(`  Batch error: ${r.reason?.message ?? r.reason}`);
    }

    process.stdout.write(`\r  [${subject}] ${totalInserted}/${TARGET_PER_SUBJECT} inserted...`);

    // Small pause between groups to avoid rate limits
    if (i + CONCURRENCY < batchCount) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  client.release();
  console.log(`\n  [${subject}] Done: ${totalInserted} questions inserted.`);
  return totalInserted;
}

// ── Entry point ──────────────────────────────────────────────────────────
async function main() {
  console.log('=== Pinnacle Question Bank Seeder ===');
  console.log(`Target: ${TARGET_PER_SUBJECT} questions per subject × 4 subjects = ${TARGET_PER_SUBJECT * 4} total`);

  // Ensure question_bank schema exists
  const client = await pool.connect();
  await client.query(`CREATE SCHEMA IF NOT EXISTS question_bank`);
  client.release();

  let grand = 0;
  for (const [subject, config] of Object.entries(SUBJECT_CONFIG)) {
    grand += await seedSubject(subject, config);
  }

  console.log(`\n✅ Complete! Total inserted: ${grand}`);
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
