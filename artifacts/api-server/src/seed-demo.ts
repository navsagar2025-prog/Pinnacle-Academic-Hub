import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface SeedDemoResult {
  created: string[];
  skipped: boolean;
}

export async function seedDemo(): Promise<SeedDemoResult> {
  const created: string[] = [];

  const existing = await db.execute(sql`
    SELECT id FROM users WHERE email = 'demo.student@pinnacle.test' LIMIT 1
  `);
  if (existing.rows.length > 0) {
    return { created: [], skipped: true };
  }

  const adminRows = await db.execute(sql`
    SELECT id FROM users WHERE role = 'admin' LIMIT 1
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

  const studentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_student', 'Aryan Sharma', 'demo.student@pinnacle.test', '+91-9876543210', 'student', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const studentUserId = studentUser.rows[0].id as string;
  created.push("Demo student user: Aryan Sharma");

  const parentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_parent', 'Ramesh Sharma', 'demo.parent@pinnacle.test', '+91-9876543211', 'parent', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const parentUserId = parentUser.rows[0].id as string;
  created.push("Demo parent user: Ramesh Sharma");

  const teacherUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_teacher', 'Priya Mehta', 'demo.teacher@pinnacle.test', '+91-9876543212', 'teacher', 'approved', NOW(), NOW())
    RETURNING id
  `);
  const teacherUserId = teacherUser.rows[0].id as string;
  created.push("Demo teacher user: Priya Mehta");

  const teacherRow = await db.execute(sql`
    INSERT INTO teachers (id, user_id, designation, qualification, subjects, experience_years, bio, initials, is_examiner, is_active, joined_at, updated_at)
    VALUES (gen_random_uuid(), ${teacherUserId}, 'Senior Faculty', 'M.Sc Physics, B.Ed', ARRAY['Physics','Mathematics','Biology'], 8, 'Expert JEE/NEET faculty with 8+ years experience at Pinnacle.', 'PM', true, true, NOW(), NOW())
    RETURNING id
  `);
  const teacherId = teacherRow.rows[0].id as string;
  created.push("Demo teacher profile: Priya Mehta");

  const jeeCourse = await db.execute(sql`
    INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo-jee-mains-2026', 'JEE Mains 2026', 'Comprehensive JEE Mains preparation covering Physics, Chemistry, and Mathematics with daily practice tests.', 'JEE', 45000, 2000, 35, 'Class 11-12 students', ARRAY['Daily practice tests','Expert faculty','Doubt sessions','Mock tests every fortnight'], true, NOW(), NOW())
    RETURNING id
  `);
  const jeeCourseId = jeeCourse.rows[0].id as string;
  created.push("Course: JEE Mains 2026");

  const neetCourse = await db.execute(sql`
    INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo-neet-2026', 'NEET UG 2026', 'Complete NEET preparation with Biology, Physics, and Chemistry — NCERT-focused approach.', 'NEET', 42000, 2000, 35, 'Class 11-12 students', ARRAY['NCERT deep-dive','Biology mastery','Weekly tests','Diagrams & mnemonics'], true, NOW(), NOW())
    RETURNING id
  `);
  const neetCourseId = neetCourse.rows[0].id as string;
  created.push("Course: NEET UG 2026");

  const jeeBatch = await db.execute(sql`
    INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeCourseId}, 'JEE Mains — Morning Batch', '7:00 AM – 9:00 AM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 101', NOW(), NOW())
    RETURNING id
  `);
  const jeeBatchId = jeeBatch.rows[0].id as string;
  created.push("Batch: JEE Mains Morning Batch");

  const neetBatch = await db.execute(sql`
    INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
    VALUES (gen_random_uuid(), ${neetCourseId}, 'NEET — Evening Batch', '4:00 PM – 6:00 PM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 202', NOW(), NOW())
    RETURNING id
  `);
  const neetBatchId = neetBatch.rows[0].id as string;
  created.push("Batch: NEET Evening Batch");

  const studentRow = await db.execute(sql`
    INSERT INTO students (id, user_id, batch_id, roll_number, guardian_name, guardian_phone, fee_plan, enrolled_at, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentUserId}, ${jeeBatchId}, 'DEMO-001', 'Ramesh Sharma', '+91-9876543211', 'annual', NOW(), true, NOW(), NOW())
    RETURNING id
  `);
  const studentId = studentRow.rows[0].id as string;
  created.push("Student record: Aryan Sharma (roll: DEMO-001, JEE batch)");

  await db.execute(sql`
    INSERT INTO parents (id, user_id, student_id, relation, created_at, updated_at)
    VALUES (gen_random_uuid(), ${parentUserId}, ${studentId}, 'Father', NOW(), NOW())
  `);
  created.push("Parent record: Ramesh Sharma (Father)");

  const scheduleEntries = [
    { day: 1, subject: 'Physics',     topic: 'Mechanics',           start: '07:00', end: '09:00' },
    { day: 2, subject: 'Chemistry',   topic: 'Physical Chemistry',   start: '07:00', end: '09:00' },
    { day: 3, subject: 'Physics',     topic: 'Electrostatics',       start: '07:00', end: '09:00' },
    { day: 4, subject: 'Mathematics', topic: 'Calculus',             start: '07:00', end: '09:00' },
    { day: 5, subject: 'Physics',     topic: 'Optics',               start: '07:00', end: '09:00' },
  ];
  for (const s of scheduleEntries) {
    await db.execute(sql`
      INSERT INTO schedules (id, batch_id, teacher_id, subject, topic, day_of_week, start_time, end_time, is_recurring, created_at, updated_at)
      VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherId}, ${s.subject}, ${s.topic}, ${s.day}, ${s.start}, ${s.end}, true, NOW(), NOW())
    `);
  }
  created.push("5 schedule entries (Mon–Fri, Physics/Chemistry/Maths)");

  let attendanceCount = 0;
  const statuses = ['present','present','present','present','present','present','present','present','late','absent'];
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
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
  created.push(`${attendanceCount} attendance records (last 30 weekdays, ~80% present)`);

  const materials = [
    { title: 'Kinematics — Complete Notes',          subject: 'Physics',     type: 'notes',    url: 'https://example.com/demo/kinematics-notes.pdf',      size: '2.4 MB' },
    { title: 'Organic Chemistry — Reaction Summary', subject: 'Chemistry',   type: 'formula',  url: 'https://example.com/demo/org-chem-reactions.pdf',    size: '1.8 MB' },
    { title: 'Integration Practice Set',             subject: 'Mathematics', type: 'exercise', url: 'https://example.com/demo/integration-practice.pdf',  size: '3.1 MB' },
  ];
  for (const m of materials) {
    await db.execute(sql`
      INSERT INTO study_materials (id, batch_id, uploaded_by, title, subject, type, file_url, file_size, is_visible, created_at, updated_at)
      VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, ${m.title}, ${m.subject}, ${m.type}, ${m.url}, ${m.size}, true, NOW(), NOW())
    `);
  }
  created.push("3 study materials (notes, formula sheet, exercise set)");

  const classDatePast7 = new Date(); classDatePast7.setDate(classDatePast7.getDate() - 7);
  const classDatePast14 = new Date(); classDatePast14.setDate(classDatePast14.getDate() - 14);
  await db.execute(sql`
    INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ARRAY[${jeeBatchId}::uuid], 'Kinematics — Lecture 1: Motion in a Straight Line', 'Physics', 'Priya Mehta', 'https://zoom.us/rec/demo-kinematics-lec1', 'zoom', ${classDatePast7.toISOString()}, 90, true, 14, ${teacherUserId}, NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ARRAY[${jeeBatchId}::uuid], 'Cell Biology — Intro: Cell Structure and Function', 'Biology', 'Priya Mehta', 'https://zoom.us/rec/demo-cell-bio-lec1', 'zoom', ${classDatePast14.toISOString()}, 85, true, 22, ${teacherUserId}, NOW(), NOW())
  `);
  created.push("2 class recordings (Kinematics, Cell Biology)");

  type Q = {
    subject: string; topic: string; type: 'mcq' | 'numerical'; difficulty: string;
    text: string; optA?: string; optB?: string; optC?: string; optD?: string;
    correct: string; sol: string; exam: string[];
  };
  const questions: Q[] = [
    { subject: 'Physics',   topic: 'Kinematics',       type: 'mcq',       difficulty: 'medium', text: 'A body starts from rest and accelerates uniformly. The ratio of distances covered in 1st, 2nd, and 3rd seconds is:', optA: '1:2:3', optB: '1:3:5', optC: '1:4:9', optD: '2:4:6', correct: 'B', sol: 'For uniform acceleration from rest, distances in successive seconds are in ratio 1:3:5 (odd numbers).', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics',   topic: 'Laws of Motion',   type: 'mcq',       difficulty: 'easy',   text: 'A 10 kg block on a frictionless surface has 20 N applied horizontally. Its acceleration is:', optA: '1 m/s²', optB: '2 m/s²', optC: '0.5 m/s²', optD: '10 m/s²', correct: 'B', sol: 'F = ma → a = 20/10 = 2 m/s².', exam: ['JEE_MAIN'] },
    { subject: 'Physics',   topic: 'Work & Energy',    type: 'mcq',       difficulty: 'medium', text: 'A spring of constant k stretched by x. Work done is:', optA: 'kx', optB: 'kx²', optC: '½kx²', optD: '2kx²', correct: 'C', sol: 'Work done in stretching a spring = ½kx².', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics',   topic: 'Electrostatics',   type: 'mcq',       difficulty: 'hard',   text: 'Two charges +q and –q placed 2r apart. Electric field at midpoint has magnitude:', optA: '0', optB: 'kq/r²', optC: '2kq/r²', optD: '4kq/r²', correct: 'D', sol: 'At midpoint both fields point towards –q. Each = kq/r². Total = 4kq/r².', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics',   topic: 'Waves',            type: 'mcq',       difficulty: 'medium', text: 'Frequency doubles with speed constant. Wavelength:', optA: 'Doubles', optB: 'Halves', optC: 'Same', optD: 'Quadruples', correct: 'B', sol: 'v = fλ. v constant, f doubles → λ halves.', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics',   topic: 'Optics',           type: 'mcq',       difficulty: 'medium', text: 'Convex lens f=20 cm, real image at v=60 cm. Object distance is:', optA: '15 cm', optB: '30 cm', optC: '40 cm', optD: '20 cm', correct: 'B', sol: '1/f = 1/v – 1/u → 1/20 = 1/60 – 1/u → u = –30 cm.', exam: ['JEE_MAIN'] },
    { subject: 'Physics',   topic: 'Thermodynamics',   type: 'mcq',       difficulty: 'hard',   text: 'In adiabatic process, work done by gas equals:', optA: 'Zero', optB: 'Decrease in internal energy', optC: 'Increase in enthalpy', optD: 'Heat added', correct: 'B', sol: 'Q=0, so W = –ΔU = decrease in internal energy.', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics',   topic: 'Modern Physics',   type: 'mcq',       difficulty: 'hard',   text: 'de Broglie wavelength is inversely proportional to:', optA: 'Mass', optB: 'Velocity', optC: 'Momentum', optD: 'KE', correct: 'C', sol: 'λ = h/p — inversely proportional to momentum.', exam: ['JEE_MAIN','JEE_ADVANCED'] },
    { subject: 'Physics',   topic: 'Gravitation',      type: 'mcq',       difficulty: 'medium', text: "Earth's escape velocity is approximately:", optA: '7.9 km/s', optB: '11.2 km/s', optC: '3.0 km/s', optD: '25.0 km/s', correct: 'B', sol: 'v_esc = √(2GM/R) ≈ 11.2 km/s for Earth.', exam: ['JEE_MAIN','NEET'] },
    { subject: 'Physics',   topic: 'Kinematics',       type: 'numerical', difficulty: 'medium', text: 'Ball thrown up at 20 m/s. Maximum height in metres? (g=10)', correct: '20', sol: 'h = v²/2g = 400/20 = 20 m.', exam: ['JEE_MAIN'] },
    { subject: 'Biology',   topic: 'Cell Biology',     type: 'mcq',       difficulty: 'easy',   text: 'Organelle called "powerhouse of the cell":', optA: 'Nucleus', optB: 'Ribosome', optC: 'Mitochondria', optD: 'Golgi', correct: 'C', sol: 'Mitochondria produce ATP → powerhouse.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Genetics',         type: 'mcq',       difficulty: 'medium', text: "Mendel's monohybrid F2 phenotypic ratio:", optA: '1:1', optB: '1:2:1', optC: '3:1', optD: '9:3:3:1', correct: 'C', sol: '3 dominant : 1 recessive.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Photosynthesis',   type: 'mcq',       difficulty: 'medium', text: 'Primary CO₂ acceptor in Calvin cycle:', optA: 'RuBP', optB: 'PGA', optC: 'PGAL', optD: 'OAA', correct: 'A', sol: 'Ribulose-1,5-bisphosphate (RuBP) accepts CO₂.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Human Physiology', type: 'mcq',       difficulty: 'easy',   text: '"Universal donor" blood group:', optA: 'A', optB: 'B', optC: 'AB', optD: 'O', correct: 'D', sol: 'O– lacks A, B, and Rh antigens — universal donor.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Ecology',          type: 'mcq',       difficulty: 'medium', text: 'Mycorrhizae and plant root relationship:', optA: 'Parasitism', optB: 'Commensalism', optC: 'Mutualism', optD: 'Amensalism', correct: 'C', sol: 'Both benefit — mutualism.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Reproduction',     type: 'mcq',       difficulty: 'medium', text: 'NOT a method of vegetative propagation:', optA: 'Budding', optB: 'Grafting', optC: 'Layering', optD: 'Conjugation', correct: 'D', sol: 'Conjugation is bacterial gene transfer, not plant vegetative propagation.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Cell Biology',     type: 'mcq',       difficulty: 'easy',   text: 'Organelle that synthesises proteins:', optA: 'Lysosome', optB: 'Ribosome', optC: 'Centrosome', optD: 'Vacuole', correct: 'B', sol: 'Ribosomes are the site of translation.', exam: ['NEET','CBSE_BOARDS'] },
    { subject: 'Biology',   topic: 'Ecology',          type: 'mcq',       difficulty: 'hard',   text: 'Primary productivity is highest in which ecosystem?', optA: 'Desert', optB: 'Tundra', optC: 'Tropical rainforest', optD: 'Grassland', correct: 'C', sol: 'Tropical rainforests have the highest primary productivity due to high sunlight and rainfall.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Genetics',         type: 'numerical', difficulty: 'hard',   text: 'Population 1000, freq(A)=0.6. Expected homozygous recessive (aa) individuals (Hardy-Weinberg):', correct: '160', sol: 'q=0.4, q²=0.16, 0.16×1000=160.', exam: ['NEET'] },
    { subject: 'Biology',   topic: 'Human Physiology', type: 'numerical', difficulty: 'medium', text: 'Normal body temp 98.6°F in Celsius (nearest whole number):', correct: '37', sol: 'C=(F-32)×5/9 = 66.6×5/9 ≈ 37°C.', exam: ['NEET'] },
  ];

  for (const q of questions) {
    if (q.type === 'mcq') {
      await db.execute(sql`
        INSERT INTO question_bank.question_bank
          (id, subject, topic, difficulty, question_type, question_text, options, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
        VALUES (
          gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, ${q.type},
          ${q.text},
          ${JSON.stringify({ A: q.optA, B: q.optB, C: q.optC, D: q.optD })}::jsonb,
          ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL',
          ${q.exam}::text[], NOW(), NOW()
        )
      `);
    } else {
      await db.execute(sql`
        INSERT INTO question_bank.question_bank
          (id, subject, topic, difficulty, question_type, question_text, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
        VALUES (
          gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, ${q.type},
          ${q.text}, ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL',
          ${q.exam}::text[], NOW(), NOW()
        )
      `);
    }
  }
  created.push(`${questions.length} questions in question bank (Physics & Biology, MCQ + numerical)`);

  const mockTest = await db.execute(sql`
    INSERT INTO mock_tests (id, title, subject, exam_type, batch_id, duration_minutes, marks_per_question, negative_marking_percent, instructions, is_published, is_public, created_by, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Demo Full Mock Test — JEE Pattern', 'Mixed', 'JEE_MAIN', ${jeeBatchId}, 60, 4, 25,
      'Read each question carefully. Attempt all sections. –1 mark for wrong MCQ answers. No penalty for numerical questions.',
      true, false, ${adminId}, NOW(), NOW())
    RETURNING id
  `);
  const mockTestId = mockTest.rows[0].id as string;

  const sec1 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Physics', 1, 'Questions 1–10 cover Physics topics.', NOW())
    RETURNING id
  `);
  const sec2 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Biology', 2, 'Questions 11–20 cover Biology topics.', NOW())
    RETURNING id
  `);
  const sec1Id = sec1.rows[0].id as string;
  const sec2Id = sec2.rows[0].id as string;

  const physicsQs = questions.filter(q => q.subject === 'Physics');
  const bioQs = questions.filter(q => q.subject === 'Biology');

  let qNum = 1;
  for (const q of physicsQs) {
    if (q.type === 'mcq') {
      await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, ${q.type}, ${q.optA ?? null}, ${q.optB ?? null}, ${q.optC ?? null}, ${q.optD ?? null}, ${q.correct}, ${q.topic}, ${q.sol}, NOW())
      `);
    } else {
      await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, ${q.type}, ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
      `);
    }
    qNum++;
  }
  for (const q of bioQs) {
    if (q.type === 'mcq') {
      await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, ${q.type}, ${q.optA ?? null}, ${q.optB ?? null}, ${q.optC ?? null}, ${q.optD ?? null}, ${q.correct}, ${q.topic}, ${q.sol}, NOW())
      `);
    } else {
      await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, ${q.type}, ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
      `);
    }
    qNum++;
  }
  created.push(`Mock test: "${await db.execute(sql`SELECT title FROM mock_tests WHERE id = ${mockTestId}`).then(r => r.rows[0].title)}" — 2 sections (${physicsQs.length} Physics + ${bioQs.length} Biology questions)`);

  const attemptStart = new Date(); attemptStart.setDate(attemptStart.getDate() - 2);
  const attemptEnd = new Date(attemptStart.getTime() + 55 * 60 * 1000);
  await db.execute(sql`
    INSERT INTO mock_test_attempts (id, test_id, student_id, started_at, submitted_at, total_questions, attempted_count, correct_count, wrong_count, score, max_score, time_spent_seconds, is_completed)
    VALUES (gen_random_uuid(), ${mockTestId}, ${studentId}, ${attemptStart.toISOString()}, ${attemptEnd.toISOString()}, 20, 18, 12, 6, 48, 80, 3300, true)
  `);
  created.push("Mock test attempt: 12/18 correct, score 48/80 (60%)");

  const dueIn7 = new Date(); dueIn7.setDate(dueIn7.getDate() + 7);
  const dueYesterday = new Date(); dueYesterday.setDate(dueYesterday.getDate() - 1);
  const due2WeeksAgo = new Date(); due2WeeksAgo.setDate(due2WeeksAgo.getDate() - 14);
  const posted3WeeksAgo = new Date(); posted3WeeksAgo.setDate(posted3WeeksAgo.getDate() - 21);

  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Kinematics Problem Set', 'Physics', 'Solve 20 problems on kinematics — projectile, relative motion, graphs. Show full working.', ${dueIn7.toISOString()}, 40, true, NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Organic Chemistry Reactions', 'Chemistry', 'Write and balance 15 named reactions with mechanisms (Aldol, Cannizzaro, Sandmeyer etc.).', ${dueYesterday.toISOString()}, 30, true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days')
  `);
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${jeeBatchId}, ${teacherUserId}, 'Integration Practice Worksheet', 'Mathematics', 'Complete all definite and indefinite integration problems. Substitution and by-parts required.', ${due2WeeksAgo.toISOString()}, 50, true, ${posted3WeeksAgo.toISOString()}, ${posted3WeeksAgo.toISOString()})
  `);
  created.push("3 assignments (pending, overdue, past-due with submission context)");

  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Unit Test Schedule — June 2026', 'Unit tests for all JEE and NEET batches will be conducted from June 15–20, 2026. Students must carry their admit cards and arrive 15 minutes early.', 'Academic', true, ${jeeBatchId}, NOW(), NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Fee Due Reminder — June 2026', 'Please clear your June quarter tuition fees by June 5th to avoid a 5% late charge. Contact the accounts office for payment plans or UPI details.', 'Fee', true, ${jeeBatchId}, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Annual Science Quiz 2026 — Registration Open', 'Pinnacle Annual Science Quiz 2026 registrations are now open! Prizes: ₹5000 / ₹3000 / ₹1500 for top 3. Register at the office before May 30.', 'Event', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
  `);
  created.push("3 notices (Academic, Fee, Event)");

  const doubt1 = await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, ${jeeBatchId}, 'Physics', 'Kinematics', 'In uniform circular motion, displacement for a complete revolution is zero — does this mean average velocity is always zero even if the object is moving continuously?', false, 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    RETURNING id
  `);
  const doubt2 = await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, ${jeeBatchId}, 'Chemistry', 'Organic Chemistry', 'What is the practical difference between inductive effect and mesomeric effect? When does each dominate in determining reactivity?', false, 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
    RETURNING id
  `);
  const doubt2Id = doubt2.rows[0].id as string;

  await db.execute(sql`
    INSERT INTO doubt_answers (id, doubt_id, author_id, author_role, answer_text, is_official, upvotes, created_at)
    VALUES (gen_random_uuid(), ${doubt2Id}, ${teacherUserId}, 'teacher',
      'Great question! Inductive effect (I-effect) operates through sigma bonds and depends on electronegativity — it is a permanent, distance-dependent effect. Mesomeric effect (M-effect) operates through pi bonds and conjugated systems via electron delocalization — it is stronger and longer-range. Inductive effect dominates in saturated systems (e.g. alkyl halides), while mesomeric effect dominates in conjugated or aromatic systems (e.g. aniline, phenol).',
      true, 4, NOW() - INTERVAL '3 days')
  `);
  await db.execute(sql`UPDATE doubts SET is_resolved = true, answer_count = 1, status = 'resolved', updated_at = NOW() WHERE id = ${doubt2Id}`);
  created.push("2 doubts (1 open, 1 answered and resolved by teacher)");

  await db.execute(sql`
    INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, paid_date, status, payment_method, transaction_ref, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, 'April–June 2026', 11250, 11250, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', 'paid', 'online', 'REC-DEMO-001', 'Q1 2026 tuition fee — paid in full.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days')
  `);
  const nextDue = new Date(); nextDue.setDate(nextDue.getDate() + 30);
  await db.execute(sql`
    INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), ${studentId}, 'July–September 2026', 11250, 0, ${nextDue.toISOString()}, 'due', 'Q2 2026 tuition fee — due in 30 days.', NOW(), NOW())
  `);
  created.push("2 fee records (paid REC-DEMO-001, upcoming Q2 due)");

  await db.execute(sql`
    INSERT INTO enquiries (id, name, phone, email, course_interest, message, source, admission_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Test Parent', '+91-9000000001', 'test.parent@example.com', 'JEE Mains', 'I would like to enquire about JEE Mains 2026 coaching for my daughter (currently in Class 11). Please share fee structure, batch timings, and faculty details.', 'website', 'new', NOW(), NOW())
  `);
  created.push("1 enquiry: Test Parent (JEE Mains interest)");

  return { created, skipped: false };
}
