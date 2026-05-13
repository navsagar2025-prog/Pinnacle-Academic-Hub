import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface SeedDemoResult {
  created: string[];
  skipped: boolean;
}

export async function seedDemo(): Promise<SeedDemoResult> {
  const created: string[] = [];

  // ── Idempotency guard ──────────────────────────────────────────────────────
  const existing = await db.execute(sql`
    SELECT id FROM users WHERE email = 'demo.student@pinnacle.test' LIMIT 1
  `);
  if (existing.rows.length > 0) {
    return { created: [], skipped: true };
  }

  // ── Resolve or create admin user ──────────────────────────────────────────
  const adminRows = await db.execute(sql`
    SELECT id FROM users WHERE role = 'admin' AND approval_status = 'approved' LIMIT 1
  `);
  let adminId: string;
  if (adminRows.rows.length > 0) {
    adminId = adminRows.rows[0].id as string;
  } else {
    const adminUser = await db.execute(sql`
      INSERT INTO users (id, clerk_user_id, name, email, role, approval_status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'demo_admin_seed', 'Demo Admin', 'demo.admin@pinnacle.test', 'admin', 'approved', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    adminId = adminUser.rows[0].id as string;
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const studentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_student', 'Aryan Sharma', 'demo.student@pinnacle.test', '+91-9876543210', 'student', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const studentUserId = studentUser.rows[0].id as string;
  created.push("Demo student user: Aryan Sharma (demo.student@pinnacle.test)");

  const parentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_parent', 'Ramesh Sharma', 'demo.parent@pinnacle.test', '+91-9876543211', 'parent', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const parentUserId = parentUser.rows[0].id as string;
  created.push("Demo parent user: Ramesh Sharma (demo.parent@pinnacle.test)");

  const teacherUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_teacher', 'Priya Mehta', 'demo.teacher@pinnacle.test', '+91-9876543212', 'teacher', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const teacherUserId = teacherUser.rows[0].id as string;
  created.push("Demo teacher user: Priya Mehta (demo.teacher@pinnacle.test)");

  // ── Teacher profile ───────────────────────────────────────────────────────
  const teacherRow = await db.execute(sql`
    INSERT INTO teachers (id, user_id, designation, qualification, subjects, experience_years, bio, initials, is_examiner, is_active, joined_at, updated_at)
    VALUES (gen_random_uuid(), ${teacherUserId}, 'Senior Faculty', 'M.Sc Physics, B.Ed', ARRAY['Physics','Mathematics','Biology'], 8,
      'Expert JEE/NEET faculty with 8+ years experience at Pinnacle Academic Classes, Greater Noida.', 'PM', true, true, NOW(), NOW())
    RETURNING id
  `);
  const teacherId = teacherRow.rows[0].id as string;
  created.push("Demo teacher profile: Priya Mehta (Physics, Maths, Biology)");

  // ── Courses ───────────────────────────────────────────────────────────────
  const jeeCourse = await db.execute(sql`
    INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo-jee-mains-2026', 'JEE Mains 2026',
      'Comprehensive JEE Mains preparation covering Physics, Chemistry, and Mathematics with daily practice tests and fortnightly mocks.',
      'JEE', 45000, 2000, 35, 'Class 11-12 students',
      ARRAY['Daily practice tests','Expert faculty','Doubt clearing sessions','Mock tests every fortnight','Rank improvement tracking'],
      true, NOW(), NOW())
    RETURNING id
  `);
  const jeeCourseId = jeeCourse.rows[0].id as string;
  created.push("Course: JEE Mains 2026 (₹45,000/year)");

  const neetCourse = await db.execute(sql`
    INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo-neet-2026', 'NEET UG 2026',
      'Complete NEET UG preparation with Biology, Physics, and Chemistry — NCERT-focused approach with diagram mnemonics.',
      'NEET', 42000, 2000, 35, 'Class 11-12 students',
      ARRAY['NCERT chapter-by-chapter','Biology mastery (350+ marks)','Weekly sectional tests','Diagram & mnemonic sessions','Previous year papers'],
      true, NOW(), NOW())
    RETURNING id
  `);
  const neetCourseId = neetCourse.rows[0].id as string;
  created.push("Course: NEET UG 2026 (₹42,000/year)");

  // ── Batches ───────────────────────────────────────────────────────────────
  const jeeBatch = await db.execute(sql`
    INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeCourseId}, 'JEE Mains — Morning Batch A', '7:00 AM – 9:00 AM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 101', NOW(), NOW())
    RETURNING id
  `);
  const jeeBatchId = jeeBatch.rows[0].id as string;
  created.push("Batch: JEE Mains Morning Batch A (Room 101, Mon–Sat 7–9 AM)");

  const neetBatch = await db.execute(sql`
    INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
    VALUES (gen_random_uuid(), ${neetCourseId}, 'NEET — Evening Batch B', '4:00 PM – 6:00 PM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 202', NOW(), NOW())
    RETURNING id
  `);
  const neetBatchId = neetBatch.rows[0].id as string;
  created.push("Batch: NEET Evening Batch B (Room 202, Mon–Sat 4–6 PM)");

  // ── Student + parent records ───────────────────────────────────────────────
  // Primary enrollment: JEE batch
  const studentRow = await db.execute(sql`
    INSERT INTO students (id, user_id, batch_id, roll_number, guardian_name, guardian_phone, fee_plan, enrolled_at, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentUserId}, ${jeeBatchId}, 'DEMO-001', 'Ramesh Sharma', '+91-9876543211', 'annual', NOW(), true, NOW(), NOW())
    RETURNING id
  `);
  const studentId = studentRow.rows[0].id as string;
  created.push("Student: Aryan Sharma enrolled in JEE Mains batch (roll DEMO-001)");

  await db.execute(sql`
    INSERT INTO parents (id, user_id, student_id, relation, created_at, updated_at)
    VALUES (gen_random_uuid(), ${parentUserId}, ${studentId}, 'Father', NOW(), NOW())
  `);
  created.push("Parent: Ramesh Sharma linked as Father of Aryan Sharma");

  // ── Schedules — Mon-Sat covering all subjects (Biology on Tue, Chemistry on Thu) ────
  const scheduleEntries = [
    { day: 1, subject: 'Physics',     topic: 'Mechanics',          start: '07:00', end: '09:00', batch: jeeBatchId },
    { day: 2, subject: 'Biology',     topic: 'Cell Biology',       start: '07:00', end: '09:00', batch: jeeBatchId },
    { day: 3, subject: 'Physics',     topic: 'Electrostatics',     start: '07:00', end: '09:00', batch: jeeBatchId },
    { day: 4, subject: 'Chemistry',   topic: 'Organic Chemistry',  start: '07:00', end: '09:00', batch: jeeBatchId },
    { day: 5, subject: 'Mathematics', topic: 'Calculus',           start: '07:00', end: '09:00', batch: jeeBatchId },
    { day: 6, subject: 'Physics',     topic: 'Modern Physics',     start: '07:00', end: '09:00', batch: jeeBatchId },
  ];
  for (const s of scheduleEntries) {
    await db.execute(sql`
      INSERT INTO schedules (id, batch_id, teacher_id, subject, topic, day_of_week, start_time, end_time, is_recurring, created_at, updated_at)
      VALUES (gen_random_uuid(), ${s.batch}, ${teacherId}, ${s.subject}, ${s.topic}, ${s.day}, ${s.start}, ${s.end}, true, NOW(), NOW())
    `);
  }
  created.push("6 schedule entries (Mon–Sat: Physics, Biology, Physics, Chemistry, Maths, Physics)");

  // ── Attendance — last 30 weekdays ─────────────────────────────────────────
  let attendanceCount = 0;
  const statuses = ['present','present','present','present','present','present','present','present','late','absent'];
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0) continue;
    const status = statuses[(i * 7) % 10];
    try {
      const res = await db.execute(sql`
        INSERT INTO attendance (id, student_id, date, subject, status, marked_by, created_at)
        VALUES (gen_random_uuid(), ${studentId}, ${d.toISOString()}, 'Physics', ${status}, ${adminId}, NOW())
        ON CONFLICT (student_id, date, subject) DO NOTHING
      `);
      if ((res.rowCount ?? 0) > 0) attendanceCount++;
    } catch { /* ignore */ }
  }
  created.push(`${attendanceCount} attendance rows (last 30 days, ~80% present / ~10% late / ~10% absent)`);

  // ── Student test results (unit tests + practice mocks) ────────────────────
  const testResultData = [
    { exam: 'Unit Test 1 — Physics', subject: 'Physics',     total: 100, obtained: 78, rank: '3rd / 32',  daysAgo: 60 },
    { exam: 'Unit Test 2 — Chemistry', subject: 'Chemistry', total: 100, obtained: 85, rank: '1st / 32',  daysAgo: 45 },
    { exam: 'Unit Test 3 — Biology', subject: 'Biology',     total: 100, obtained: 72, rank: '5th / 30',  daysAgo: 30 },
    { exam: 'Practice Mock — JEE Pattern', subject: 'Mixed', total: 300, obtained: 196, rank: '2nd / 28', daysAgo: 21 },
    { exam: 'Half-Yearly Mock', subject: 'Mixed',            total: 300, obtained: 217, rank: '1st / 32', daysAgo: 7  },
  ];
  for (const r of testResultData) {
    const examDate = new Date(); examDate.setDate(examDate.getDate() - r.daysAgo);
    await db.execute(sql`
      INSERT INTO student_test_results (id, student_id, batch_id, exam_name, subject, total_marks, marks_obtained, rank, exam_date, created_at)
      VALUES (gen_random_uuid(), ${studentId}, ${jeeBatchId}, ${r.exam}, ${r.subject}, ${r.total}, ${r.obtained}, ${r.rank}, ${examDate.toISOString()}, NOW())
    `);
  }
  created.push("5 student test results (Unit Test 1-3, Practice Mock, Half-Yearly) with ranks");

  // ── Study materials ───────────────────────────────────────────────────────
  const materials = [
    { title: 'Kinematics — Complete Notes',          subject: 'Physics',     type: 'notes',    url: 'https://example.com/demo/kinematics-notes.pdf',      size: '2.4 MB' },
    { title: 'Organic Chemistry — Reaction Summary', subject: 'Chemistry',   type: 'formula',  url: 'https://example.com/demo/org-chem-reactions.pdf',    size: '1.8 MB' },
    { title: 'Cell Biology — Diagram Compendium',    subject: 'Biology',     type: 'notes',    url: 'https://example.com/demo/cell-bio-diagrams.pdf',     size: '4.2 MB' },
    { title: 'Integration Practice Worksheet',       subject: 'Mathematics', type: 'exercise', url: 'https://example.com/demo/integration-practice.pdf',  size: '3.1 MB' },
    { title: 'Previous Year JEE Questions — PCM',   subject: 'Mixed',       type: 'pyq',      url: 'https://example.com/demo/jee-pyq-2020-2025.pdf',     size: '8.7 MB' },
  ];
  for (const m of materials) {
    await db.execute(sql`
      INSERT INTO study_materials (id, batch_id, uploaded_by, title, subject, type, file_url, file_size, is_visible, created_at, updated_at)
      VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, ${m.title}, ${m.subject}, ${m.type}, ${m.url}, ${m.size}, true, NOW(), NOW())
    `);
  }
  created.push("5 study materials (notes, formula sheet, biology diagrams, exercise, PYQ pack)");

  // ── Class recordings ──────────────────────────────────────────────────────
  const classDate1 = new Date(); classDate1.setDate(classDate1.getDate() - 7);
  const classDate2 = new Date(); classDate2.setDate(classDate2.getDate() - 14);
  const classDate3 = new Date(); classDate3.setDate(classDate3.getDate() - 21);
  await db.execute(sql`
    INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ARRAY[${jeeBatchId}::uuid], 'Kinematics — Lecture 1: Motion in a Straight Line', 'Physics', 'Priya Mehta', 'https://zoom.us/rec/demo-kinematics-lec1', 'zoom', ${classDate1.toISOString()}, 90, true, 18, ${teacherUserId}, NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ARRAY[${jeeBatchId}::uuid], 'Cell Biology — Intro: Cell Structure, Organelles & Functions', 'Biology', 'Priya Mehta', 'https://zoom.us/rec/demo-cell-bio-lec1', 'zoom', ${classDate2.toISOString()}, 85, true, 24, ${teacherUserId}, NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ARRAY[${jeeBatchId}::uuid], 'Organic Chemistry — Named Reactions Part 1', 'Chemistry', 'Priya Mehta', 'https://zoom.us/rec/demo-org-chem-lec1', 'zoom', ${classDate3.toISOString()}, 95, true, 31, ${teacherUserId}, NOW(), NOW())
  `);
  created.push("3 class recordings (Kinematics, Cell Biology, Organic Chemistry)");

  // ── Question Bank (20 questions, 5 with image URLs) ───────────────────────
  type Q = {
    subject: string; topic: string; type: 'mcq' | 'numerical'; difficulty: string;
    text: string; optA?: string; optB?: string; optC?: string; optD?: string;
    correct: string; sol: string; exam: string[]; imageUrl?: string;
  };
  const questions: Q[] = [
    // Physics — with diagram image URL
    { subject: 'Physics', topic: 'Kinematics', type: 'mcq', difficulty: 'medium',
      text: 'A body starts from rest and accelerates uniformly. The ratio of distances covered in 1st, 2nd, and 3rd seconds is:',
      optA: '1:2:3', optB: '1:3:5', optC: '1:4:9', optD: '2:4:6', correct: 'B',
      sol: 'For uniform acceleration from rest, distances in successive seconds follow the odd-number rule: 1:3:5.',
      exam: ['JEE_MAIN','JEE_ADVANCED'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Motion_diagram.svg/320px-Motion_diagram.svg.png' },
    { subject: 'Physics', topic: 'Laws of Motion', type: 'mcq', difficulty: 'easy',
      text: 'A 10 kg block on a frictionless surface has 20 N applied horizontally. Its acceleration is:',
      optA: '1 m/s²', optB: '2 m/s²', optC: '0.5 m/s²', optD: '10 m/s²', correct: 'B',
      sol: 'F = ma → a = 20/10 = 2 m/s².', exam: ['JEE_MAIN'] },
    { subject: 'Physics', topic: 'Work & Energy', type: 'mcq', difficulty: 'medium',
      text: 'A spring of constant k stretched by x. Work done is:',
      optA: 'kx', optB: 'kx²', optC: '½kx²', optD: '2kx²', correct: 'C',
      sol: 'Work done = ½kx² (elastic potential energy stored in a spring).', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics', topic: 'Electrostatics', type: 'mcq', difficulty: 'hard',
      text: 'Two charges +q and –q are placed 2r apart. The electric field at the midpoint has magnitude:',
      optA: '0', optB: 'kq/r²', optC: '2kq/r²', optD: '4kq/r²', correct: 'D',
      sol: 'At midpoint, both fields point toward –q. Each = kq/r². Total = 2×(kq/r²)×2 = 4kq/r².',
      exam: ['JEE_MAIN','JEE_ADVANCED'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg' },
    { subject: 'Physics', topic: 'Waves', type: 'mcq', difficulty: 'medium',
      text: 'Frequency doubles with wave speed held constant. The wavelength:',
      optA: 'Doubles', optB: 'Halves', optC: 'Remains same', optD: 'Quadruples', correct: 'B',
      sol: 'v = fλ. v constant, f doubles → λ halves.', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics', topic: 'Optics', type: 'mcq', difficulty: 'medium',
      text: 'Convex lens f = 20 cm forms a real image at v = 60 cm. The object distance is:',
      optA: '15 cm', optB: '30 cm', optC: '40 cm', optD: '20 cm', correct: 'B',
      sol: '1/f = 1/v – 1/u → 1/20 = 1/60 – 1/u → u = –30 cm → 30 cm.', exam: ['JEE_MAIN'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Convex_lens_diagram.svg/320px-Convex_lens_diagram.svg.png' },
    { subject: 'Physics', topic: 'Thermodynamics', type: 'mcq', difficulty: 'hard',
      text: 'In an adiabatic process, work done by the gas equals:',
      optA: 'Zero', optB: 'Decrease in internal energy', optC: 'Increase in enthalpy', optD: 'Heat added', correct: 'B',
      sol: 'Q = 0; by first law: ΔU = Q – W = –W, so W = –ΔU = decrease in internal energy.', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics', topic: 'Modern Physics', type: 'mcq', difficulty: 'hard',
      text: 'de Broglie wavelength of a particle is inversely proportional to its:',
      optA: 'Mass', optB: 'Velocity', optC: 'Momentum', optD: 'Kinetic energy', correct: 'C',
      sol: 'λ = h/p — wavelength is inversely proportional to momentum (p = mv).', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics', topic: 'Gravitation', type: 'mcq', difficulty: 'medium',
      text: "Earth's escape velocity is approximately:",
      optA: '7.9 km/s', optB: '11.2 km/s', optC: '3.0 km/s', optD: '25.0 km/s', correct: 'B',
      sol: 'v_esc = √(2GM/R) ≈ 11.2 km/s for Earth.', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics', topic: 'Kinematics', type: 'numerical', difficulty: 'medium',
      text: 'Ball thrown vertically upward at 20 m/s. Maximum height in metres? (g = 10 m/s²)',
      correct: '20', sol: 'h = v²/2g = (20)²/20 = 20 m.', exam: ['JEE_MAIN'] },
    // Biology
    { subject: 'Biology', topic: 'Cell Biology', type: 'mcq', difficulty: 'easy',
      text: 'The organelle called the "powerhouse of the cell":',
      optA: 'Nucleus', optB: 'Ribosome', optC: 'Mitochondria', optD: 'Golgi apparatus', correct: 'C',
      sol: 'Mitochondria produce ATP through cellular respiration.', exam: ['NEET'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Animal_mitochondria_diagram.svg/320px-Animal_mitochondria_diagram.svg.png' },
    { subject: 'Biology', topic: 'Genetics', type: 'mcq', difficulty: 'medium',
      text: "Mendel's monohybrid cross F2 phenotypic ratio:",
      optA: '1:1', optB: '1:2:1', optC: '3:1', optD: '9:3:3:1', correct: 'C',
      sol: '3 dominant : 1 recessive — F2 phenotypic ratio in a monohybrid cross.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Photosynthesis', type: 'mcq', difficulty: 'medium',
      text: 'Primary CO₂ acceptor in the Calvin cycle:',
      optA: 'RuBP', optB: 'PGA', optC: 'PGAL', optD: 'OAA', correct: 'A',
      sol: 'Ribulose-1,5-bisphosphate (RuBP) accepts CO₂ — catalysed by RuBisCO.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Human Physiology', type: 'mcq', difficulty: 'easy',
      text: '"Universal donor" blood group:',
      optA: 'A', optB: 'B', optC: 'AB', optD: 'O', correct: 'D',
      sol: 'O negative lacks A, B, and Rh antigens — universal donor for packed RBCs.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Ecology', type: 'mcq', difficulty: 'medium',
      text: 'Mycorrhizae–plant root relationship type:',
      optA: 'Parasitism', optB: 'Commensalism', optC: 'Mutualism', optD: 'Amensalism', correct: 'C',
      sol: 'Both the fungus and the plant benefit (mutualism).', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Reproduction', type: 'mcq', difficulty: 'medium',
      text: 'Which is NOT a method of vegetative propagation?',
      optA: 'Budding', optB: 'Grafting', optC: 'Layering', optD: 'Conjugation', correct: 'D',
      sol: 'Conjugation is bacterial gene transfer, not plant vegetative propagation.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Cell Biology', type: 'mcq', difficulty: 'easy',
      text: 'Organelle that synthesises proteins:',
      optA: 'Lysosome', optB: 'Ribosome', optC: 'Centrosome', optD: 'Vacuole', correct: 'B',
      sol: 'Ribosomes are the site of translation (protein synthesis).', exam: ['NEET','CBSE_BOARDS'] },
    { subject: 'Biology', topic: 'Ecology', type: 'mcq', difficulty: 'hard',
      text: 'Primary productivity is highest in which ecosystem?',
      optA: 'Desert', optB: 'Tundra', optC: 'Tropical rainforest', optD: 'Grassland', correct: 'C',
      sol: 'Tropical rainforests receive maximum sunlight and rainfall → highest primary productivity.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Genetics', type: 'numerical', difficulty: 'hard',
      text: 'Population = 1000, freq(A) = 0.6. Expected homozygous recessive (aa) individuals by Hardy-Weinberg:',
      correct: '160', sol: 'q = 1 – 0.6 = 0.4; q² = 0.16; 0.16 × 1000 = 160.', exam: ['NEET'] },
    { subject: 'Biology', topic: 'Human Physiology', type: 'numerical', difficulty: 'medium',
      text: 'Normal body temperature 98.6°F expressed in Celsius (nearest whole number):',
      correct: '37', sol: 'C = (98.6 – 32) × 5/9 = 66.6 × 5/9 ≈ 37°C.', exam: ['NEET'] },
  ];

  for (const q of questions) {
    if (q.type === 'mcq') {
      if (q.imageUrl) {
        await db.execute(sql`
          INSERT INTO question_bank.question_bank
            (id, subject, topic, difficulty, question_type, question_text, options, correct_answer, solution, image_url, is_published, review_status, source, exam_target, created_at, updated_at)
          VALUES (
            gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'mcq',
            ${q.text},
            ${JSON.stringify({ A: q.optA, B: q.optB, C: q.optC, D: q.optD })}::jsonb,
            ${q.correct}, ${q.sol}, ${q.imageUrl}, true, 'approved', 'MANUAL',
            ${q.exam}::text[], NOW(), NOW()
          )
        `);
      } else {
        await db.execute(sql`
          INSERT INTO question_bank.question_bank
            (id, subject, topic, difficulty, question_type, question_text, options, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
          VALUES (
            gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'mcq',
            ${q.text},
            ${JSON.stringify({ A: q.optA, B: q.optB, C: q.optC, D: q.optD })}::jsonb,
            ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL',
            ${q.exam}::text[], NOW(), NOW()
          )
        `);
      }
    } else {
      await db.execute(sql`
        INSERT INTO question_bank.question_bank
          (id, subject, topic, difficulty, question_type, question_text, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
        VALUES (
          gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'numerical',
          ${q.text}, ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL',
          ${q.exam}::text[], NOW(), NOW()
        )
      `);
    }
  }
  const imageQCount = questions.filter(q => q.imageUrl).length;
  created.push(`${questions.length} question bank questions (Physics + Biology, MCQ + numerical, ${imageQCount} with diagram image URLs)`);

  // ── Mock test with 2 sections + per-question answers ─────────────────────
  const mockTest = await db.execute(sql`
    INSERT INTO mock_tests (id, title, subject, exam_type, batch_id, duration_minutes, marks_per_question, negative_marking_percent, instructions, is_published, is_public, created_by, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Demo Full Mock Test — JEE Pattern', 'Mixed', 'JEE_MAIN', ${jeeBatchId}, 60, 4, 25,
      'Read each question carefully. Attempt all sections. –1 mark per wrong MCQ. No penalty for numerical. Review answers before submitting.',
      true, false, ${adminId}, NOW(), NOW())
    RETURNING id
  `);
  const mockTestId = mockTest.rows[0].id as string;

  const sec1 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Physics', 1, 'Questions 1–10: Physics. MCQ (–1 for wrong) + Integer type (no penalty).', NOW())
    RETURNING id
  `);
  const sec2 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Biology', 2, 'Questions 11–20: Biology. MCQ (–1 for wrong) + Integer type (no penalty).', NOW())
    RETURNING id
  `);
  const sec1Id = sec1.rows[0].id as string;
  const sec2Id = sec2.rows[0].id as string;

  // Insert mock test questions and collect their IDs for answer seeding
  const physicsQs = questions.filter(q => q.subject === 'Physics');
  const bioQs = questions.filter(q => q.subject === 'Biology');
  const mockQIds: { id: string; type: string; correct: string }[] = [];

  let qNum = 1;
  for (const q of physicsQs) {
    let qRow;
    if (q.type === 'mcq') {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, image_url, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, 'mcq', ${q.optA ?? null}, ${q.optB ?? null}, ${q.optC ?? null}, ${q.optD ?? null}, ${q.correct}, ${q.topic}, ${q.sol}, ${q.imageUrl ?? null}, NOW())
        RETURNING id
      `);
    } else {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, 'numerical', ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
        RETURNING id
      `);
    }
    mockQIds.push({ id: qRow.rows[0].id as string, type: q.type, correct: q.correct });
    qNum++;
  }
  for (const q of bioQs) {
    let qRow;
    if (q.type === 'mcq') {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, image_url, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, 'mcq', ${q.optA ?? null}, ${q.optB ?? null}, ${q.optC ?? null}, ${q.optD ?? null}, ${q.correct}, ${q.topic}, ${q.sol}, ${q.imageUrl ?? null}, NOW())
        RETURNING id
      `);
    } else {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, 'numerical', ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
        RETURNING id
      `);
    }
    mockQIds.push({ id: qRow.rows[0].id as string, type: q.type, correct: q.correct });
    qNum++;
  }
  created.push(`Mock test: "Demo Full Mock Test — JEE Pattern" — 2 sections (${physicsQs.length} Physics + ${bioQs.length} Biology)`);

  // ── Mock test attempt ──────────────────────────────────────────────────────
  const attemptStart = new Date(); attemptStart.setDate(attemptStart.getDate() - 2);
  const attemptEnd = new Date(attemptStart.getTime() + 55 * 60 * 1000);
  const attemptRow = await db.execute(sql`
    INSERT INTO mock_test_attempts (id, test_id, student_id, started_at, submitted_at, total_questions, attempted_count, correct_count, wrong_count, score, max_score, time_spent_seconds, is_completed)
    VALUES (gen_random_uuid(), ${mockTestId}, ${studentId}, ${attemptStart.toISOString()}, ${attemptEnd.toISOString()}, 20, 18, 12, 6, 48, 80, 3300, true)
    RETURNING id
  `);
  const attemptId = attemptRow.rows[0].id as string;

  // ── Per-question answer rows (mock_test_answers) ──────────────────────────
  // Seed 18 answered questions: first 12 correct, next 6 wrong, last 2 skipped (no row)
  const wrongOptions: Record<string, string> = { A: 'B', B: 'C', C: 'D', D: 'A' };
  for (let i = 0; i < mockQIds.length; i++) {
    const mq = mockQIds[i]!;
    if (i >= 18) break; // last 2 skipped

    const isCorrect = i < 12;
    const timeSpent = 90 + Math.floor(Math.random() * 120);

    if (mq.type === 'mcq') {
      const selectedOpt = isCorrect
        ? mq.correct
        : (wrongOptions[mq.correct] ?? (mq.correct === 'A' ? 'B' : 'A'));
      const marksAwarded = isCorrect ? 4 : -1;
      await db.execute(sql`
        INSERT INTO mock_test_answers (id, attempt_id, question_id, selected_option, is_correct, marks_awarded, is_marked_for_review, time_spent_seconds, created_at, updated_at)
        VALUES (gen_random_uuid(), ${attemptId}, ${mq.id}, ${selectedOpt}, ${isCorrect}, ${marksAwarded}, false, ${timeSpent}, NOW(), NOW())
        ON CONFLICT (attempt_id, question_id) DO NOTHING
      `);
    } else {
      const response = isCorrect ? parseFloat(mq.correct) : parseFloat(mq.correct) + 5;
      const marksAwarded = isCorrect ? 4 : 0;
      await db.execute(sql`
        INSERT INTO mock_test_answers (id, attempt_id, question_id, numerical_response, is_correct, marks_awarded, is_marked_for_review, time_spent_seconds, created_at, updated_at)
        VALUES (gen_random_uuid(), ${attemptId}, ${mq.id}, ${response}, ${isCorrect}, ${marksAwarded}, false, ${timeSpent}, NOW(), NOW())
        ON CONFLICT (attempt_id, question_id) DO NOTHING
      `);
    }
  }
  created.push("Mock test attempt: 18 answered (12 correct, 6 wrong, 2 skipped), score 48/80 — with 18 per-question answer rows");

  // ── Assignments ───────────────────────────────────────────────────────────
  const dueIn7   = new Date(); dueIn7.setDate(dueIn7.getDate() + 7);
  const dueYest  = new Date(); dueYest.setDate(dueYest.getDate() - 1);
  const due2wAgo = new Date(); due2wAgo.setDate(due2wAgo.getDate() - 14);
  const posted3w = new Date(); posted3w.setDate(posted3w.getDate() - 21);

  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Kinematics Problem Set', 'Physics',
      'Solve 20 problems on kinematics — projectile motion, relative motion, and velocity-time graphs. Show full working for each.', ${dueIn7.toISOString()}, 40, true, NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Organic Chemistry — Named Reactions', 'Chemistry',
      'Write and balance 15 named reactions with full mechanisms (Aldol, Cannizzaro, Sandmeyer, Reimer-Tiemann, etc.).', ${dueYest.toISOString()}, 30, true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days')
  `);
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Integration Practice Worksheet', 'Mathematics',
      'Complete all definite and indefinite integration problems on the worksheet. Substitution and integration by parts required.', ${due2wAgo.toISOString()}, 50, true, ${posted3w.toISOString()}, ${posted3w.toISOString()})
  `);
  created.push("3 assignments — Physics (pending, due+7 days), Chemistry (overdue, due yesterday), Maths (past-due, 14 days ago)");

  // ── Notices ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Unit Test Schedule — June 2026',
      'Unit tests for all JEE and NEET batches will be conducted from June 15–20, 2026. Students must carry their admit cards and arrive 15 minutes early. Syllabus covers all topics taught since April.', 'Academic', true, ${jeeBatchId}, NOW(), NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Fee Due Reminder — June 2026 Quarter',
      'Please clear your June quarter tuition fees by June 5th to avoid a 5% late charge. Contact the accounts office for payment plans, UPI details, or receipt queries.', 'Fee', true, ${jeeBatchId}, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Annual Science Quiz 2026 — Registration Open',
      'Pinnacle Annual Science Quiz 2026 registrations are now open! Prizes: ₹5,000 / ₹3,000 / ₹1,500 for top 3 (JEE + NEET combined). Register at the office before May 30.', 'Event', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
  `);
  created.push("3 notices (Academic: Unit Test schedule, Fee: Q2 reminder, Event: Science Quiz)");

  // ── Doubts ─────────────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, status, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, ${jeeBatchId}, 'Physics', 'Kinematics',
      'In uniform circular motion, displacement for a complete revolution is zero. Does that mean average velocity is always zero even though the object moves continuously?', false, 'open', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
  `);
  const doubt2 = await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, status, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, ${jeeBatchId}, 'Chemistry', 'Organic Chemistry',
      'What is the practical difference between inductive effect and mesomeric effect? When does each dominate in determining reactivity?', false, 'open', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
    RETURNING id
  `);
  const doubt2Id = doubt2.rows[0].id as string;

  await db.execute(sql`
    INSERT INTO doubt_answers (id, doubt_id, author_id, author_role, answer_text, is_official, upvotes, created_at)
    VALUES (gen_random_uuid(), ${doubt2Id}, ${teacherUserId}, 'teacher',
      'Great question! Inductive effect (I-effect) operates through sigma bonds based on electronegativity — it is a permanent, distance-dependent effect that diminishes rapidly. Mesomeric effect (M-effect) operates via pi bonds and conjugated systems through electron delocalization — it is stronger and longer-range. I-effect dominates in saturated systems (e.g. alkyl halides). M-effect dominates in conjugated or aromatic systems (e.g. aniline, phenol). In competition, M-effect generally wins in conjugated systems.',
      true, 5, NOW() - INTERVAL '3 days')
  `);
  await db.execute(sql`
    UPDATE doubts SET is_resolved = true, status = 'resolved', answer_count = 1, updated_at = NOW() WHERE id = ${doubt2Id}
  `);
  created.push("2 doubts (Physics: circular motion — open; Chemistry: inductive/mesomeric — resolved with teacher answer)");

  // ── Fee records — JEE batch (paid) + NEET context (upcoming) ─────────────
  await db.execute(sql`
    INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, paid_date, status, payment_method, transaction_ref, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, 'April–June 2026 (JEE Mains)', 11250, 11250, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'paid', 'online', 'REC-DEMO-001', 'Q1 2026 JEE tuition fee — paid in full. Receipt issued.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days')
  `);
  const nextDue = new Date(); nextDue.setDate(nextDue.getDate() + 30);
  await db.execute(sql`
    INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, 'July–September 2026 (JEE Mains)', 11250, 0, ${nextDue.toISOString()}, 'due', 'Q2 2026 JEE tuition fee — due in 30 days. Pay via UPI or cash at office.', NOW(), NOW())
  `);
  created.push("2 fee records — Q1 JEE paid (REC-DEMO-001, ₹11,250), Q2 JEE upcoming (₹11,250 due in 30 days)");

  // ── Enquiry ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO enquiries (id, name, phone, email, course_interest, message, source, admission_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Test Parent (Enquiry)', '+91-9000000001', 'test.parent@example.com', 'JEE Mains',
      'I would like to enquire about JEE Mains 2026 coaching for my daughter who is currently in Class 11. Please share fee structure, batch timings, faculty details, and past year results.',
      'website', 'new', NOW(), NOW())
  `);
  created.push("1 enquiry: Test Parent — JEE Mains 2026 coaching interest");

  return { created, skipped: false };
}
