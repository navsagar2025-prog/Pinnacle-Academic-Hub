/**
 * seed-blog.ts — AI-generated SEO blog post seeder (200 articles)
 * Run: pnpm --filter @workspace/db exec tsx src/seed-blog.ts
 */

import { Pool } from "pg";
import { randomUUID } from "crypto";

const DB_URL   = process.env.DATABASE_URL!;
const ANT_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!;
const ANT_KEY  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!;

if (!DB_URL)   throw new Error("DATABASE_URL not set");
if (!ANT_BASE) throw new Error("AI_INTEGRATIONS_ANTHROPIC_BASE_URL not set");

const pool = new Pool({ connectionString: DB_URL });

const AUTHORS = [
  "Dr. Ramesh Kumar",
  "Ms. Priya Sharma",
  "Dr. Sunita Patel",
  "Mr. Ajay Tiwari",
  "Pinnacle Faculty",
  "Dr. Vikram Singh",
  "Ms. Anjali Mehta",
];

interface Topic {
  slug: string;
  title: string;
  category: string;
  focusKeyword: string;
  tags: string[];
  author: string;
}

// ── 200 topics across 8 categories ─────────────────────────────────────────
const TOPICS: Topic[] = [
  // ── JEE Main (30) ──────────────────────────────────────────────────────
  { slug: "jee-main-2026-complete-strategy",          title: "JEE Main 2026: Complete 6-Month Preparation Strategy",             category: "JEE Main",            focusKeyword: "JEE Main 2026 preparation strategy",      tags: ["JEE Main","Strategy","2026"],                  author: AUTHORS[0] },
  { slug: "jee-main-physics-chapter-weightage",       title: "JEE Main Physics: Chapter-Wise Weightage and High-Yield Topics",  category: "JEE Main",            focusKeyword: "JEE Main physics chapter weightage",      tags: ["JEE Main","Physics"],                          author: AUTHORS[1] },
  { slug: "jee-main-chemistry-organic-mastery",       title: "JEE Main Chemistry: Mastering Organic Reactions for Top Score",   category: "JEE Main",            focusKeyword: "JEE Main organic chemistry",              tags: ["JEE Main","Chemistry","Organic"],               author: AUTHORS[1] },
  { slug: "jee-main-calculus-preparation-guide",      title: "JEE Main Mathematics: The Ultimate Calculus Preparation Guide",   category: "JEE Main",            focusKeyword: "JEE Main calculus guide",                 tags: ["JEE Main","Mathematics","Calculus"],            author: AUTHORS[3] },
  { slug: "jee-main-january-vs-april-session",        title: "JEE Main January vs April: Which Session Should You Take?",       category: "JEE Main",            focusKeyword: "JEE Main January April session",          tags: ["JEE Main","Strategy"],                         author: AUTHORS[4] },
  { slug: "jee-main-percentile-normalization",        title: "JEE Main Percentile and Normalization Process Explained",         category: "JEE Main",            focusKeyword: "JEE Main percentile normalization",       tags: ["JEE Main","Exam Pattern"],                     author: AUTHORS[0] },
  { slug: "jee-main-mock-test-schedule",              title: "How to Build a Mock Test Schedule for JEE Main",                  category: "JEE Main",            focusKeyword: "JEE Main mock test schedule",             tags: ["JEE Main","Mock Tests","Strategy"],             author: AUTHORS[4] },
  { slug: "jee-main-physics-mechanics-shortcuts",     title: "JEE Main Physics: Mechanics Problem-Solving Shortcuts",           category: "JEE Main",            focusKeyword: "JEE Main mechanics shortcuts",            tags: ["JEE Main","Physics","Mechanics"],               author: AUTHORS[0] },
  { slug: "jee-main-inorganic-chemistry-tips",        title: "JEE Main Inorganic Chemistry: Smart Revision Techniques",         category: "JEE Main",            focusKeyword: "JEE Main inorganic chemistry tips",       tags: ["JEE Main","Chemistry","Inorganic"],             author: AUTHORS[1] },
  { slug: "jee-main-algebra-coordinate-geometry",     title: "JEE Main: Scoring Big in Algebra and Coordinate Geometry",        category: "JEE Main",            focusKeyword: "JEE Main algebra coordinate geometry",    tags: ["JEE Main","Mathematics","Algebra"],             author: AUTHORS[3] },
  { slug: "jee-main-100-day-plan",                    title: "JEE Main 100-Day Countdown Plan: Week by Week Breakdown",         category: "JEE Main",            focusKeyword: "JEE Main 100 day plan",                   tags: ["JEE Main","Strategy","Schedule"],               author: AUTHORS[5] },
  { slug: "jee-main-common-mistakes-to-avoid",        title: "Top 10 Mistakes JEE Main Students Make and How to Avoid Them",    category: "JEE Main",            focusKeyword: "JEE Main common mistakes",                tags: ["JEE Main","Tips","Strategy"],                  author: AUTHORS[4] },
  { slug: "jee-main-time-management-exam-hall",       title: "JEE Main Exam Hall: Time Management Strategies That Work",        category: "JEE Main",            focusKeyword: "JEE Main exam hall time management",      tags: ["JEE Main","Time Management"],                  author: AUTHORS[0] },
  { slug: "jee-main-cbt-tips-first-timers",           title: "JEE Main Computer-Based Test: Tips for First-Time Aspirants",     category: "JEE Main",            focusKeyword: "JEE Main CBT tips",                       tags: ["JEE Main","Exam Pattern","CBT"],                author: AUTHORS[4] },
  { slug: "jee-main-physical-chemistry-formula",      title: "Physical Chemistry for JEE Main: Formulae and Problem Types",     category: "JEE Main",            focusKeyword: "JEE Main physical chemistry formula",     tags: ["JEE Main","Chemistry","Physical Chemistry"],   author: AUTHORS[1] },
  { slug: "jee-main-modern-physics-topics",           title: "JEE Main Modern Physics: Photoelectric Effect to Nuclei",         category: "JEE Main",            focusKeyword: "JEE Main modern physics",                 tags: ["JEE Main","Physics","Modern Physics"],          author: AUTHORS[0] },
  { slug: "jee-main-trigonometry-shortcuts",          title: "JEE Main Trigonometry: Memory Tricks and Shortcut Formulae",      category: "JEE Main",            focusKeyword: "JEE Main trigonometry shortcuts",         tags: ["JEE Main","Mathematics","Trigonometry"],        author: AUTHORS[3] },
  { slug: "jee-main-matrices-determinants-guide",     title: "Matrices and Determinants for JEE Main: Complete Guide",          category: "JEE Main",            focusKeyword: "JEE Main matrices determinants",          tags: ["JEE Main","Mathematics"],                      author: AUTHORS[6] },
  { slug: "jee-main-electrostatics-patterns",         title: "JEE Main Electrostatics: Commonly Tested Question Patterns",      category: "JEE Main",            focusKeyword: "JEE Main electrostatics questions",       tags: ["JEE Main","Physics","Electrostatics"],         author: AUTHORS[0] },
  { slug: "jee-main-last-week-revision-plan",         title: "Last Week Before JEE Main: Day-by-Day Revision Plan",            category: "JEE Main",            focusKeyword: "JEE Main last week revision",             tags: ["JEE Main","Revision","Strategy"],               author: AUTHORS[5] },
  { slug: "jee-main-p-block-elements-mnemonics",      title: "JEE Main p-Block Elements: Mnemonics and Key Properties",         category: "JEE Main",            focusKeyword: "JEE Main p block elements",               tags: ["JEE Main","Chemistry","Inorganic"],             author: AUTHORS[1] },
  { slug: "jee-main-waves-optics-approach",           title: "JEE Main Waves and Optics: Concept-to-Question Approach",         category: "JEE Main",            focusKeyword: "JEE Main waves optics",                   tags: ["JEE Main","Physics","Optics"],                 author: AUTHORS[0] },
  { slug: "jee-main-integration-problem-solving",     title: "JEE Main Integration: Solving Tricky Problems with Confidence",   category: "JEE Main",            focusKeyword: "JEE Main integration problems",           tags: ["JEE Main","Mathematics","Calculus"],            author: AUTHORS[3] },
  { slug: "jee-main-statistics-probability",          title: "Statistics and Probability for JEE Main Explained Simply",        category: "JEE Main",            focusKeyword: "JEE Main statistics probability",         tags: ["JEE Main","Mathematics"],                      author: AUTHORS[3] },
  { slug: "jee-main-dropper-strategy",                title: "JEE Main Dropper Year Strategy: Maximising Your Second Attempt",  category: "JEE Main",            focusKeyword: "JEE Main dropper strategy",               tags: ["JEE Main","Droppers","Strategy"],               author: AUTHORS[5] },
  { slug: "jee-main-class11-vs-class12-weightage",    title: "JEE Main: How Much Weight Does Class 11 vs Class 12 Carry?",      category: "JEE Main",            focusKeyword: "JEE Main class 11 vs class 12 weightage", tags: ["JEE Main","Syllabus"],                         author: AUTHORS[4] },
  { slug: "jee-main-revision-notes-strategy",         title: "How to Create Effective Revision Notes for JEE Main",             category: "JEE Main",            focusKeyword: "JEE Main revision notes",                 tags: ["JEE Main","Revision","Notes"],                 author: AUTHORS[6] },
  { slug: "jee-main-chemical-equilibrium-guide",      title: "Chemical Equilibrium for JEE Main: Solving Le Chatelier Problems", category: "JEE Main",           focusKeyword: "JEE Main chemical equilibrium",           tags: ["JEE Main","Chemistry"],                        author: AUTHORS[1] },
  { slug: "jee-main-best-study-resources-2026",       title: "Best Study Resources and Books for JEE Main 2026",                category: "JEE Main",            focusKeyword: "JEE Main best books 2026",                tags: ["JEE Main","Books","Resources"],                 author: AUTHORS[4] },
  { slug: "jee-main-mental-health-tips",              title: "JEE Main Preparation: Protecting Your Mental Health Under Pressure", category: "JEE Main",          focusKeyword: "JEE Main mental health",                  tags: ["JEE Main","Mental Health","Wellbeing"],         author: AUTHORS[6] },

  // ── JEE Advanced (25) ──────────────────────────────────────────────────
  { slug: "jee-advanced-2026-blueprint",              title: "JEE Advanced 2026: The Complete Preparation Blueprint",            category: "JEE Advanced",        focusKeyword: "JEE Advanced 2026 preparation",           tags: ["JEE Advanced","Strategy"],                     author: AUTHORS[0] },
  { slug: "jee-advanced-physics-experimental-skills", title: "JEE Advanced Physics: Mastering Experimental Skill Questions",    category: "JEE Advanced",        focusKeyword: "JEE Advanced experimental skills",        tags: ["JEE Advanced","Physics"],                      author: AUTHORS[0] },
  { slug: "jee-advanced-organic-synthesis",           title: "JEE Advanced Organic Synthesis: Multi-Step Reactions Decoded",    category: "JEE Advanced",        focusKeyword: "JEE Advanced organic synthesis",          tags: ["JEE Advanced","Chemistry","Organic"],           author: AUTHORS[1] },
  { slug: "jee-advanced-integral-calculus-deep",      title: "JEE Advanced Integral Calculus: Problems That Stump Students",    category: "JEE Advanced",        focusKeyword: "JEE Advanced integral calculus",          tags: ["JEE Advanced","Mathematics","Calculus"],        author: AUTHORS[3] },
  { slug: "jee-advanced-paper-pattern-analysis",      title: "JEE Advanced Paper Pattern Analysis: What IITs Test and Why",     category: "JEE Advanced",        focusKeyword: "JEE Advanced paper pattern",              tags: ["JEE Advanced","Exam Pattern"],                 author: AUTHORS[5] },
  { slug: "jee-advanced-complex-numbers-handbook",    title: "Complex Numbers for JEE Advanced: The Complete Handbook",         category: "JEE Advanced",        focusKeyword: "JEE Advanced complex numbers",            tags: ["JEE Advanced","Mathematics"],                  author: AUTHORS[3] },
  { slug: "jee-advanced-thermodynamics-guide",        title: "JEE Advanced Thermodynamics: From Zeroth to Third Law Problems",  category: "JEE Advanced",        focusKeyword: "JEE Advanced thermodynamics",             tags: ["JEE Advanced","Physics","Thermodynamics"],     author: AUTHORS[0] },
  { slug: "jee-advanced-coordination-chemistry",      title: "Coordination Chemistry for JEE Advanced: Naming and Isomerism",   category: "JEE Advanced",        focusKeyword: "JEE Advanced coordination chemistry",     tags: ["JEE Advanced","Chemistry"],                    author: AUTHORS[1] },
  { slug: "jee-advanced-vectors-3d-geometry",         title: "Vectors and 3D Geometry for JEE Advanced: Fully Explained",       category: "JEE Advanced",        focusKeyword: "JEE Advanced vectors 3d geometry",        tags: ["JEE Advanced","Mathematics","3D Geometry"],    author: AUTHORS[3] },
  { slug: "jee-advanced-electromagnetism-guide",      title: "JEE Advanced Electromagnetism: Faraday, Induction and AC Circuits", category: "JEE Advanced",       focusKeyword: "JEE Advanced electromagnetism",           tags: ["JEE Advanced","Physics","Electromagnetism"],   author: AUTHORS[0] },
  { slug: "jee-advanced-paragraph-question-strategy", title: "JEE Advanced: How to Handle Paragraph-Based Questions",           category: "JEE Advanced",        focusKeyword: "JEE Advanced paragraph questions",        tags: ["JEE Advanced","Strategy"],                     author: AUTHORS[5] },
  { slug: "jee-advanced-differential-equations",      title: "Differential Equations for JEE Advanced: Non-Standard Types",     category: "JEE Advanced",        focusKeyword: "JEE Advanced differential equations",     tags: ["JEE Advanced","Mathematics","Calculus"],        author: AUTHORS[3] },
  { slug: "jee-advanced-surface-chemistry",           title: "Biomolecules and Surface Chemistry for JEE Advanced",             category: "JEE Advanced",        focusKeyword: "JEE Advanced surface chemistry",          tags: ["JEE Advanced","Chemistry"],                    author: AUTHORS[1] },
  { slug: "jee-advanced-optics-interference",         title: "JEE Advanced Optics: Interference, Diffraction and Polarization", category: "JEE Advanced",        focusKeyword: "JEE Advanced optics interference",        tags: ["JEE Advanced","Physics","Optics"],             author: AUTHORS[0] },
  { slug: "jee-advanced-rank-cutoff-analysis",        title: "How JEE Advanced Ranks Are Decided: Marks, Cutoffs and Predictions", category: "JEE Advanced",     focusKeyword: "JEE Advanced rank cutoff",                tags: ["JEE Advanced","Rank","Cutoff"],                author: AUTHORS[5] },
  { slug: "jee-advanced-d-block-chemistry-deep",      title: "JEE Advanced: Deep Dive into p-Block and d-Block Chemistry",      category: "JEE Advanced",        focusKeyword: "JEE Advanced d block chemistry",          tags: ["JEE Advanced","Chemistry","Inorganic"],        author: AUTHORS[1] },
  { slug: "jee-advanced-reasoning-logic-problems",    title: "JEE Advanced Mathematical Reasoning and Logic Problems",          category: "JEE Advanced",        focusKeyword: "JEE Advanced mathematical reasoning",     tags: ["JEE Advanced","Mathematics"],                  author: AUTHORS[6] },
  { slug: "jee-advanced-kinematics-dynamics",         title: "JEE Advanced Kinematics and Dynamics: Solving Complex Problems",   category: "JEE Advanced",        focusKeyword: "JEE Advanced kinematics dynamics",        tags: ["JEE Advanced","Physics","Mechanics"],          author: AUTHORS[0] },
  { slug: "jee-advanced-electrochemistry-cells",      title: "Electrochemistry for JEE Advanced: Cells, EMF and Calculations",  category: "JEE Advanced",        focusKeyword: "JEE Advanced electrochemistry",           tags: ["JEE Advanced","Chemistry"],                    author: AUTHORS[1] },
  { slug: "jee-advanced-permutations-combinations",   title: "Permutations and Combinations for JEE Advanced: Full Coverage",   category: "JEE Advanced",        focusKeyword: "JEE Advanced permutations combinations",  tags: ["JEE Advanced","Mathematics"],                  author: AUTHORS[3] },
  { slug: "jee-advanced-iit-branch-selection",        title: "IIT Branch and College Selection After JEE Advanced Rank",        category: "JEE Advanced",        focusKeyword: "JEE Advanced IIT branch selection",       tags: ["JEE Advanced","Career","IIT"],                 author: AUTHORS[5] },
  { slug: "jee-advanced-coaching-vs-self-study",      title: "JEE Advanced: Self-Study vs Coaching — Making the Right Choice",  category: "JEE Advanced",        focusKeyword: "JEE Advanced self study vs coaching",     tags: ["JEE Advanced","Strategy"],                     author: AUTHORS[4] },
  { slug: "jee-advanced-matrix-match-questions",      title: "JEE Advanced Matrix-Match and Multiple Correct Question Strategy", category: "JEE Advanced",       focusKeyword: "JEE Advanced matrix match questions",     tags: ["JEE Advanced","Strategy","Exam Pattern"],      author: AUTHORS[5] },
  { slug: "jee-advanced-probability-advanced",        title: "Probability and Statistics in JEE Advanced: Advanced Problems",   category: "JEE Advanced",        focusKeyword: "JEE Advanced probability statistics",     tags: ["JEE Advanced","Mathematics","Probability"],    author: AUTHORS[3] },
  { slug: "jee-advanced-final-week-strategy",         title: "JEE Advanced: What to Do in the Final Week for Maximum Score",    category: "JEE Advanced",        focusKeyword: "JEE Advanced final week strategy",        tags: ["JEE Advanced","Strategy","Revision"],          author: AUTHORS[5] },

  // ── NEET UG (30) ───────────────────────────────────────────────────────
  { slug: "neet-ug-2026-preparation-strategy",        title: "NEET UG 2026: Preparation Strategy from Zero to 700+",           category: "NEET UG",             focusKeyword: "NEET UG 2026 preparation strategy",       tags: ["NEET","Strategy","2026"],                      author: AUTHORS[2] },
  { slug: "neet-biology-beyond-ncert",                title: "NEET Biology: Going Beyond NCERT for a Perfect 360 Score",       category: "NEET UG",             focusKeyword: "NEET biology beyond NCERT",               tags: ["NEET","Biology","NCERT"],                      author: AUTHORS[2] },
  { slug: "neet-physics-high-weightage-chapters",     title: "NEET Physics: High-Weightage Chapters You Cannot Ignore",        category: "NEET UG",             focusKeyword: "NEET physics important chapters",         tags: ["NEET","Physics"],                              author: AUTHORS[0] },
  { slug: "neet-organic-chemistry-what-is-tested",    title: "Organic Chemistry for NEET: What Is Tested and What Is Not",     category: "NEET UG",             focusKeyword: "NEET organic chemistry topics",           tags: ["NEET","Chemistry","Organic"],                  author: AUTHORS[1] },
  { slug: "neet-botany-systematic-revision",          title: "NEET Botany: Systematic Revision Strategy for Full Marks",       category: "NEET UG",             focusKeyword: "NEET botany revision strategy",           tags: ["NEET","Biology","Botany"],                     author: AUTHORS[2] },
  { slug: "neet-zoology-high-yield-topics",           title: "NEET Zoology: High-Yield Topics and Memory Techniques",          category: "NEET UG",             focusKeyword: "NEET zoology high yield topics",          tags: ["NEET","Biology","Zoology"],                    author: AUTHORS[2] },
  { slug: "neet-class11-vs-class12-biology",          title: "NEET: Is Class 11 or Class 12 Biology More Important?",          category: "NEET UG",             focusKeyword: "NEET class 11 vs class 12 biology",       tags: ["NEET","Biology","Syllabus"],                   author: AUTHORS[4] },
  { slug: "neet-mock-test-analysis-guide",            title: "NEET Mock Tests: How to Analyse Results and Fill Your Gaps",     category: "NEET UG",             focusKeyword: "NEET mock test analysis",                 tags: ["NEET","Mock Tests","Strategy"],                author: AUTHORS[2] },
  { slug: "neet-2026-cutoff-analysis",                title: "NEET 2026 Cutoff Analysis: Category-Wise Marks and Colleges",    category: "NEET UG",             focusKeyword: "NEET 2026 cutoff marks",                  tags: ["NEET","Cutoff","Colleges"],                    author: AUTHORS[5] },
  { slug: "neet-physics-mechanics-formula-sheet",     title: "NEET Physics Mechanics: Quick Revision and Formula Sheet",       category: "NEET UG",             focusKeyword: "NEET physics mechanics formula",          tags: ["NEET","Physics","Mechanics"],                  author: AUTHORS[0] },
  { slug: "neet-inorganic-d-block-guide",             title: "NEET Inorganic Chemistry: d-Block and f-Block Elements Guide",   category: "NEET UG",             focusKeyword: "NEET inorganic chemistry d block",        tags: ["NEET","Chemistry","Inorganic"],                author: AUTHORS[1] },
  { slug: "neet-human-physiology-7day-revision",      title: "NEET Human Physiology: Organ Systems Revision in 7 Days",        category: "NEET UG",             focusKeyword: "NEET human physiology revision",          tags: ["NEET","Biology","Physiology"],                 author: AUTHORS[2] },
  { slug: "neet-plant-physiology-mnemonics",          title: "NEET Plant Physiology: Best Mnemonics for Long-Term Retention",  category: "NEET UG",             focusKeyword: "NEET plant physiology mnemonics",         tags: ["NEET","Biology","Botany"],                     author: AUTHORS[2] },
  { slug: "neet-exam-hall-section-strategy",          title: "NEET 2026 Exam Hall: Section Order and Time Management Tips",    category: "NEET UG",             focusKeyword: "NEET exam hall strategy",                 tags: ["NEET","Strategy","Time Management"],           author: AUTHORS[4] },
  { slug: "neet-ecology-evolution-concepts",          title: "NEET Ecology and Evolution: Frequently Tested Concepts",         category: "NEET UG",             focusKeyword: "NEET ecology evolution",                  tags: ["NEET","Biology","Ecology"],                    author: AUTHORS[2] },
  { slug: "neet-2026-pattern-changes",                title: "NEET Pattern 2026: New NTA Changes and How to Adapt Your Prep",  category: "NEET UG",             focusKeyword: "NEET 2026 exam pattern NTA",              tags: ["NEET","Exam Pattern","NTA"],                   author: AUTHORS[5] },
  { slug: "neet-ncert-highlight-technique",           title: "The NCERT Highlighting Technique NEET Toppers Swear By",         category: "NEET UG",             focusKeyword: "NEET NCERT highlighting technique",       tags: ["NEET","NCERT","Study Tips"],                   author: AUTHORS[6] },
  { slug: "neet-dropper-2026-daily-plan",             title: "NEET Dropper 2026: A Realistic Day-by-Day Preparation Plan",    category: "NEET UG",             focusKeyword: "NEET dropper plan 2026",                  tags: ["NEET","Droppers","Strategy"],                  author: AUTHORS[5] },
  { slug: "neet-biology-common-mistakes",             title: "10 Biology Mistakes That Cost NEET Aspirants 50+ Marks",         category: "NEET UG",             focusKeyword: "NEET biology common mistakes",            tags: ["NEET","Biology","Mistakes"],                   author: AUTHORS[4] },
  { slug: "neet-genetics-molecular-biology",          title: "NEET Genetics and Molecular Biology: Basics to Application",     category: "NEET UG",             focusKeyword: "NEET genetics molecular biology",         tags: ["NEET","Biology","Genetics"],                   author: AUTHORS[2] },
  { slug: "neet-rank-predictor-2026",                 title: "NEET Rank Predictor 2026: Score to College Estimation Guide",    category: "NEET UG",             focusKeyword: "NEET rank predictor 2026",                tags: ["NEET","Rank","Colleges"],                      author: AUTHORS[5] },
  { slug: "neet-physical-chemistry-numericals",       title: "NEET Physical Chemistry: Solving Numericals Under Exam Pressure", category: "NEET UG",            focusKeyword: "NEET physical chemistry numericals",      tags: ["NEET","Chemistry","Physical Chemistry"],       author: AUTHORS[1] },
  { slug: "neet-government-college-cutoffs",          title: "NEET Government Medical College Cutoffs: State vs All India Quota", category: "NEET UG",          focusKeyword: "NEET government college cutoffs",         tags: ["NEET","Colleges","Cutoff"],                    author: AUTHORS[5] },
  { slug: "neet-body-fluids-circulation-notes",       title: "NEET Body Fluids and Circulation: Complete Notes and Questions",  category: "NEET UG",            focusKeyword: "NEET body fluids circulation",            tags: ["NEET","Biology","Physiology"],                 author: AUTHORS[2] },
  { slug: "neet-reproductive-health-revision",        title: "NEET Reproductive Health and STDs: Exam-Focused Revision Notes", category: "NEET UG",            focusKeyword: "NEET reproductive health",                tags: ["NEET","Biology"],                              author: AUTHORS[2] },
  { slug: "neet-chemical-coordination-hormones",      title: "NEET Chemical Coordination: Hormones and Endocrine System Guide", category: "NEET UG",           focusKeyword: "NEET chemical coordination hormones",     tags: ["NEET","Biology","Physiology"],                 author: AUTHORS[2] },
  { slug: "neet-photosynthesis-respiration-guide",    title: "Photosynthesis and Respiration for NEET: Full Coverage Guide",   category: "NEET UG",             focusKeyword: "NEET photosynthesis respiration",         tags: ["NEET","Biology","Botany"],                     author: AUTHORS[2] },
  { slug: "neet-last-month-study-plan",               title: "NEET Last Month: What to Study and What to Drop Strategically",  category: "NEET UG",             focusKeyword: "NEET last month study plan",              tags: ["NEET","Strategy","Revision"],                  author: AUTHORS[4] },
  { slug: "neet-notes-making-strategy",               title: "How to Make NEET Notes That Actually Help You Score High",        category: "NEET UG",             focusKeyword: "NEET notes making strategy",              tags: ["NEET","Study Tips","Notes"],                   author: AUTHORS[6] },
  { slug: "neet-aiims-counselling-guide",             title: "AIIMS and JIPMER After NEET: Eligibility, Counselling and Tips", category: "NEET UG",             focusKeyword: "AIIMS admission after NEET",              tags: ["NEET","AIIMS","Counselling"],                  author: AUTHORS[5] },

  // ── Class 11–12 Boards (30) ────────────────────────────────────────────
  { slug: "cbse-class-12-physics-board-strategy",     title: "CBSE Class 12 Physics: Board Exam Scoring Strategy for 95+",     category: "Class 11-12 Boards",  focusKeyword: "CBSE class 12 physics board exam",        tags: ["CBSE","Physics","Class 12"],                   author: AUTHORS[0] },
  { slug: "cbse-class-12-chemistry-lab-experiments",  title: "CBSE Class 12 Chemistry: Important Lab Experiments for Boards",  category: "Class 11-12 Boards",  focusKeyword: "CBSE class 12 chemistry lab experiments", tags: ["CBSE","Chemistry","Class 12","Labs"],           author: AUTHORS[1] },
  { slug: "cbse-class-12-maths-board-pattern",        title: "CBSE Class 12 Mathematics: Scoring Pattern and Question Types",  category: "Class 11-12 Boards",  focusKeyword: "CBSE class 12 maths board exam",          tags: ["CBSE","Mathematics","Class 12"],                author: AUTHORS[3] },
  { slug: "cbse-class-12-biology-30-day-revision",    title: "CBSE Class 12 Biology: Full Syllabus Revision in 30 Days",       category: "Class 11-12 Boards",  focusKeyword: "CBSE class 12 biology revision",          tags: ["CBSE","Biology","Class 12","Revision"],         author: AUTHORS[2] },
  { slug: "cbse-class-12-english-full-marks",         title: "CBSE Class 12 English: Writing Skills That Guarantee Full Marks", category: "Class 11-12 Boards", focusKeyword: "CBSE class 12 English writing skills",    tags: ["CBSE","English","Class 12"],                   author: AUTHORS[6] },
  { slug: "class-11-physics-foundation-for-jee",      title: "Class 11 Physics: Build the Foundation That Carries Through JEE", category: "Class 11-12 Boards", focusKeyword: "class 11 physics foundation JEE",         tags: ["Class 11","Physics","JEE Main"],               author: AUTHORS[0] },
  { slug: "class-11-chemistry-bonding-made-simple",   title: "Class 11 Chemistry: Chemical Bonding and Structure Made Simple",  category: "Class 11-12 Boards", focusKeyword: "class 11 chemistry chemical bonding",     tags: ["Class 11","Chemistry","Bonding"],               author: AUTHORS[1] },
  { slug: "class-11-maths-sets-relations-functions",  title: "Class 11 Mathematics: Sets, Relations and Functions Complete Guide", category: "Class 11-12 Boards", focusKeyword: "class 11 maths sets relations functions", tags: ["Class 11","Mathematics"],                      author: AUTHORS[3] },
  { slug: "class-11-biology-cell-biomolecules",       title: "Class 11 Biology: Cell Biology and Biomolecules for NEET Prep",   category: "Class 11-12 Boards", focusKeyword: "class 11 biology cell biomolecules NEET", tags: ["Class 11","Biology","NEET"],                   author: AUTHORS[2] },
  { slug: "cbse-marking-scheme-step-marks",           title: "CBSE Marking Scheme Secrets: How Step Marks Are Awarded",         category: "Class 11-12 Boards", focusKeyword: "CBSE marking scheme step marks",          tags: ["CBSE","Exam Tips","Boards"],                   author: AUTHORS[4] },
  { slug: "class-12-physics-numericals-method",       title: "Class 12 Physics Numericals: Full-Mark Solving Methods for Boards", category: "Class 11-12 Boards", focusKeyword: "class 12 physics numericals boards",    tags: ["Class 12","Physics","Boards"],                 author: AUTHORS[0] },
  { slug: "class-12-chemistry-s-block-overlap",       title: "Class 12 Chemistry s-Block Elements: Boards and JEE Overlap",     category: "Class 11-12 Boards", focusKeyword: "class 12 chemistry s block elements",     tags: ["Class 12","Chemistry","Inorganic"],             author: AUTHORS[1] },
  { slug: "cbse-class-12-biology-genetics-exam",      title: "Class 12 Genetics: Exam-Focused Notes and Question Patterns",     category: "Class 11-12 Boards", focusKeyword: "CBSE class 12 genetics exam",             tags: ["Class 12","Biology","Genetics"],               author: AUTHORS[2] },
  { slug: "cbse-internal-assessment-maximise",        title: "CBSE Internal Assessment: How to Maximise Your Practical Marks",  category: "Class 11-12 Boards", focusKeyword: "CBSE internal assessment practical marks", tags: ["CBSE","Boards","Practical"],                   author: AUTHORS[6] },
  { slug: "class-12-integration-boards-fullmarks",    title: "Class 12 Integration: Scoring Full Marks in CBSE Board Exams",    category: "Class 11-12 Boards", focusKeyword: "class 12 integration board exam",         tags: ["Class 12","Mathematics","Calculus","CBSE"],    author: AUTHORS[3] },
  { slug: "class-12-physics-wave-optics-boards",      title: "Wave Optics for Class 12 Boards: Interference and Diffraction",   category: "Class 11-12 Boards", focusKeyword: "class 12 wave optics boards",             tags: ["Class 12","Physics","Optics","CBSE"],          author: AUTHORS[0] },
  { slug: "class-11-organic-chemistry-foundation",    title: "Class 11 Organic Chemistry Introduction: Getting the Foundation Right", category: "Class 11-12 Boards", focusKeyword: "class 11 organic chemistry introduction", tags: ["Class 11","Chemistry","Organic"],            author: AUTHORS[1] },
  { slug: "cbse-compartment-exam-strategy",           title: "CBSE Compartment Exam: What to Focus On and How to Prepare",      category: "Class 11-12 Boards", focusKeyword: "CBSE compartment exam preparation",       tags: ["CBSE","Boards","Compartment"],                 author: AUTHORS[4] },
  { slug: "class-12-electrochemistry-boards-jee",     title: "Class 12 Electrochemistry: Common Board and JEE Exam Questions",  category: "Class 11-12 Boards", focusKeyword: "class 12 electrochemistry boards",        tags: ["Class 12","Chemistry","Electrochemistry"],     author: AUTHORS[1] },
  { slug: "cbse-sample-papers-effective-use",         title: "How to Use CBSE Sample Papers Effectively for Board Prep",        category: "Class 11-12 Boards", focusKeyword: "CBSE sample papers strategy",             tags: ["CBSE","Sample Papers","Strategy"],             author: AUTHORS[6] },
  { slug: "class-12-biology-ecology-boards-neet",     title: "Class 12 Ecology and Ecosystem: Full Notes for Boards and NEET",  category: "Class 11-12 Boards", focusKeyword: "class 12 ecology ecosystem notes",        tags: ["Class 12","Biology","Ecology"],                author: AUTHORS[2] },
  { slug: "cbse-class-12-semiconductor-guide",        title: "Class 12 Semiconductors: Diodes, Transistors and Logic Gates",    category: "Class 11-12 Boards", focusKeyword: "class 12 semiconductors board exam",      tags: ["Class 12","Physics","Semiconductors"],         author: AUTHORS[0] },
  { slug: "class-11-trigonometry-jee-foundation",     title: "Class 11 Trigonometry: Building the Foundation for JEE",          category: "Class 11-12 Boards", focusKeyword: "class 11 trigonometry JEE foundation",    tags: ["Class 11","Mathematics","Trigonometry"],        author: AUTHORS[3] },
  { slug: "cbse-exam-day-morning-strategy",           title: "CBSE Board Exam Day: What to Do from Morning to Paper Submission", category: "Class 11-12 Boards", focusKeyword: "CBSE board exam day strategy",            tags: ["CBSE","Boards","Exam Day"],                    author: AUTHORS[4] },
  { slug: "class-12-polymers-biomolecules-revision",  title: "Class 12 Polymers and Biomolecules: Quick Revision Guide",         category: "Class 11-12 Boards", focusKeyword: "class 12 polymers biomolecules",          tags: ["Class 12","Chemistry"],                        author: AUTHORS[1] },
  { slug: "class-11-rotational-motion-concepts",      title: "Class 11 Rotational Motion: Concepts and Application Problems",   category: "Class 11-12 Boards", focusKeyword: "class 11 rotational motion concepts",     tags: ["Class 11","Physics","Rotational Motion"],      author: AUTHORS[0] },
  { slug: "cbse-topper-study-schedule",               title: "CBSE Topper Study Schedule: How 95%+ Students Spend Their Day",   category: "Class 11-12 Boards", focusKeyword: "CBSE topper study schedule",              tags: ["CBSE","Study Schedule","Toppers"],             author: AUTHORS[5] },
  { slug: "class-12-3d-geometry-boards",              title: "3D Geometry for Class 12 Boards: Everything You Need to Know",     category: "Class 11-12 Boards", focusKeyword: "class 12 3d geometry board exam",         tags: ["Class 12","Mathematics","3D Geometry"],        author: AUTHORS[3] },
  { slug: "cbse-pre-board-strategy",                  title: "CBSE Pre-Board Exams: Using Results to Improve Before Main Boards", category: "Class 11-12 Boards", focusKeyword: "CBSE pre board exam strategy",           tags: ["CBSE","Pre Boards","Strategy"],                author: AUTHORS[4] },
  { slug: "class-12-atoms-nuclei-boards",             title: "Class 12 Atoms and Nuclei: Concepts and Board Questions Solved",   category: "Class 11-12 Boards", focusKeyword: "class 12 atoms nuclei board exam",        tags: ["Class 12","Physics","Modern Physics"],         author: AUTHORS[0] },

  // ── Class 9–10 Foundation (20) ─────────────────────────────────────────
  { slug: "class-10-science-board-2026-prep",         title: "Class 10 Science: Smart Preparation for Board Exams 2026",        category: "Class 9-10 Foundation", focusKeyword: "class 10 science board exam 2026",      tags: ["Class 10","Science","CBSE"],                   author: AUTHORS[0] },
  { slug: "class-10-maths-algebra-guide",             title: "Class 10 Algebra: Polynomials, Quadratics and AP Complete Guide",  category: "Class 9-10 Foundation", focusKeyword: "class 10 maths algebra polynomials",    tags: ["Class 10","Mathematics","Algebra"],            author: AUTHORS[3] },
  { slug: "class-9-science-jee-neet-foundation",      title: "Class 9 Science: Laying the Foundation for JEE and NEET Success", category: "Class 9-10 Foundation", focusKeyword: "class 9 science JEE NEET foundation",   tags: ["Class 9","Science","Foundation"],              author: AUTHORS[0] },
  { slug: "class-10-social-science-scoring-tips",     title: "Class 10 Social Science: How to Score 90+ with Smart Revision",   category: "Class 9-10 Foundation", focusKeyword: "class 10 social science scoring tips",  tags: ["Class 10","Social Science","CBSE"],            author: AUTHORS[6] },
  { slug: "class-9-10-study-habits-for-class-12",     title: "Study Habits to Build in Class 9-10 That Pay Off in Class 12",   category: "Class 9-10 Foundation", focusKeyword: "study habits class 9 10",              tags: ["Class 9","Class 10","Study Habits"],           author: AUTHORS[5] },
  { slug: "class-10-trigonometry-applications",       title: "Class 10 Trigonometry: Real-World Applications and Exam Techniques", category: "Class 9-10 Foundation", focusKeyword: "class 10 trigonometry applications", tags: ["Class 10","Mathematics","Trigonometry"],        author: AUTHORS[3] },
  { slug: "class-10-heredity-evolution-guide",        title: "Class 10 Heredity and Evolution: Key Concepts for Board Exams",   category: "Class 9-10 Foundation", focusKeyword: "class 10 heredity evolution",          tags: ["Class 10","Science","Biology"],                author: AUTHORS[2] },
  { slug: "foundation-course-jee-neet-benefits",      title: "Why a Foundation Course in Class 9-10 Transforms JEE/NEET Results", category: "Class 9-10 Foundation", focusKeyword: "foundation course class 9 10 JEE NEET", tags: ["Foundation","JEE Main","NEET"],              author: AUTHORS[4] },
  { slug: "class-9-10-maths-olympiad-prep",           title: "Class 9-10 Maths Olympiad: Start Competitive Preparation Early",  category: "Class 9-10 Foundation", focusKeyword: "class 9 10 maths olympiad preparation", tags: ["Olympiad","Mathematics","Class 9","Class 10"], author: AUTHORS[3] },
  { slug: "class-10-carbon-compounds-guide",          title: "Class 10 Carbon and Its Compounds: Complete Exam Guide",          category: "Class 9-10 Foundation", focusKeyword: "class 10 carbon compounds",            tags: ["Class 10","Science","Chemistry"],              author: AUTHORS[1] },
  { slug: "class-10-electricity-magnetism-guide",     title: "Class 10 Electricity and Magnetic Effects: Problem-Solving Guide", category: "Class 9-10 Foundation", focusKeyword: "class 10 electricity magnetism",       tags: ["Class 10","Science","Physics"],                author: AUTHORS[0] },
  { slug: "class-9-10-scientific-reading-habits",     title: "Building Scientific Reading Habits in Class 9 and 10",            category: "Class 9-10 Foundation", focusKeyword: "scientific reading habits class 9 10",  tags: ["Class 9","Class 10","Study Skills"],           author: AUTHORS[6] },
  { slug: "class-10-light-reflection-refraction",     title: "Class 10 Light: Reflection, Refraction and Lens Equations",       category: "Class 9-10 Foundation", focusKeyword: "class 10 light reflection refraction",  tags: ["Class 10","Science","Physics","Optics"],       author: AUTHORS[0] },
  { slug: "class-10-human-eye-colorful-world",        title: "Human Eye and the Colourful World: Class 10 Exam Focus",          category: "Class 9-10 Foundation", focusKeyword: "class 10 human eye colorful world",    tags: ["Class 10","Science","Optics"],                 author: AUTHORS[2] },
  { slug: "class-9-force-newton-laws-intuitive",      title: "Class 9 Force and Laws of Motion: Intuitive Understanding",       category: "Class 9-10 Foundation", focusKeyword: "class 9 force laws of motion Newton",  tags: ["Class 9","Science","Physics"],                 author: AUTHORS[0] },
  { slug: "class-10-coordinate-geometry-foundation",  title: "Class 10 Coordinate Geometry: Distance, Area and Section Formula", category: "Class 9-10 Foundation", focusKeyword: "class 10 coordinate geometry formulas", tags: ["Class 10","Mathematics","Coordinate Geometry"], author: AUTHORS[3] },
  { slug: "class-9-10-time-management-students",      title: "Time Management for Class 9-10 Students Heading to Competitive Exams", category: "Class 9-10 Foundation", focusKeyword: "time management class 9 10 students", tags: ["Class 9","Class 10","Time Management"],       author: AUTHORS[5] },
  { slug: "class-10-economics-development-gdp",       title: "Class 10 Economics: Development and GDP Concepts Explained",      category: "Class 9-10 Foundation", focusKeyword: "class 10 economics development GDP",    tags: ["Class 10","Social Science","Economics"],       author: AUTHORS[6] },
  { slug: "class-9-atoms-molecules-periodic-table",   title: "Class 9 Atoms, Molecules and the Periodic Table: Beginner Guide", category: "Class 9-10 Foundation", focusKeyword: "class 9 atoms molecules periodic table", tags: ["Class 9","Science","Chemistry"],               author: AUTHORS[1] },
  { slug: "class-10-board-last-month-strategy",       title: "Class 10 Board Exams: Last-Month Preparation Strategy That Works", category: "Class 9-10 Foundation", focusKeyword: "class 10 board exam last month strategy", tags: ["Class 10","CBSE","Strategy","Revision"],     author: AUTHORS[4] },

  // ── Study Skills & Strategy (25) ───────────────────────────────────────
  { slug: "spaced-repetition-jee-neet",               title: "Spaced Repetition: The Science-Backed Study Technique for JEE/NEET", category: "Study Skills",      focusKeyword: "spaced repetition JEE NEET study technique", tags: ["Study Skills","Memory","Technique"],          author: AUTHORS[6] },
  { slug: "active-recall-competitive-exams",          title: "Active Recall: How to Study Smarter for Competitive Exams",        category: "Study Skills",        focusKeyword: "active recall study technique competitive exams", tags: ["Study Skills","Active Recall","Memory"],    author: AUTHORS[6] },
  { slug: "pomodoro-technique-jee-neet-students",     title: "The Pomodoro Technique for JEE/NEET Students: Does It Work?",     category: "Study Skills",        focusKeyword: "pomodoro technique JEE NEET students",    tags: ["Study Skills","Pomodoro","Productivity"],      author: AUTHORS[4] },
  { slug: "how-to-make-effective-study-notes",        title: "How to Make Study Notes That Actually Help You Score Higher",       category: "Study Skills",        focusKeyword: "how to make study notes for JEE NEET",    tags: ["Study Skills","Notes","Strategy"],             author: AUTHORS[6] },
  { slug: "feynman-technique-for-exams",              title: "The Feynman Technique: Understand Any Topic Deeply for Exams",     category: "Study Skills",        focusKeyword: "Feynman technique learning for exams",    tags: ["Study Skills","Feynman","Learning"],           author: AUTHORS[5] },
  { slug: "sleep-importance-jee-neet-aspirants",      title: "Why 8 Hours of Sleep Is Non-Negotiable for JEE/NEET Aspirants",   category: "Study Skills",        focusKeyword: "sleep importance JEE NEET aspirants",     tags: ["Study Skills","Sleep","Health"],               author: AUTHORS[6] },
  { slug: "healthy-diet-for-exam-students",           title: "What to Eat During JEE/NEET Preparation: Nutrition for Your Brain", category: "Study Skills",       focusKeyword: "healthy diet for JEE NEET students",      tags: ["Study Skills","Nutrition","Health"],           author: AUTHORS[6] },
  { slug: "overcoming-exam-anxiety-jee-neet",         title: "How to Overcome Exam Anxiety Before JEE/NEET Effectively",        category: "Study Skills",        focusKeyword: "exam anxiety JEE NEET overcome",          tags: ["Study Skills","Anxiety","Mental Health"],      author: AUTHORS[6] },
  { slug: "daily-routine-jee-topper",                 title: "A Day in the Life of a JEE Topper: Balancing Study and Rest",      category: "Study Skills",        focusKeyword: "daily routine JEE topper",                tags: ["Study Skills","Daily Routine","JEE Main"],     author: AUTHORS[5] },
  { slug: "group-study-vs-self-study-jee-neet",       title: "Group Study vs Self-Study: What Works Best for JEE/NEET?",        category: "Study Skills",        focusKeyword: "group study vs self study JEE NEET",      tags: ["Study Skills","Group Study","Self Study"],     author: AUTHORS[4] },
  { slug: "managing-social-media-distractions",       title: "How to Beat Social Media Distractions During Exam Preparation",    category: "Study Skills",        focusKeyword: "social media distractions exam preparation", tags: ["Study Skills","Distractions","Productivity"], author: AUTHORS[6] },
  { slug: "mind-maps-biology-chemistry-revision",     title: "Using Mind Maps to Revise Biology and Chemistry Topics",           category: "Study Skills",        focusKeyword: "mind maps biology chemistry revision",    tags: ["Study Skills","Mind Maps","Revision"],         author: AUTHORS[6] },
  { slug: "question-bank-practice-benefits",          title: "Why Practicing from a Question Bank Beats Re-Reading Notes",       category: "Study Skills",        focusKeyword: "question bank practice benefits",         tags: ["Study Skills","Practice","Question Bank"],     author: AUTHORS[4] },
  { slug: "negative-marking-strategy-jee-neet",       title: "Negative Marking Strategy: When to Attempt and When to Skip",     category: "Study Skills",        focusKeyword: "negative marking strategy JEE NEET",      tags: ["Study Skills","Strategy","Exam Tips"],         author: AUTHORS[5] },
  { slug: "productive-study-breaks",                  title: "How to Take Study Breaks That Actually Recharge Your Brain",       category: "Study Skills",        focusKeyword: "productive study breaks for students",    tags: ["Study Skills","Breaks","Productivity"],        author: AUTHORS[6] },
  { slug: "concept-mapping-neet-biology",             title: "Concept Mapping for NEET Biology: Connecting Ideas Visually",      category: "Study Skills",        focusKeyword: "concept mapping NEET biology",            tags: ["Study Skills","NEET","Biology","Concept Maps"], author: AUTHORS[2] },
  { slug: "morning-study-vs-night-study",             title: "Morning Study vs Late-Night Study: Which Is Better for Retention?", category: "Study Skills",       focusKeyword: "morning study vs night study retention",  tags: ["Study Skills","Study Schedule"],               author: AUTHORS[5] },
  { slug: "tackling-difficult-topics-guide",          title: "How to Tackle a Topic You Just Cannot Understand",                 category: "Study Skills",        focusKeyword: "how to tackle difficult topics exams",    tags: ["Study Skills","Difficult Topics","Strategy"],  author: AUTHORS[4] },
  { slug: "previous-year-papers-jee-neet",            title: "How Previous Year Papers Can Double Your JEE/NEET Score",         category: "Study Skills",        focusKeyword: "previous year papers JEE NEET score",     tags: ["Study Skills","Previous Papers","Strategy"],   author: AUTHORS[5] },
  { slug: "staying-motivated-long-prep",              title: "Staying Motivated During a Long JEE/NEET Preparation Journey",    category: "Study Skills",        focusKeyword: "staying motivated JEE NEET preparation",  tags: ["Study Skills","Motivation","Strategy"],        author: AUTHORS[4] },
  { slug: "faster-reading-retention-boards",          title: "How to Read and Retain Information Faster for Board Exams",        category: "Study Skills",        focusKeyword: "faster reading retention board exams",    tags: ["Study Skills","Reading","Boards"],             author: AUTHORS[6] },
  { slug: "formula-sheet-creation-strategy",          title: "How to Build and Use Formula Sheets Effectively for JEE/NEET",    category: "Study Skills",        focusKeyword: "formula sheet JEE NEET strategy",         tags: ["Study Skills","Formula Sheet","JEE Main"],     author: AUTHORS[6] },
  { slug: "test-taking-strategies-jee-neet",          title: "Test-Taking Strategies Every JEE/NEET Student Should Master",     category: "Study Skills",        focusKeyword: "test taking strategies JEE NEET",         tags: ["Study Skills","Strategy","Exam Tips"],         author: AUTHORS[5] },
  { slug: "classroom-note-taking-science",            title: "Effective Classroom Note-Taking Techniques for Science Students",  category: "Study Skills",        focusKeyword: "classroom note taking techniques science", tags: ["Study Skills","Note Taking","Classroom"],      author: AUTHORS[6] },
  { slug: "revision-timetable-you-will-follow",       title: "Creating a Revision Timetable That You Will Actually Follow",      category: "Study Skills",        focusKeyword: "revision timetable JEE NEET students",    tags: ["Study Skills","Timetable","Revision"],         author: AUTHORS[5] },

  // ── Career & College Guidance (20) ─────────────────────────────────────
  { slug: "nit-trichy-jee-main-cutoff-guide",         title: "NIT Trichy: JEE Main Cutoff, Branches and What to Expect",        category: "Career Guidance",     focusKeyword: "NIT Trichy JEE Main cutoff",              tags: ["Career","NIT","JEE Main","College"],            author: AUTHORS[5] },
  { slug: "iit-bombay-jee-advanced-admission",        title: "IIT Bombay: JEE Advanced Cutoff, Branches and Selection Process", category: "Career Guidance",     focusKeyword: "IIT Bombay JEE Advanced cutoff",          tags: ["Career","IIT","JEE Advanced","College"],        author: AUTHORS[5] },
  { slug: "top-nits-for-cse-jee-main",               title: "Top NITs for CSE: JEE Main Cutoff and Campus Life Insights",      category: "Career Guidance",     focusKeyword: "top NITs CSE JEE Main cutoff",            tags: ["Career","NIT","CSE","College"],                 author: AUTHORS[5] },
  { slug: "engineering-vs-medicine-career-choice",    title: "Engineering vs Medicine: Which Career Path Should You Choose?",    category: "Career Guidance",     focusKeyword: "engineering vs medicine career India",    tags: ["Career","Engineering","Medicine","Choice"],     author: AUTHORS[4] },
  { slug: "aiims-delhi-neet-cutoff-life",             title: "AIIMS Delhi: NEET Cutoff, Admission Process and Life Inside",      category: "Career Guidance",     focusKeyword: "AIIMS Delhi NEET cutoff admission",       tags: ["Career","AIIMS","NEET","College"],              author: AUTHORS[5] },
  { slug: "iit-vs-nit-honest-comparison",             title: "IIT vs NIT: Honest Comparison for JEE Aspirants in 2026",         category: "Career Guidance",     focusKeyword: "IIT vs NIT comparison JEE aspirants",     tags: ["Career","IIT","NIT","College"],                 author: AUTHORS[5] },
  { slug: "engineering-branches-future-scope-2026",   title: "Top Engineering Branches by Salary and Future Scope in 2026",     category: "Career Guidance",     focusKeyword: "engineering branches future scope salary", tags: ["Career","Engineering","Branches","Future"],     author: AUTHORS[5] },
  { slug: "mbbs-career-path-india-guide",             title: "MBBS in India: Career Path, Specializations and Earnings",        category: "Career Guidance",     focusKeyword: "MBBS career path India",                  tags: ["Career","MBBS","Medicine","India"],             author: AUTHORS[2] },
  { slug: "btech-vs-dual-degree-iit",                 title: "B.Tech vs Dual Degree at IITs: Which Should You Choose?",         category: "Career Guidance",     focusKeyword: "BTech vs Dual Degree IIT",                tags: ["Career","IIT","B.Tech","Dual Degree"],          author: AUTHORS[5] },
  { slug: "career-options-if-jee-doesnt-work",        title: "Career Options If JEE Main Does Not Go As Planned",               category: "Career Guidance",     focusKeyword: "career options if JEE Main fails",        tags: ["Career","JEE Main","Alternatives"],             author: AUTHORS[4] },
  { slug: "state-engineering-colleges-when-better",   title: "State Engineering Colleges: When They Beat Private Universities",  category: "Career Guidance",     focusKeyword: "state engineering colleges vs private",   tags: ["Career","Engineering","State Colleges"],        author: AUTHORS[5] },
  { slug: "neet-counselling-2026-mcc-process",        title: "NEET Counselling 2026: MCC, State Quotas and Round Process",      category: "Career Guidance",     focusKeyword: "NEET counselling 2026 MCC state quota",   tags: ["Career","NEET","Counselling","Medical"],        author: AUTHORS[5] },
  { slug: "iit-jee-long-term-roi-analysis",           title: "The ROI of IIT JEE: Is the Investment Worth the Returns?",        category: "Career Guidance",     focusKeyword: "IIT JEE ROI investment returns",          tags: ["Career","IIT","JEE Advanced","ROI"],            author: AUTHORS[5] },
  { slug: "top-private-engineering-colleges-india",   title: "Top Private Engineering Colleges: Ranking, Fees and Placements",  category: "Career Guidance",     focusKeyword: "top private engineering colleges India",  tags: ["Career","Engineering","Private Colleges"],      author: AUTHORS[5] },
  { slug: "jee-advanced-college-branch-strategy",     title: "JEE Advanced College and Branch Selection: Strategy Guide",       category: "Career Guidance",     focusKeyword: "JEE Advanced college branch selection",   tags: ["Career","JEE Advanced","IIT","Strategy"],       author: AUTHORS[5] },
  { slug: "studying-abroad-after-class-12",           title: "Studying Abroad After Class 12: Is It an Alternative to JEE/NEET?", category: "Career Guidance",   focusKeyword: "studying abroad after class 12 India",    tags: ["Career","Study Abroad","Class 12"],             author: AUTHORS[5] },
  { slug: "scholarship-exams-class-11-12-india",      title: "Scholarship Exams for Class 11-12: KVPY, NTSE and More",          category: "Career Guidance",     focusKeyword: "scholarship exams class 11 12 KVPY NTSE", tags: ["Career","Scholarship","KVPY","NTSE"],           author: AUTHORS[5] },
  { slug: "iit-hostel-life-what-to-expect",           title: "Life Inside an IIT Hostel: What Every JEE Aspirant Should Know",  category: "Career Guidance",     focusKeyword: "IIT hostel life for JEE aspirants",       tags: ["Career","IIT","Hostel Life"],                  author: AUTHORS[5] },
  { slug: "career-counselling-class-10-11",           title: "Why Career Counselling in Class 10-11 Changes Everything",        category: "Career Guidance",     focusKeyword: "career counselling class 10 11",          tags: ["Career","Counselling","Class 10","Class 11"],   author: AUTHORS[4] },
  { slug: "gap-year-jee-neet-honest-analysis",        title: "Should You Take a Gap Year for JEE/NEET? Honest Analysis",        category: "Career Guidance",     focusKeyword: "gap year JEE NEET decision",              tags: ["Career","Gap Year","JEE Main","NEET"],          author: AUTHORS[4] },

  // ── Parent Guides (20) ─────────────────────────────────────────────────
  { slug: "parents-support-jee-neet-without-pressure", title: "How Parents Can Support Their JEE/NEET Child Without Adding Pressure", category: "Parent Guide", focusKeyword: "parents support JEE NEET child",         tags: ["Parents","Support","JEE Main","NEET"],          author: AUTHORS[6] },
  { slug: "parent-role-during-board-exam-season",     title: "The Right Role for Parents During Board and Competitive Exam Season", category: "Parent Guide", focusKeyword: "parent role during board exam season",    tags: ["Parents","Boards","Support"],                  author: AUTHORS[6] },
  { slug: "managing-child-screen-time-jee-neet",      title: "Managing Screen Time for JEE/NEET Aspirants: A Parent Guide",     category: "Parent Guide",        focusKeyword: "managing screen time JEE NEET parents",   tags: ["Parents","Screen Time","JEE Main","NEET"],      author: AUTHORS[6] },
  { slug: "when-child-fails-exam-parent-response",    title: "When Your Child Fails an Exam: How to Respond as a Parent",       category: "Parent Guide",        focusKeyword: "child fails exam parent response",        tags: ["Parents","Failure","Exams","Support"],          author: AUTHORS[6] },
  { slug: "coaching-vs-self-study-parent-decision",   title: "Coaching Classes vs Self-Study: A Parent Decision Guide",         category: "Parent Guide",        focusKeyword: "coaching vs self study parent decision",  tags: ["Parents","Coaching","Self Study"],              author: AUTHORS[4] },
  { slug: "financial-planning-jee-neet-coaching",     title: "Financial Planning for JEE/NEET Coaching: Costs and Scholarships", category: "Parent Guide",       focusKeyword: "financial planning JEE NEET coaching",   tags: ["Parents","Financial Planning","Coaching"],      author: AUTHORS[4] },
  { slug: "recognising-exam-stress-in-child",         title: "Recognising Exam Stress in Your Child: Signs and Solutions",      category: "Parent Guide",        focusKeyword: "exam stress child signs solutions parents", tags: ["Parents","Stress","Mental Health","Support"],  author: AUTHORS[6] },
  { slug: "effective-parent-teacher-communication",   title: "Effective Parent-Teacher Communication for Academic Success",     category: "Parent Guide",        focusKeyword: "parent teacher communication academic",   tags: ["Parents","Teachers","Communication"],           author: AUTHORS[6] },
  { slug: "home-study-environment-tips-parents",      title: "Creating the Ideal Home Study Environment for Your Child",        category: "Parent Guide",        focusKeyword: "home study environment tips parents",     tags: ["Parents","Study Environment","Home"],           author: AUTHORS[6] },
  { slug: "avoiding-sibling-comparison-parents",      title: "Sibling Comparison: Why Parents Should Stop and What to Do Instead", category: "Parent Guide",     focusKeyword: "sibling comparison pressure parents",     tags: ["Parents","Sibling Comparison","Pressure"],      author: AUTHORS[6] },
  { slug: "nutrition-sleep-for-studying-child",       title: "Feeding Your Child's Brain: Nutrition and Sleep During Exam Prep", category: "Parent Guide",       focusKeyword: "nutrition sleep child exam preparation",  tags: ["Parents","Nutrition","Sleep","Health"],         author: AUTHORS[6] },
  { slug: "phone-usage-limits-jee-neet-students",     title: "Setting Phone Usage Limits for JEE/NEET Students: Practical Guide", category: "Parent Guide",     focusKeyword: "phone usage limits JEE NEET students",   tags: ["Parents","Phone","Screen Time"],                author: AUTHORS[6] },
  { slug: "motivating-demotivated-jee-neet-student",  title: "How to Motivate a Demotivated JEE/NEET Student at Home",          category: "Parent Guide",        focusKeyword: "motivating demotivated JEE NEET student", tags: ["Parents","Motivation","Support"],               author: AUTHORS[4] },
  { slug: "choosing-right-coaching-for-child",        title: "How to Choose the Right Coaching Institute for Your Child",        category: "Parent Guide",        focusKeyword: "choosing coaching institute for child",   tags: ["Parents","Coaching","Selection"],               author: AUTHORS[4] },
  { slug: "board-exam-season-parent-week-guide",      title: "Board Exam Season: A Week-by-Week Parent Support Guide",          category: "Parent Guide",        focusKeyword: "board exam season parent support guide",  tags: ["Parents","Boards","Support","Week Guide"],      author: AUTHORS[6] },
  { slug: "peer-pressure-competitive-exams-parent",   title: "Helping Your Child Handle Peer Pressure During Exam Prep",        category: "Parent Guide",        focusKeyword: "peer pressure competitive exams child parents", tags: ["Parents","Peer Pressure","Support"],         author: AUTHORS[6] },
  { slug: "jee-neet-syllabus-explained-for-parents",  title: "JEE and NEET Syllabus Explained for Parents: What Is Tested",    category: "Parent Guide",        focusKeyword: "JEE NEET syllabus explained parents",     tags: ["Parents","JEE Main","NEET","Syllabus"],         author: AUTHORS[4] },
  { slug: "parent-burnout-coaching-era",              title: "Parent Burnout During the Coaching Era: Taking Care of Yourself", category: "Parent Guide",        focusKeyword: "parent burnout coaching era India",       tags: ["Parents","Burnout","Wellbeing"],                author: AUTHORS[6] },
  { slug: "celebrating-small-wins-child-exam",        title: "Why Celebrating Small Wins Is Critical for Your Child's Journey", category: "Parent Guide",        focusKeyword: "celebrating small wins child exam journey", tags: ["Parents","Motivation","Small Wins"],           author: AUTHORS[4] },
  { slug: "pinnacle-academic-classes-parent-guide",   title: "Pinnacle Academic Classes: Complete Admission Guide for Parents",  category: "Parent Guide",        focusKeyword: "Pinnacle Academic Classes admission guide", tags: ["Parents","Pinnacle","Admissions","Greater Noida"], author: AUTHORS[4] },
];

