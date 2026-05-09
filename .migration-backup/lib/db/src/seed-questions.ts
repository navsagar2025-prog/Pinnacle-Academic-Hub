import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { questionBank } from "./schema/index";
import { generatePhysicsQuestions } from "./seed-data/physics";
import { generateChemistryQuestions } from "./seed-data/chemistry";
import { generateMathematicsQuestions } from "./seed-data/mathematics";
import { generateBiologyQuestions } from "./seed-data/biology";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function seedQuestions() {
  console.log("🔬 Seeding Question Bank...");

  const physics = generatePhysicsQuestions();
  const chemistry = generateChemistryQuestions();
  const mathematics = generateMathematicsQuestions();
  const biology = generateBiologyQuestions();

  const allQuestions = [...physics, ...chemistry, ...mathematics, ...biology];
  console.log(`  Total questions to seed: ${allQuestions.length}`);
  console.log(`  Physics: ${physics.length}`);
  console.log(`  Chemistry: ${chemistry.length}`);
  console.log(`  Mathematics: ${mathematics.length}`);
  console.log(`  Biology: ${biology.length}`);

  const existing = await pool.query("SELECT COUNT(*)::int as cnt FROM question_bank.question_bank WHERE created_by IS NULL");
  const existingCount = existing.rows[0].cnt;
  if (existingCount > 0) {
    console.log(`  Clearing ${existingCount} existing seed questions (created_by IS NULL)...`);
    await pool.query("DELETE FROM question_bank.question_bank WHERE created_by IS NULL");
  }

  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    await db.insert(questionBank).values(
      batch.map((q) => ({
        subject: q.subject,
        topic: q.topic,
        classGrade: q.classGrade,
        year: q.year,
        difficulty: q.difficulty,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        solution: q.solution,
        marks: q.marks,
        isPublished: true,
      })),
    );
    inserted += batch.length;
    if (inserted % 2000 === 0 || i + batchSize >= allQuestions.length) {
      console.log(`  Inserted ${inserted}/${allQuestions.length}...`);
    }
  }

  console.log(`\n✅ Question Bank seeded with ${inserted} questions!`);
  await pool.end();
}

seedQuestions().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
