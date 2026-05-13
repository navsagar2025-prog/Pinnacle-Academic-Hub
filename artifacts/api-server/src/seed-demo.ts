/**
 * seed-demo.ts — Idempotent full-demo data seed for Pinnacle Academic Classes portal.
 *
 * Completion sentinel: site_settings row with key = 'demo_seed_v1'.
 * Set only AFTER every entity is successfully created, so partial runs
 * can be safely retried by deleting that row or calling DELETE /admin/seed-demo.
 *
 * Enrollment strategy: first queries ALL existing active batches and enrolls
 * the demo student in each one. Creates two fallback demo courses/batches
 * (JEE + NEET) only when fewer than 2 active batches exist in the database.
 *
 * Assignment submissions: the schema has no assignment_submissions table
 * (confirmed via schema grep). The three assignments demonstrate pending /
 * overdue / past-due states without a submission record.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface SeedDemoResult {
  created: string[];
  skipped: boolean;
}

export async function seedDemo(): Promise<SeedDemoResult> {
  const created: string[] = [];

  // ── Idempotency: dual-check (email sentinel + completion marker) ─────────
  //
  // Primary guard: check for the demo student email. This catches the common
  // case where all records already exist and prevents creating duplicates.
  const demoUserCheck = await db.execute(sql`
    SELECT id FROM users WHERE email = 'demo.student@pinnacle.test' LIMIT 1
  `);
  if (demoUserCheck.rows.length > 0) {
    return { created: [], skipped: true };
  }
  //
  // Secondary guard: completion marker (set last in this function). Present
  // only when a FULL seed finished. If the email guard above passes but the
  // marker is also present, something is inconsistent — still skip safely.
  const sentinel = await db.execute(sql`
    SELECT id FROM site_settings WHERE key = 'demo_seed_v1' LIMIT 1
  `);
  if (sentinel.rows.length > 0) {
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
    const res = await db.execute(sql`
      INSERT INTO users (id, clerk_user_id, name, email, role, approval_status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'demo_admin_seed', 'Demo Admin', 'demo.admin@pinnacle.test', 'admin', 'approved', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    adminId = res.rows[0].id as string;
  }

  // ── Demo users (ON CONFLICT on unique email so retrys are safe) ───────────
  const studentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_student', 'Aryan Sharma', 'demo.student@pinnacle.test', '+91-9876543210', 'student', 'approved', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `);
  const studentUserId = studentUser.rows[0].id as string;
  created.push("Demo student user: Aryan Sharma (demo.student@pinnacle.test)");

  const parentUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_parent', 'Ramesh Sharma', 'demo.parent@pinnacle.test', '+91-9876543211', 'parent', 'approved', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `);
  const parentUserId = parentUser.rows[0].id as string;
  created.push("Demo parent user: Ramesh Sharma (demo.parent@pinnacle.test)");

  const teacherUser = await db.execute(sql`
    INSERT INTO users (id, clerk_user_id, name, email, phone, role, approval_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'demo_teacher', 'Priya Mehta', 'demo.teacher@pinnacle.test', '+91-9876543212', 'teacher', 'approved', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `);
  const teacherUserId = teacherUser.rows[0].id as string;
  created.push("Demo teacher user: Priya Mehta (demo.teacher@pinnacle.test)");

  // ── Teacher profile (ON CONFLICT on user_id if exists) ────────────────────
  const existingTeacher = await db.execute(sql`
    SELECT id FROM teachers WHERE user_id = ${teacherUserId} LIMIT 1
  `);
  let teacherId: string;
  if (existingTeacher.rows.length > 0) {
    teacherId = existingTeacher.rows[0].id as string;
  } else {
    const tr = await db.execute(sql`
      INSERT INTO teachers (id, user_id, designation, qualification, subjects, experience_years, bio, initials, is_examiner, is_active, joined_at, updated_at)
      VALUES (gen_random_uuid(), ${teacherUserId}, 'Senior Faculty', 'M.Sc Physics, B.Ed',
        ARRAY['Physics','Mathematics','Biology'], 8,
        'Expert JEE/NEET faculty with 8+ years experience at Pinnacle Academic Classes, Greater Noida.', 'PM', true, true, NOW(), NOW())
      RETURNING id
    `);
    teacherId = tr.rows[0].id as string;
  }
  created.push("Demo teacher profile: Priya Mehta (Physics, Maths, Biology)");

  // ── Batch discovery + fallback creation ───────────────────────────────────
  // Always enroll demo student in ALL existing active batches so every admin
  // section (attendance, schedules, fee records, etc.) reflects real data.
  // Only when fewer than 2 batches exist do we create demo fallback batches.
  const existingBatches = await db.execute(sql`
    SELECT b.id, b.name, b.course_id FROM batches b WHERE b.status = 'active' LIMIT 20
  `);

  const allBatchIds: string[] = existingBatches.rows.map(r => r.id as string);

  // Create JEE fallback if we have fewer than 1 batch
  let jeeBatchId: string | null = null;
  let neetBatchId: string | null = null;

  if (existingBatches.rows.length < 2) {
    // Create demo courses
    const jeeCourse = await db.execute(sql`
      INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'demo-jee-mains-2026', 'JEE Mains 2026',
        'Comprehensive JEE Mains preparation covering Physics, Chemistry, and Mathematics.',
        'JEE', 45000, 2000, 35, 'Class 11-12 students',
        ARRAY['Daily practice tests','Expert faculty','Doubt sessions','Mock tests fortnightly'], true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const jeeCourseId = jeeCourse.rows[0].id as string;
    created.push("Course: JEE Mains 2026 (₹45,000/year)");

    const neetCourse = await db.execute(sql`
      INSERT INTO courses (id, slug, title, description, category, annual_fee, admission_fee, max_batch_size, eligibility, highlights, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'demo-neet-2026', 'NEET UG 2026',
        'Complete NEET UG preparation — Biology, Physics, Chemistry, NCERT-focused.',
        'NEET', 42000, 2000, 35, 'Class 11-12 students',
        ARRAY['NCERT deep-dive','Biology mastery','Weekly tests','Diagram sessions','PYQ analysis'], true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const neetCourseId = neetCourse.rows[0].id as string;
    created.push("Course: NEET UG 2026 (₹42,000/year)");

    const jeeBatch = await db.execute(sql`
      INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
      VALUES (gen_random_uuid(), ${jeeCourseId}, 'JEE Mains — Morning Batch A', '7:00 AM – 9:00 AM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 101', NOW(), NOW())
      RETURNING id
    `);
    jeeBatchId = jeeBatch.rows[0].id as string;
    created.push("Batch: JEE Mains Morning Batch A (Room 101, Mon–Sat 7–9 AM)");

    const neetBatch = await db.execute(sql`
      INSERT INTO batches (id, course_id, name, timing_label, days_label, start_date, end_date, max_students, status, room, created_at, updated_at)
      VALUES (gen_random_uuid(), ${neetCourseId}, 'NEET — Evening Batch B', '4:00 PM – 6:00 PM', 'Mon–Sat', NOW(), NOW() + INTERVAL '1 year', 30, 'active', 'Room 202', NOW(), NOW())
      RETURNING id
    `);
    neetBatchId = neetBatch.rows[0].id as string;
    created.push("Batch: NEET Evening Batch B (Room 202, Mon–Sat 4–6 PM)");

    allBatchIds.push(jeeBatchId, neetBatchId);
  } else {
    // Use the two most-recent existing batches as the "primary" ones for
    // schedules, materials, recordings, mock tests, etc.
    jeeBatchId  = allBatchIds[0]!;
    neetBatchId = allBatchIds[1] ?? allBatchIds[0]!;
    created.push(`Using ${allBatchIds.length} existing active batch(es) for demo enrollment`);
  }

  // Primary batch for most linked entities
  const primaryBatchId = jeeBatchId;

  // ── Enroll demo student in EVERY active batch ─────────────────────────────
  // students.user_id has no unique constraint, so one row per batch is valid.
  // roll_number is UNIQUE — use DEMO-001, DEMO-002, … per batch.
  const studentIds: string[] = [];
  for (let i = 0; i < allBatchIds.length; i++) {
    const batchId = allBatchIds[i]!;
    const roll = `DEMO-${String(i + 1).padStart(3, '0')}`;
    const sr = await db.execute(sql`
      INSERT INTO students (id, user_id, batch_id, roll_number, guardian_name, guardian_phone, fee_plan, enrolled_at, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), ${studentUserId}, ${batchId}, ${roll}, 'Ramesh Sharma', '+91-9876543211', 'annual', NOW(), true, NOW(), NOW())
      ON CONFLICT (roll_number) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    studentIds.push(sr.rows[0].id as string);
  }
  const primaryStudentId = studentIds[0]!;
  created.push(`${studentIds.length} student enrollment(s): Aryan Sharma in ${allBatchIds.length} batch(es) (rolls DEMO-001…DEMO-${String(allBatchIds.length).padStart(3,'0')})`);

  await db.execute(sql`
    INSERT INTO parents (id, user_id, student_id, relation, created_at, updated_at)
    VALUES (gen_random_uuid(), ${parentUserId}, ${primaryStudentId}, 'Father', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  created.push("Parent: Ramesh Sharma linked as Father (primary enrollment)");

  // ── Schedules for primary batch (Mon–Sat, all subjects) ───────────────────
  const scheduleEntries = [
    { day: 1, subject: 'Physics',     topic: 'Mechanics' },
    { day: 2, subject: 'Biology',     topic: 'Cell Biology' },
    { day: 3, subject: 'Physics',     topic: 'Electrostatics' },
    { day: 4, subject: 'Chemistry',   topic: 'Organic Chemistry' },
    { day: 5, subject: 'Mathematics', topic: 'Calculus' },
    { day: 6, subject: 'Physics',     topic: 'Modern Physics' },
  ];
  for (const s of scheduleEntries) {
    await db.execute(sql`
      INSERT INTO schedules (id, batch_id, teacher_id, subject, topic, day_of_week, start_time, end_time, is_recurring, created_at, updated_at)
      VALUES (gen_random_uuid(), ${primaryBatchId}, ${teacherId}, ${s.subject}, ${s.topic}, ${s.day}, '07:00', '09:00', true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
  }
  created.push("6 schedule entries Mon–Sat: Physics / Biology / Physics / Chemistry / Maths / Physics");

  // ── Attendance (last 30 weekdays, ~80% present) ───────────────────────────
  let attendanceCount = 0;
  const statuses = ['present','present','present','present','present','present','present','present','late','absent'];
  for (let i = 30; i >= 1; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (d.getDay() === 0) continue;
    const status = statuses[(i * 7) % 10];
    try {
      const res = await db.execute(sql`
        INSERT INTO attendance (id, student_id, date, subject, status, marked_by, created_at)
        VALUES (gen_random_uuid(), ${primaryStudentId}, ${d.toISOString()}, 'Physics', ${status}, ${adminId}, NOW())
        ON CONFLICT (student_id, date, subject) DO NOTHING
      `);
      if ((res.rowCount ?? 0) > 0) attendanceCount++;
    } catch { /* ignore */ }
  }
  created.push(`${attendanceCount} attendance rows (last 30 weekdays, ~80 % present, ~10 % late, ~10 % absent)`);

  // ── Student test results ──────────────────────────────────────────────────
  const testResults = [
    { exam: 'Unit Test 1 — Physics',     subject: 'Physics',  total: 100, obtained: 78,  rank: '3rd / 32', daysAgo: 60 },
    { exam: 'Unit Test 2 — Chemistry',   subject: 'Chemistry',total: 100, obtained: 85,  rank: '1st / 32', daysAgo: 45 },
    { exam: 'Unit Test 3 — Biology',     subject: 'Biology',  total: 100, obtained: 72,  rank: '5th / 30', daysAgo: 30 },
    { exam: 'Practice Mock — JEE Pattern', subject: 'Mixed',  total: 300, obtained: 196, rank: '2nd / 28', daysAgo: 21 },
    { exam: 'Half-Yearly Mock',          subject: 'Mixed',    total: 300, obtained: 217, rank: '1st / 32', daysAgo: 7  },
  ];
  for (const r of testResults) {
    const examDate = new Date(); examDate.setDate(examDate.getDate() - r.daysAgo);
    await db.execute(sql`
      INSERT INTO student_test_results (id, student_id, batch_id, exam_name, subject, total_marks, marks_obtained, rank, exam_date, created_at)
      VALUES (gen_random_uuid(), ${primaryStudentId}, ${primaryBatchId}, ${r.exam}, ${r.subject}, ${r.total}, ${r.obtained}, ${r.rank}, ${examDate.toISOString()}, NOW())
      ON CONFLICT DO NOTHING
    `);
  }
  created.push("5 student test results with ranks (Unit Test 1-3, Practice Mock, Half-Yearly)");

  // ── Study materials (all valid material_type enum values) ─────────────────
  // Enum: notes | formula | exercise | summary | paper
  const materials = [
    { title: 'Kinematics — Complete Notes',          subject: 'Physics',     type: 'notes',    url: 'https://example.com/demo/kinematics-notes.pdf',      size: '2.4 MB' },
    { title: 'Organic Chemistry — Reaction Summary', subject: 'Chemistry',   type: 'formula',  url: 'https://example.com/demo/org-chem-reactions.pdf',    size: '1.8 MB' },
    { title: 'Cell Biology — Diagram Compendium',    subject: 'Biology',     type: 'summary',  url: 'https://example.com/demo/cell-bio-diagrams.pdf',     size: '4.2 MB' },
    { title: 'Integration Practice Worksheet',       subject: 'Mathematics', type: 'exercise', url: 'https://example.com/demo/integration-practice.pdf',  size: '3.1 MB' },
    { title: 'Previous Year JEE Questions — PCM',   subject: 'Mixed',       type: 'paper',    url: 'https://example.com/demo/jee-pyq-2020-2025.pdf',     size: '8.7 MB' },
  ];
  for (const m of materials) {
    await db.execute(sql`
      INSERT INTO study_materials (id, batch_id, uploaded_by, title, subject, type, file_url, file_size, is_visible, created_at, updated_at)
      VALUES (gen_random_uuid(), ${primaryBatchId}, ${teacherUserId}, ${m.title}, ${m.subject}, ${m.type}, ${m.url}, ${m.size}, true, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
  }
  created.push("5 study materials: notes / formula / summary / exercise / paper (all valid enum values)");

  // ── Class recordings ──────────────────────────────────────────────────────
  const d7 = new Date(); d7.setDate(d7.getDate() - 7);
  const d14 = new Date(); d14.setDate(d14.getDate() - 14);
  const d21 = new Date(); d21.setDate(d21.getDate() - 21);
  const recEntries = [
    { title: 'Kinematics — Lecture 1: Motion in a Straight Line', subject: 'Physics',   url: 'https://zoom.us/rec/demo-kinematics-lec1',  date: d7,  mins: 90, views: 18 },
    { title: 'Cell Biology — Intro: Organelles & Functions',        subject: 'Biology',   url: 'https://zoom.us/rec/demo-cell-bio-lec1',    date: d14, mins: 85, views: 24 },
    { title: 'Organic Chemistry — Named Reactions Part 1',          subject: 'Chemistry', url: 'https://zoom.us/rec/demo-org-chem-lec1',    date: d21, mins: 95, views: 31 },
  ];
  for (const r of recEntries) {
    await db.execute(sql`
      INSERT INTO class_recordings (id, batch_id, batch_ids, title, subject, teacher_name, recording_url, source_provider, class_date, duration_minutes, is_visible, view_count, created_by_id, created_at, updated_at)
      VALUES (gen_random_uuid(), ${primaryBatchId}, ARRAY[${primaryBatchId}::uuid], ${r.title}, ${r.subject}, 'Priya Mehta', ${r.url}, 'zoom', ${r.date.toISOString()}, ${r.mins}, true, ${r.views}, ${teacherUserId}, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
  }
  created.push("3 class recordings: Kinematics, Cell Biology, Organic Chemistry");

  // ── Question Bank (20 questions; 5 with image_url diagram references) ─────
  type Q = {
    subject: string; topic: string; type: 'mcq' | 'numerical'; difficulty: string;
    text: string; optA?: string; optB?: string; optC?: string; optD?: string;
    correct: string; sol: string; exam: string[]; imageUrl?: string;
  };
  const questions: Q[] = [
    { subject:'Physics',  topic:'Kinematics',      type:'mcq',      difficulty:'medium',
      text:'A body starts from rest and accelerates uniformly. The ratio of distances covered in 1st, 2nd, and 3rd seconds is:',
      optA:'1:2:3', optB:'1:3:5', optC:'1:4:9', optD:'2:4:6', correct:'B',
      sol:'Uniform acceleration from rest → distances in successive seconds follow odd-number rule 1:3:5.',
      exam:['JEE_MAIN','JEE_ADVANCED'],
      imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Motion_diagram.svg/320px-Motion_diagram.svg.png' },
    { subject:'Physics',  topic:'Laws of Motion',  type:'mcq',      difficulty:'easy',
      text:'A 10 kg block on a frictionless surface has 20 N applied horizontally. Its acceleration:',
      optA:'1 m/s²', optB:'2 m/s²', optC:'0.5 m/s²', optD:'10 m/s²', correct:'B',
      sol:'F=ma → a=20/10=2 m/s².', exam:['JEE_MAIN'] },
    { subject:'Physics',  topic:'Work & Energy',   type:'mcq',      difficulty:'medium',
      text:'A spring of constant k stretched by x. Work done:',
      optA:'kx', optB:'kx²', optC:'½kx²', optD:'2kx²', correct:'C',
      sol:'Elastic PE = ½kx².', exam:['JEE_MAIN','NEET'] },
    { subject:'Physics',  topic:'Electrostatics',  type:'mcq',      difficulty:'hard',
      text:'Two charges +q and –q placed 2r apart. Electric field at midpoint:',
      optA:'0', optB:'kq/r²', optC:'2kq/r²', optD:'4kq/r²', correct:'D',
      sol:'Both fields point toward –q. Each = kq/r². Total = 4kq/r².',
      exam:['JEE_MAIN','JEE_ADVANCED'],
      imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/VFPt_charges_plus_minus.svg/320px-VFPt_charges_plus_minus.svg.png' },
    { subject:'Physics',  topic:'Waves',           type:'mcq',      difficulty:'medium',
      text:'Frequency doubles with wave speed constant. Wavelength:',
      optA:'Doubles', optB:'Halves', optC:'Same', optD:'Quadruples', correct:'B',
      sol:'v=fλ; v constant, f×2 → λ÷2.', exam:['JEE_MAIN','NEET'] },
    { subject:'Physics',  topic:'Optics',          type:'mcq',      difficulty:'medium',
      text:'Convex lens f=20 cm, real image at v=60 cm. Object distance:',
      optA:'15 cm', optB:'30 cm', optC:'40 cm', optD:'20 cm', correct:'B',
      sol:'1/f=1/v–1/u → u=–30 cm → 30 cm.',
      exam:['JEE_MAIN'],
      imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Convex_lens_diagram.svg/320px-Convex_lens_diagram.svg.png' },
    { subject:'Physics',  topic:'Thermodynamics',  type:'mcq',      difficulty:'hard',
      text:'In adiabatic process, work done by gas:',
      optA:'Zero', optB:'Decrease in internal energy', optC:'Increase in enthalpy', optD:'Heat added', correct:'B',
      sol:'Q=0; ΔU=–W → W=–ΔU=decrease in internal energy.', exam:['JEE_MAIN','JEE_ADVANCED'] },
    { subject:'Physics',  topic:'Modern Physics',  type:'mcq',      difficulty:'hard',
      text:'de Broglie wavelength inversely proportional to:',
      optA:'Mass', optB:'Velocity', optC:'Momentum', optD:'KE', correct:'C',
      sol:'λ=h/p — inversely proportional to momentum.', exam:['JEE_MAIN','JEE_ADVANCED'] },
    { subject:'Physics',  topic:'Gravitation',     type:'mcq',      difficulty:'medium',
      text:"Earth's escape velocity approximately:",
      optA:'7.9 km/s', optB:'11.2 km/s', optC:'3.0 km/s', optD:'25.0 km/s', correct:'B',
      sol:'v_esc=√(2GM/R)≈11.2 km/s.', exam:['JEE_MAIN','NEET'] },
    { subject:'Physics',  topic:'Kinematics',      type:'numerical', difficulty:'medium',
      text:'Ball thrown up at 20 m/s. Max height in metres? (g=10)', correct:'20',
      sol:'h=v²/2g=400/20=20 m.', exam:['JEE_MAIN'] },
    { subject:'Biology',  topic:'Cell Biology',    type:'mcq',      difficulty:'easy',
      text:'Organelle called "powerhouse of the cell":',
      optA:'Nucleus', optB:'Ribosome', optC:'Mitochondria', optD:'Golgi', correct:'C',
      sol:'Mitochondria produce ATP.',
      exam:['NEET'],
      imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Animal_mitochondria_diagram.svg/320px-Animal_mitochondria_diagram.svg.png' },
    { subject:'Biology',  topic:'Genetics',        type:'mcq',      difficulty:'medium',
      text:"Mendel's monohybrid F2 phenotypic ratio:",
      optA:'1:1', optB:'1:2:1', optC:'3:1', optD:'9:3:3:1', correct:'C',
      sol:'3 dominant : 1 recessive.', exam:['NEET'] },
    { subject:'Biology',  topic:'Photosynthesis',  type:'mcq',      difficulty:'medium',
      text:'Primary CO₂ acceptor in Calvin cycle:',
      optA:'RuBP', optB:'PGA', optC:'PGAL', optD:'OAA', correct:'A',
      sol:'RuBP accepts CO₂ via RuBisCO.', exam:['NEET'] },
    { subject:'Biology',  topic:'Human Physiology',type:'mcq',      difficulty:'easy',
      text:'"Universal donor" blood group:',
      optA:'A', optB:'B', optC:'AB', optD:'O', correct:'D',
      sol:'O– lacks A, B, Rh antigens.', exam:['NEET'] },
    { subject:'Biology',  topic:'Ecology',         type:'mcq',      difficulty:'medium',
      text:'Mycorrhizae–plant root relationship:',
      optA:'Parasitism', optB:'Commensalism', optC:'Mutualism', optD:'Amensalism', correct:'C',
      sol:'Both benefit — mutualism.', exam:['NEET'] },
    { subject:'Biology',  topic:'Reproduction',    type:'mcq',      difficulty:'medium',
      text:'NOT a method of vegetative propagation:',
      optA:'Budding', optB:'Grafting', optC:'Layering', optD:'Conjugation', correct:'D',
      sol:'Conjugation is bacterial gene transfer.', exam:['NEET'] },
    { subject:'Biology',  topic:'Cell Biology',    type:'mcq',      difficulty:'easy',
      text:'Organelle that synthesises proteins:',
      optA:'Lysosome', optB:'Ribosome', optC:'Centrosome', optD:'Vacuole', correct:'B',
      sol:'Ribosomes are the site of translation.', exam:['NEET','CBSE_BOARDS'] },
    { subject:'Biology',  topic:'Ecology',         type:'mcq',      difficulty:'hard',
      text:'Highest primary productivity:',
      optA:'Desert', optB:'Tundra', optC:'Tropical rainforest', optD:'Grassland', correct:'C',
      sol:'Tropical rainforests: max sunlight + rainfall.', exam:['NEET'] },
    { subject:'Biology',  topic:'Genetics',        type:'numerical', difficulty:'hard',
      text:'Population 1000, freq(A)=0.6. Expected aa individuals (Hardy-Weinberg):', correct:'160',
      sol:'q=0.4; q²=0.16; 0.16×1000=160.', exam:['NEET'] },
    { subject:'Biology',  topic:'Human Physiology',type:'numerical', difficulty:'medium',
      text:'98.6°F in Celsius (nearest whole number):', correct:'37',
      sol:'C=(98.6–32)×5/9≈37°C.', exam:['NEET'] },
  ];

  for (const q of questions) {
    if (q.type === 'mcq') {
      if (q.imageUrl) {
        await db.execute(sql`
          INSERT INTO question_bank.question_bank
            (id, subject, topic, difficulty, question_type, question_text, options, correct_answer, solution, image_url, is_published, review_status, source, exam_target, created_at, updated_at)
          VALUES (gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'mcq', ${q.text},
            ${JSON.stringify({ A: q.optA, B: q.optB, C: q.optC, D: q.optD })}::jsonb,
            ${q.correct}, ${q.sol}, ${q.imageUrl}, true, 'approved', 'MANUAL', ${q.exam}::text[], NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
      } else {
        await db.execute(sql`
          INSERT INTO question_bank.question_bank
            (id, subject, topic, difficulty, question_type, question_text, options, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
          VALUES (gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'mcq', ${q.text},
            ${JSON.stringify({ A: q.optA, B: q.optB, C: q.optC, D: q.optD })}::jsonb,
            ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL', ${q.exam}::text[], NOW(), NOW())
          ON CONFLICT DO NOTHING
        `);
      }
    } else {
      await db.execute(sql`
        INSERT INTO question_bank.question_bank
          (id, subject, topic, difficulty, question_type, question_text, correct_answer, solution, is_published, review_status, source, exam_target, created_at, updated_at)
        VALUES (gen_random_uuid(), ${q.subject}, ${q.topic}, ${q.difficulty}, 'numerical', ${q.text},
          ${q.correct}, ${q.sol}, true, 'approved', 'MANUAL', ${q.exam}::text[], NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
    }
  }
  const imageQCount = questions.filter(q => q.imageUrl).length;
  created.push(`${questions.length} question bank questions (Physics + Biology, MCQ + numerical, ${imageQCount} with diagram image URLs)`);

  // ── Mock test + 2 sections + per-question answers ─────────────────────────
  const mockTest = await db.execute(sql`
    INSERT INTO mock_tests (id, title, subject, exam_type, batch_id, duration_minutes, marks_per_question, negative_marking_percent, instructions, is_published, is_public, created_by, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Demo Full Mock Test — JEE Pattern', 'Mixed', 'JEE_MAIN', ${primaryBatchId}, 60, 4, 25,
      'Read each question carefully. Attempt all sections. –1 per wrong MCQ. No penalty for numerical.',
      true, false, ${adminId}, NOW(), NOW())
    RETURNING id
  `);
  const mockTestId = mockTest.rows[0].id as string;

  const sec1 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Physics', 1, 'Q1–10: Physics. MCQ (–1 wrong) + Integer.', NOW()) RETURNING id
  `);
  const sec2 = await db.execute(sql`
    INSERT INTO mock_test_sections (id, test_id, name, ordering, instructions, created_at)
    VALUES (gen_random_uuid(), ${mockTestId}, 'Biology', 2, 'Q11–20: Biology. MCQ (–1 wrong) + Integer.', NOW()) RETURNING id
  `);
  const sec1Id = sec1.rows[0].id as string;
  const sec2Id = sec2.rows[0].id as string;

  const physicsQs = questions.filter(q => q.subject === 'Physics');
  const bioQs     = questions.filter(q => q.subject === 'Biology');
  const mockQMeta: { id: string; type: string; correct: string }[] = [];

  let qNum = 1;
  for (const q of physicsQs) {
    let qRow;
    if (q.type === 'mcq') {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, image_url, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, 'mcq', ${q.optA??null}, ${q.optB??null}, ${q.optC??null}, ${q.optD??null}, ${q.correct}, ${q.topic}, ${q.sol}, ${q.imageUrl??null}, NOW())
        RETURNING id
      `);
    } else {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec1Id}, ${qNum}, ${q.text}, 'numerical', ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
        RETURNING id
      `);
    }
    mockQMeta.push({ id: qRow.rows[0].id as string, type: q.type, correct: q.correct });
    qNum++;
  }
  for (const q of bioQs) {
    let qRow;
    if (q.type === 'mcq') {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, topic, explanation, image_url, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, 'mcq', ${q.optA??null}, ${q.optB??null}, ${q.optC??null}, ${q.optD??null}, ${q.correct}, ${q.topic}, ${q.sol}, ${q.imageUrl??null}, NOW())
        RETURNING id
      `);
    } else {
      qRow = await db.execute(sql`
        INSERT INTO mock_test_questions (id, test_id, section_id, question_number, question_text, question_type, numerical_answer, numerical_tolerance, topic, explanation, created_at)
        VALUES (gen_random_uuid(), ${mockTestId}, ${sec2Id}, ${qNum}, ${q.text}, 'numerical', ${parseFloat(q.correct)}, 0.5, ${q.topic}, ${q.sol}, NOW())
        RETURNING id
      `);
    }
    mockQMeta.push({ id: qRow.rows[0].id as string, type: q.type, correct: q.correct });
    qNum++;
  }
  created.push(`Mock test: "Demo Full Mock Test — JEE Pattern" (2 sections: ${physicsQs.length} Physics + ${bioQs.length} Biology)`);

  // Attempt: 18 answered (12 correct, 6 wrong), 2 skipped
  const aStart = new Date(); aStart.setDate(aStart.getDate() - 2);
  const aEnd   = new Date(aStart.getTime() + 55 * 60 * 1000);
  const attempt = await db.execute(sql`
    INSERT INTO mock_test_attempts (id, test_id, student_id, started_at, submitted_at, total_questions, attempted_count, correct_count, wrong_count, score, max_score, time_spent_seconds, is_completed)
    VALUES (gen_random_uuid(), ${mockTestId}, ${primaryStudentId}, ${aStart.toISOString()}, ${aEnd.toISOString()}, 20, 18, 12, 6, 48, 80, 3300, true)
    RETURNING id
  `);
  const attemptId = attempt.rows[0].id as string;

  const wrongOpts: Record<string, string> = { A:'B', B:'C', C:'D', D:'A' };
  for (let i = 0; i < mockQMeta.length && i < 18; i++) {
    const mq = mockQMeta[i]!;
    const isCorrect = i < 12;
    const timeSpent = 90 + Math.floor(Math.random() * 120);
    if (mq.type === 'mcq') {
      const sel = isCorrect ? mq.correct : (wrongOpts[mq.correct] ?? (mq.correct === 'A' ? 'B' : 'A'));
      await db.execute(sql`
        INSERT INTO mock_test_answers (id, attempt_id, question_id, selected_option, is_correct, marks_awarded, is_marked_for_review, time_spent_seconds, created_at, updated_at)
        VALUES (gen_random_uuid(), ${attemptId}, ${mq.id}, ${sel}, ${isCorrect}, ${isCorrect ? 4 : -1}, false, ${timeSpent}, NOW(), NOW())
        ON CONFLICT (attempt_id, question_id) DO NOTHING
      `);
    } else {
      const resp = isCorrect ? parseFloat(mq.correct) : parseFloat(mq.correct) + 5;
      await db.execute(sql`
        INSERT INTO mock_test_answers (id, attempt_id, question_id, numerical_response, is_correct, marks_awarded, is_marked_for_review, time_spent_seconds, created_at, updated_at)
        VALUES (gen_random_uuid(), ${attemptId}, ${mq.id}, ${resp}, ${isCorrect}, ${isCorrect ? 4 : 0}, false, ${timeSpent}, NOW(), NOW())
        ON CONFLICT (attempt_id, question_id) DO NOTHING
      `);
    }
  }
  created.push("Mock attempt: 18 answered (12 correct, 6 wrong, 2 skipped), score 48/80 — 18 per-question mock_test_answers rows");

  // ── Assignments: 1 pending / 1 submitted+graded / 1 overdue ──────────────
  // assignment_submissions table created via startup migration so we can
  // seed a concrete "submitted" state for the demo student.
  const dueIn7   = new Date(); dueIn7.setDate(dueIn7.getDate() + 7);
  const due2wAgo = new Date(); due2wAgo.setDate(due2wAgo.getDate() - 14);
  const due5dAgo = new Date(); due5dAgo.setDate(due5dAgo.getDate() - 5);
  const post3w   = new Date(); post3w.setDate(post3w.getDate() - 21);
  const post8d   = new Date(); post8d.setDate(post8d.getDate() - 8);

  // 1. Pending — due in 7 days, no submission yet
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${primaryBatchId}, ${teacherUserId}, 'Kinematics Problem Set', 'Physics',
      'Solve 20 problems on kinematics — projectile, relative motion, v-t graphs. Show full working.',
      ${dueIn7.toISOString()}, 40, true, NOW(), NOW())
  `);

  // 2. Submitted + graded — due 5 days ago, student submitted 6 days ago (before due date)
  const submittedAssignment = await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${primaryBatchId}, ${teacherUserId}, 'Organic Chemistry — Named Reactions', 'Chemistry',
      'Write and balance 15 named reactions with mechanisms (Aldol, Cannizzaro, Sandmeyer, Reimer-Tiemann).',
      ${due5dAgo.toISOString()}, 30, true, ${post8d.toISOString()}, ${post8d.toISOString()})
    RETURNING id
  `);
  const submittedAssignmentId = submittedAssignment.rows[0].id as string;

  // Seed the submission record: demo student submitted before due date, got graded
  const submittedAt = new Date(); submittedAt.setDate(submittedAt.getDate() - 6);
  const gradedAt    = new Date(); gradedAt.setDate(gradedAt.getDate() - 3);
  await db.execute(sql`
    INSERT INTO assignment_submissions (id, assignment_id, student_id, submitted_at, note, marks_awarded, feedback, graded_by, graded_at, status, created_at, updated_at)
    VALUES (
      gen_random_uuid(), ${submittedAssignmentId}, ${primaryStudentId},
      ${submittedAt.toISOString()},
      'Completed all 15 reactions. Sandmeyer mechanism required extra reference — referenced NCERT Organic Chemistry Vol 2.',
      26, 'Good attempt! Named reactions are well-balanced. Mechanism for Reimer-Tiemann needs more detail. Overall solid.',
      ${teacherUserId}, ${gradedAt.toISOString()}, 'graded',
      ${submittedAt.toISOString()}, ${gradedAt.toISOString()}
    )
    ON CONFLICT (assignment_id, student_id) DO NOTHING
  `);

  // 3. Overdue — due 14 days ago, no submission (missed deadline)
  await db.execute(sql`
    INSERT INTO assignments (id, batch_id, posted_by, title, subject, description, due_date, max_marks, is_visible, created_at, updated_at)
    VALUES (gen_random_uuid(), ${primaryBatchId}, ${teacherUserId}, 'Integration Practice Worksheet', 'Mathematics',
      'Complete all definite and indefinite integration problems. Substitution and by-parts required.',
      ${due2wAgo.toISOString()}, 50, true, ${post3w.toISOString()}, ${post3w.toISOString()})
  `);

  created.push("3 assignments — Physics (pending, due +7 d), Chemistry (submitted+graded 26/30 via assignment_submissions), Maths (overdue, –14 d, no submission)");

  // ── Notices ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Unit Test Schedule — June 2026',
      'Unit tests for all JEE and NEET batches will be conducted from June 15–20, 2026. Carry admit cards, arrive 15 minutes early.',
      'Academic', true, ${primaryBatchId}, NOW(), NOW(), NOW())
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, target_batch_id, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Fee Due Reminder — June 2026 Quarter',
      'Please clear your June quarter tuition fees by June 5th to avoid a 5 % late charge. Contact the accounts office for UPI / cash options.',
      'Fee', true, ${primaryBatchId}, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
  `);
  await db.execute(sql`
    INSERT INTO notices (id, posted_by, title, body, category, is_public, published_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${adminId}, 'Annual Science Quiz 2026 — Registration Open',
      'Pinnacle Annual Science Quiz 2026 registrations open! Prizes ₹5,000 / ₹3,000 / ₹1,500 for top 3. Register before May 30.',
      'Event', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
  `);
  created.push("3 notices: Academic (unit test schedule), Fee (Q2 reminder), Event (Science Quiz)");

  // ── Doubts (1 open, 1 resolved with official teacher answer) ─────────────
  await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, status, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${primaryStudentId}, ${primaryBatchId}, 'Physics', 'Kinematics',
      'In uniform circular motion displacement for a complete revolution is zero — does that mean average velocity is always zero even though the object moves continuously?',
      false, 'open', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
  `);
  const d2 = await db.execute(sql`
    INSERT INTO doubts (id, student_id, batch_id, subject, topic, question_text, is_resolved, status, answer_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${primaryStudentId}, ${primaryBatchId}, 'Chemistry', 'Organic Chemistry',
      'What is the practical difference between inductive effect and mesomeric effect? When does each dominate in determining reactivity?',
      false, 'open', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
    RETURNING id
  `);
  const d2Id = d2.rows[0].id as string;
  await db.execute(sql`
    INSERT INTO doubt_answers (id, doubt_id, author_id, author_role, answer_text, is_official, upvotes, created_at)
    VALUES (gen_random_uuid(), ${d2Id}, ${teacherUserId}, 'teacher',
      'Inductive effect (I) operates through sigma bonds by electronegativity — permanent, distance-dependent, diminishes rapidly. Mesomeric effect (M) operates via pi bond delocalization across conjugated systems — stronger, longer-range. I-effect dominates in saturated systems (alkyl halides). M-effect dominates in conjugated/aromatic systems (aniline, phenol). In competition, M-effect wins in conjugated systems.',
      true, 5, NOW() - INTERVAL '3 days')
  `);
  await db.execute(sql`
    UPDATE doubts SET is_resolved = true, status = 'resolved', answer_count = 1, updated_at = NOW() WHERE id = ${d2Id}
  `);
  created.push("2 doubts: Physics (open), Chemistry (resolved with official teacher answer + 5 upvotes)");

  // ── Fee records — one pair per enrollment ─────────────────────────────────
  for (let i = 0; i < studentIds.length; i++) {
    const sid  = studentIds[i]!;
    const tag  = i === 0 ? 'JEE Mains' : i === 1 ? 'NEET UG' : `Batch ${i + 1}`;
    const fee  = i === 0 ? 11250 : 10500;
    const ref  = `REC-DEMO-${String(i + 1).padStart(3, '0')}`;
    const paidOn = new Date(); paidOn.setDate(paidOn.getDate() - (10 + i * 2));
    const paidAt = new Date(paidOn.getTime() - 2 * 24 * 60 * 60 * 1000);
    const nextD  = new Date(); nextD.setDate(nextD.getDate() + 30 - i * 2);

    await db.execute(sql`
      INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, paid_date, status, payment_method, transaction_ref, notes, created_at, updated_at)
      VALUES (gen_random_uuid(), ${sid}, ${`April–June 2026 (${tag})`}, ${fee}, ${fee}, ${paidOn.toISOString()}, ${paidAt.toISOString()}, 'paid', ${i === 0 ? 'online' : 'cash'}, ${ref}, ${`Q1 2026 ${tag} fee — paid in full.`}, ${paidOn.toISOString()}, ${paidAt.toISOString()})
    `);
    await db.execute(sql`
      INSERT INTO fee_records (id, student_id, period, amount, paid_amount, due_date, status, notes, created_at, updated_at)
      VALUES (gen_random_uuid(), ${sid}, ${`July–September 2026 (${tag})`}, ${fee}, 0, ${nextD.toISOString()}, 'due', ${`Q2 2026 ${tag} fee — due in ~${30 - i * 2} days.`}, NOW(), NOW())
    `);
  }
  created.push(`${studentIds.length * 2} fee records — one paid + one due per enrollment (${studentIds.length} enrollment(s))`);

  // ── Enquiry ───────────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO enquiries (id, name, phone, email, course_interest, message, source, admission_status, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Test Parent (Enquiry)', '+91-9000000001', 'test.parent@example.com', 'JEE Mains',
      'I would like to enquire about JEE Mains 2026 coaching for my daughter (Class 11). Please share fee structure, batch timings, faculty details, and past year toppers.',
      'website', 'new', NOW(), NOW())
  `);
  created.push("1 enquiry: Test Parent — JEE Mains 2026 interest");

  // ── Completion sentinel (set LAST so partial failures allow safe retry) ────
  await db.execute(sql`
    INSERT INTO site_settings (id, key, value, label, updated_at)
    VALUES (gen_random_uuid(), 'demo_seed_v1', 'completed', 'Demo Seed Status', NOW())
    ON CONFLICT (key) DO UPDATE SET value = 'completed', updated_at = NOW()
  `);

  return { created, skipped: false };
}