// ── Anthropic API call ────────────────────────────────────────────────────────
async function callAnthropic(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${ANT_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANT_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
      }
      const data = await res.json() as { content: { text: string }[] };
      return data.content[0].text;
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

interface ArticleContent {
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
}

async function generateArticle(topic: Topic): Promise<ArticleContent> {
  const prompt = `You are a content writer for Pinnacle Academic Classes, a JEE/NEET coaching institute in Greater Noida, India.

Write a comprehensive, SEO-optimised blog article about:

Title: "${topic.title}"
Focus keyword: "${topic.focusKeyword}"
Category: ${topic.category}

Respond using EXACTLY this format — no extra text before or after, no markdown fences:

EXCERPT|||Two to three sentence compelling summary, under 160 characters.
SEOTITLE|||SEO-optimised title under 60 characters including the focus keyword.
METADESC|||Meta description 150-160 characters including the focus keyword.
HTMLSTART
<p>Opening paragraph that hooks the reader.</p>
<h2>First section heading</h2>
<p>Content...</p>
<h2>Second section heading</h2>
<p>Content...</p>
<h2>Third section heading</h2>
<ul><li>Tip one</li><li>Tip two</li></ul>
<p>Motivational closing paragraph.</p>
HTMLEND

Content requirements:
- Total HTML body: 800-1200 words
- At least 3 <h2> section headings
- Use <p>, <ul>, <li>, <h2>, <h3> tags only — no <html>, <body>, <head>, <style>, <script>
- Indian context: CBSE, NTA, IIT, AIIMS, Greater Noida where relevant
- Practical, actionable advice for Class 11-12 students and parents in India
- Mention Pinnacle Academic Classes naturally once as a coaching reference
- No competitor coaching institute names`;

  const raw = await callAnthropic(prompt);

  const excerptMatch = raw.match(/^EXCERPT\|\|\|(.+)$/m);
  const seoTitleMatch = raw.match(/^SEOTITLE\|\|\|(.+)$/m);
  const metaDescMatch = raw.match(/^METADESC\|\|\|(.+)$/m);
  const contentMatch  = raw.match(/HTMLSTART\s*([\s\S]*?)\s*HTMLEND/);

  if (!excerptMatch || !seoTitleMatch || !metaDescMatch || !contentMatch) {
    throw new Error(`Delimiter parse failed for ${topic.slug}. Raw (200): ${raw.slice(0, 200)}`);
  }

  return {
    excerpt:         excerptMatch[1].trim(),
    seoTitle:        seoTitleMatch[1].trim(),
    metaDescription: metaDescMatch[1].trim(),
    content:         contentMatch[1].trim(),
  };
}

// Estimate read time in minutes from HTML string
function estimateReadMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 200));
}

// Spread publishedAt dates over the last 18 months
function publishedAt(index: number, total: number): Date {
  const now = Date.now();
  const eighteenMonths = 18 * 30 * 24 * 60 * 60 * 1000;
  const oldest = now - eighteenMonths;
  const step = eighteenMonths / total;
  // Slightly randomize within each slot to look natural
  const jitter = (Math.random() - 0.5) * step * 0.4;
  return new Date(oldest + index * step + jitter);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🚀 Blog seeder starting — ${TOPICS.length} topics\n`);

  // Check which slugs already exist
  const slugs = TOPICS.map(t => t.slug);
  const { rows: existing } = await pool.query<{ slug: string }>(
    `SELECT slug FROM blog_posts WHERE slug = ANY($1::text[])`,
    [slugs]
  );
  const existingSet = new Set(existing.map(r => r.slug));

  const todo = TOPICS.filter(t => !existingSet.has(t.slug));
  console.log(`✅ Already seeded: ${existingSet.size}`);
  console.log(`📝 To generate:   ${todo.length}\n`);

  if (todo.length === 0) {
    console.log("Nothing to do — all 200 articles already seeded.");
    await pool.end();
    return;
  }

  let done = 0;
  let failed = 0;
  const CONCURRENCY = 5;

  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (topic) => {
      const globalIdx = TOPICS.indexOf(topic);
      try {
        const art = await generateArticle(topic);
        await pool.query(
          `INSERT INTO blog_posts
             (id, slug, title, excerpt, content, category, tags, author_name, status,
              read_minutes, published_at, seo_title, meta_description, focus_keyword,
              ai_enhanced_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published',$9,$10,$11,$12,$13,NOW(),NOW(),NOW())
           ON CONFLICT (slug) DO NOTHING`,
          [
            randomUUID(),
            topic.slug,
            topic.title,
            art.excerpt,
            art.content,
            topic.category,
            topic.tags,
            topic.author,
            estimateReadMinutes(art.content),
            publishedAt(globalIdx, TOPICS.length),
            art.seoTitle,
            art.metaDescription,
            topic.focusKeyword,
          ]
        );
        done++;
        console.log(`[${done + failed}/${todo.length}] ✓ ${topic.slug}`);
      } catch (e) {
        failed++;
        console.error(`[${done + failed}/${todo.length}] ✗ FAIL ${topic.slug}:`, (e as Error).message);
      }
    }));
  }

  const { rows: [{ count }] } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM blog_posts WHERE status = 'published'`
  );
  await pool.end();
  console.log(`\n✅ Done! Inserted ${done}, failed ${failed}. Total published in DB: ${count}`);
}

seed().catch(err => { console.error(err); process.exit(1); });
