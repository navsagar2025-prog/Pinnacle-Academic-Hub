import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";
import { eq, sql } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Courses
  const courseData = [
    {
      slug: "jee-main-advanced",
      title: "JEE Main & Advanced",
      description: "Comprehensive 2-year program covering Physics, Chemistry & Mathematics for IIT/NIT aspirants.",
      durationLabel: "2 Years",
      annualFee: 95000,
      admissionFee: 3000,
      maxBatchSize: 30,
      eligibility: "Class 10 pass / Class 11 students",
      highlights: ["Expert IITian Faculty", "Biweekly Full Tests", "Doubt Sessions 6 Days/Week", "Study Material + DPPs", "Online + Offline Access"],
      isActive: true,
    },
    {
      slug: "neet-ug",
      title: "NEET UG",
      description: "Intensive Medical entrance preparation covering Physics, Chemistry & Biology with focus on NCERT mastery.",
      durationLabel: "2 Years",
      annualFee: 90000,
      admissionFee: 3000,
      maxBatchSize: 30,
      eligibility: "Class 10 pass / Class 11 students",
      highlights: ["NEET-Focused Curriculum", "NCERT Line-by-Line Coverage", "Full-Length Mock Tests", "Biology Deep-Dive Sessions", "Video Recordings Available"],
      isActive: true,
    },
    {
      slug: "class-11-12-boards",
      title: "Class 11–12 Boards",
      description: "Strong foundation in CBSE/ICSE subjects to ensure 90%+ board results with holistic academic development.",
      durationLabel: "1 Year",
      annualFee: 55000,
      admissionFee: 2000,
      maxBatchSize: 35,
      eligibility: "Class 10 pass (any board)",
      highlights: ["CBSE & ICSE Coverage", "Sample Paper Practice", "Chapter-wise Tests", "Parent Progress Reports", "Scholarship for Merit Students"],
      isActive: true,
    },
    {
      slug: "foundation-class-9-10",
      title: "Foundation (Class 9–10)",
      description: "Early preparation for competitive exams alongside board exams. Builds conceptual clarity from the ground up.",
      durationLabel: "1-2 Years",
      annualFee: 45000,
      admissionFee: 2000,
      maxBatchSize: 35,
      eligibility: "Class 8 pass / Class 9 students",
      highlights: ["NTSE / Olympiad Prep", "Board Exam Alignment", "Mental Math & Speed", "Reasoning & Aptitude", "Monthly Parent-Teacher Meet"],
      isActive: true,
    },
    {
      slug: "dropper-jee",
      title: "JEE Dropper Batch",
      description: "Intensive 1-year revision and exam strategy program for repeat JEE aspirants targeting top NIT/IIT ranks.",
      durationLabel: "1 Year",
      annualFee: 75000,
      admissionFee: 2500,
      maxBatchSize: 25,
      eligibility: "Class 12 pass (any stream with PCM)",
      highlights: ["Full Syllabus Revision", "Rank Improvement Focus", "3 Full Mocks/Week", "Personal Mentor", "Previous Year Analysis"],
      isActive: true,
    },
    {
      slug: "dropper-neet",
      title: "NEET Dropper Batch",
      description: "Structured revision program for NEET repeaters with intensive biology sessions and full mock test series.",
      durationLabel: "1 Year",
      annualFee: 72000,
      admissionFee: 2500,
      maxBatchSize: 25,
      eligibility: "Class 12 pass with PCB",
      highlights: ["Biology Marathon Sessions", "NTA-Pattern Mocks", "Error Analysis Workshop", "Counselling Support", "Last-Mile Revision Modules"],
      isActive: true,
    },
  ];

  await db.insert(schema.courses).values(courseData).onConflictDoNothing();
  console.log("✅ Courses seeded");

  const insertedCourses = await db.select().from(schema.courses);
  const jee = insertedCourses.find((c) => c.slug === "jee-main-advanced")!;
  const neet = insertedCourses.find((c) => c.slug === "neet-ug")!;
  const boards = insertedCourses.find((c) => c.slug === "class-11-12-boards")!;

  const batchData = [
    { courseId: jee.id, name: "JEE Morning Batch A", timingLabel: "6:30 AM – 9:00 AM", daysLabel: "Mon–Sat", maxStudents: 30, status: "active" as const, room: "Room 101" },
    { courseId: jee.id, name: "JEE Evening Batch B", timingLabel: "4:00 PM – 6:30 PM", daysLabel: "Mon–Sat", maxStudents: 30, status: "active" as const, room: "Room 102" },
    { courseId: neet.id, name: "NEET Morning Batch", timingLabel: "7:00 AM – 9:30 AM", daysLabel: "Mon–Sat", maxStudents: 30, status: "active" as const, room: "Room 201" },
    { courseId: boards.id, name: "Boards Afternoon Batch", timingLabel: "2:00 PM – 4:30 PM", daysLabel: "Mon–Fri", maxStudents: 35, status: "active" as const, room: "Room 301" },
  ];
  await db.insert(schema.batches).values(batchData).onConflictDoNothing();
  console.log("✅ Batches seeded");

  const insertedBatches = await db.select().from(schema.batches);
  const jeeMorning = insertedBatches.find((b) => b.name === "JEE Morning Batch A")!;
  const jeeEvening = insertedBatches.find((b) => b.name === "JEE Evening Batch B")!;
  const neetMorning = insertedBatches.find((b) => b.name === "NEET Morning Batch")!;

  // Teachers (seeded with null userId so they work as reference data without real Clerk accounts)
  const existingTeachers = await db.select().from(schema.teachers);
  if (existingTeachers.length === 0) {
    const teacherData = [
      {
        userId: null,
        designation: "Senior Faculty — Physics",
        qualification: "M.Sc. Physics, IIT Kanpur",
        subjects: ["Physics"],
        experienceYears: 12,
        bio: "IIT Kanpur alumnus with 12 years of JEE coaching experience. Expert in Mechanics, Electrodynamics and Modern Physics.",
        initials: "RK",
        isActive: true,
      },
      {
        userId: null,
        designation: "Senior Faculty — Chemistry",
        qualification: "M.Sc. Chemistry, Delhi University",
        subjects: ["Chemistry"],
        experienceYears: 9,
        bio: "Specialist in Organic and Physical Chemistry with a track record of 95%+ students clearing JEE Mains.",
        initials: "PS",
        isActive: true,
      },
      {
        userId: null,
        designation: "Senior Faculty — Mathematics",
        qualification: "M.Sc. Mathematics, NIT Allahabad",
        subjects: ["Mathematics"],
        experienceYears: 11,
        bio: "Expert in Calculus, Algebra and Coordinate Geometry. Known for breaking down complex problems into intuitive steps.",
        initials: "AT",
        isActive: true,
      },
      {
        userId: null,
        designation: "Faculty — Biology",
        qualification: "M.Sc. Botany, Lucknow University",
        subjects: ["Biology"],
        experienceYears: 7,
        bio: "NEET specialist with deep expertise in Plant Physiology, Genetics and Human Anatomy. 93% NEET selection rate.",
        initials: "SP",
        isActive: true,
      },
    ];
    await db.insert(schema.teachers).values(teacherData);
    console.log("✅ Teachers seeded");
  } else {
    console.log("⏭️  Teachers already seeded, skipping");
  }

  const allTeachers = await db.select().from(schema.teachers);
  const tPhysics = allTeachers.find((t) => t.initials === "RK")!;
  const tChem = allTeachers.find((t) => t.initials === "PS")!;
  const tMath = allTeachers.find((t) => t.initials === "AT")!;

  // Schedules
  const existingSchedules = await db.select({ c: sql<number>`count(*)::int` }).from(schema.schedules);
  if ((existingSchedules[0]?.c ?? 0) === 0 && jeeMorning && jeeEvening && tPhysics && tChem && tMath) {
    const scheduleData = [
      // JEE Evening Batch B — Physics (Mon, Wed, Fri)
      { batchId: jeeEvening.id, teacherId: tPhysics.id, subject: "Physics", topic: "Wave Optics", dayOfWeek: 1, startTime: "16:00", endTime: "18:00", room: "Room 102", isRecurring: true },
      { batchId: jeeEvening.id, teacherId: tPhysics.id, subject: "Physics", topic: "Thermodynamics", dayOfWeek: 3, startTime: "16:00", endTime: "18:00", room: "Room 102", isRecurring: true },
      { batchId: jeeEvening.id, teacherId: tPhysics.id, subject: "Physics", topic: "Electrodynamics", dayOfWeek: 5, startTime: "16:00", endTime: "18:00", room: "Room 102", isRecurring: true },
      // JEE Evening Batch B — Chemistry (Tue, Thu)
      { batchId: jeeEvening.id, teacherId: tChem.id, subject: "Chemistry", topic: "Organic Chemistry", dayOfWeek: 2, startTime: "16:00", endTime: "18:00", room: "Room 102", isRecurring: true },
      { batchId: jeeEvening.id, teacherId: tChem.id, subject: "Chemistry", topic: "Physical Chemistry", dayOfWeek: 4, startTime: "16:00", endTime: "18:00", room: "Room 102", isRecurring: true },
      // JEE Evening Batch B — Mathematics (Mon, Fri)
      { batchId: jeeEvening.id, teacherId: tMath.id, subject: "Mathematics", topic: "Integral Calculus", dayOfWeek: 1, startTime: "18:15", endTime: "19:15", room: "Room 102", isRecurring: true },
      { batchId: jeeEvening.id, teacherId: tMath.id, subject: "Mathematics", topic: "Differential Equations", dayOfWeek: 4, startTime: "18:15", endTime: "19:15", room: "Room 102", isRecurring: true },
      // JEE Morning Batch A — Physics (Mon, Wed, Fri)
      { batchId: jeeMorning.id, teacherId: tPhysics.id, subject: "Physics", topic: "Mechanics", dayOfWeek: 1, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
      { batchId: jeeMorning.id, teacherId: tPhysics.id, subject: "Physics", topic: "Modern Physics", dayOfWeek: 3, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
      { batchId: jeeMorning.id, teacherId: tPhysics.id, subject: "Physics", topic: "Optics", dayOfWeek: 5, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
      // JEE Morning Batch A — Chemistry (Tue, Thu)
      { batchId: jeeMorning.id, teacherId: tChem.id, subject: "Chemistry", topic: "Inorganic Chemistry", dayOfWeek: 2, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
      { batchId: jeeMorning.id, teacherId: tChem.id, subject: "Chemistry", topic: "Coordination Compounds", dayOfWeek: 4, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
      // JEE Morning Batch A — Mathematics (Tue, Sat)
      { batchId: jeeMorning.id, teacherId: tMath.id, subject: "Mathematics", topic: "Coordinate Geometry", dayOfWeek: 2, startTime: "08:15", endTime: "09:00", room: "Room 101", isRecurring: true },
      { batchId: jeeMorning.id, teacherId: tMath.id, subject: "Mathematics", topic: "Complex Numbers", dayOfWeek: 6, startTime: "06:30", endTime: "08:00", room: "Room 101", isRecurring: true },
    ];
    await db.insert(schema.schedules).values(scheduleData);
    console.log("✅ Schedules seeded");
  } else {
    console.log("⏭️  Schedules already seeded, skipping");
  }

  // Study Materials
  const existingMaterials = await db.select({ c: sql<number>`count(*)::int` }).from(schema.studyMaterials);
  if ((existingMaterials[0]?.c ?? 0) === 0 && jeeEvening) {
    const materialData = [
      { batchId: jeeEvening.id, uploadedBy: null, title: "Wave Optics — Complete Notes", subject: "Physics", type: "notes" as const, fileSize: "2.4 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Organic Chemistry — Haloalkanes", subject: "Chemistry", type: "notes" as const, fileSize: "1.8 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Integral Calculus — Formula Sheet", subject: "Mathematics", type: "formula" as const, fileSize: "0.8 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Thermodynamics — NCERT Exercises", subject: "Physics", type: "exercise" as const, fileSize: "3.1 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Coordination Compounds — Notes", subject: "Chemistry", type: "notes" as const, fileSize: "2.2 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Differential Equations — Solved Examples", subject: "Mathematics", type: "exercise" as const, fileSize: "1.9 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Electrostatics — Chapter Summary", subject: "Physics", type: "summary" as const, fileSize: "1.2 MB", isVisible: true },
      { batchId: jeeEvening.id, uploadedBy: null, title: "Physical Chemistry — Thermodynamics Notes", subject: "Chemistry", type: "notes" as const, fileSize: "2.7 MB", isVisible: true },
      { batchId: jeeMorning.id, uploadedBy: null, title: "Mechanics — Rotation Notes", subject: "Physics", type: "notes" as const, fileSize: "2.0 MB", isVisible: true },
      { batchId: jeeMorning.id, uploadedBy: null, title: "Inorganic Chemistry — Periodic Table", subject: "Chemistry", type: "formula" as const, fileSize: "1.5 MB", isVisible: true },
    ];
    await db.insert(schema.studyMaterials).values(materialData);
    console.log("✅ Study materials seeded");
  } else {
    console.log("⏭️  Study materials already seeded, skipping");
  }

  // Practice Papers
  const existingPapers = await db.select({ c: sql<number>`count(*)::int` }).from(schema.practicePapers);
  if ((existingPapers[0]?.c ?? 0) === 0 && jeeEvening) {
    const paperData = [
      { batchId: jeeEvening.id, title: "JEE Mains — Full Mock Test #8", paperType: "Full Mock", subject: "PCM", durationMinutes: 180, totalQuestions: 90, maxMarks: 300, isVisible: true },
      { batchId: jeeEvening.id, title: "JEE Advanced — Paper 1 Practice", paperType: "JEE Advanced", subject: "PCM", durationMinutes: 180, totalQuestions: 54, maxMarks: 183, isVisible: true },
      { batchId: jeeEvening.id, title: "Physics — Wave Optics DPP", paperType: "DPP", subject: "Physics", durationMinutes: 45, totalQuestions: 20, maxMarks: 60, isVisible: true },
      { batchId: jeeEvening.id, title: "Chemistry — Organic Chemistry Test", paperType: "Chapter Test", subject: "Chemistry", durationMinutes: 60, totalQuestions: 30, maxMarks: 90, isVisible: true },
      { batchId: jeeEvening.id, title: "Mathematics — Calculus Test", paperType: "Chapter Test", subject: "Mathematics", durationMinutes: 90, totalQuestions: 30, maxMarks: 90, isVisible: true },
      { batchId: jeeEvening.id, title: "JEE Mains — Full Mock Test #7", paperType: "Full Mock", subject: "PCM", durationMinutes: 180, totalQuestions: 90, maxMarks: 300, isVisible: true },
      { batchId: jeeEvening.id, title: "Previous Year — JEE Mains 2024", paperType: "Previous Year", subject: "PCM", durationMinutes: 180, totalQuestions: 90, maxMarks: 300, isVisible: true },
      { batchId: jeeEvening.id, title: "Previous Year — JEE Mains 2023", paperType: "Previous Year", subject: "PCM", durationMinutes: 180, totalQuestions: 90, maxMarks: 300, isVisible: true },
    ];
    await db.insert(schema.practicePapers).values(paperData);
    console.log("✅ Practice papers seeded");
  } else {
    console.log("⏭️  Practice papers already seeded, skipping");
  }

  // Class Recordings
  const existingRecordings = await db.select({ c: sql<number>`count(*)::int` }).from(schema.classRecordings);
  if ((existingRecordings[0]?.c ?? 0) === 0 && jeeEvening) {
    const recordingData = [
      { batchId: jeeEvening.id, liveClassId: null, title: "Thermodynamics — Laws of Thermodynamics", subject: "Physics", teacherName: "Dr. Ramesh Kumar", recordingUrl: "#", durationMinutes: 105, isVisible: true },
      { batchId: jeeEvening.id, liveClassId: null, title: "Coordination Compounds — Full Chapter", subject: "Chemistry", teacherName: "Ms. Priya Sharma", recordingUrl: "#", durationMinutes: 130, isVisible: true },
      { batchId: jeeEvening.id, liveClassId: null, title: "Differential Equations — Introduction", subject: "Mathematics", teacherName: "Mr. Ajay Tiwari", recordingUrl: "#", durationMinutes: 115, isVisible: true },
      { batchId: jeeEvening.id, liveClassId: null, title: "Wave Optics — Complete Chapter", subject: "Physics", teacherName: "Dr. Ramesh Kumar", recordingUrl: "#", durationMinutes: 125, isVisible: true },
      { batchId: jeeEvening.id, liveClassId: null, title: "Organic Chemistry — Named Reactions", subject: "Chemistry", teacherName: "Ms. Priya Sharma", recordingUrl: "#", durationMinutes: 100, isVisible: true },
      { batchId: jeeEvening.id, liveClassId: null, title: "Complex Numbers — Master Class", subject: "Mathematics", teacherName: "Mr. Ajay Tiwari", recordingUrl: "#", durationMinutes: 120, isVisible: true },
    ];
    await db.insert(schema.classRecordings).values(recordingData);
    console.log("✅ Class recordings seeded");
  } else {
    console.log("⏭️  Class recordings already seeded, skipping");
  }

  // Notices
  const noticeData = [
    { title: "JEE Mains Mock Test — Schedule Released", body: "The full-syllabus mock test for JEE Mains batch is scheduled for Sunday, 5th May 2024 at 9:00 AM in the examination hall. Admit cards will be issued on Friday. Students must carry their ID cards.", category: "Test" as const, isPublic: true },
    { title: "Summer Vacation Schedule 2024", body: "The institute will remain closed from 20th May to 2nd June 2024 for summer vacation. Special crash course batches will continue as per their separate schedules.", category: "Academic" as const, isPublic: true },
    { title: "Fee Payment Reminder — April Installment", body: "This is a gentle reminder that the April installment fee is due by 15th April 2024. Parents/students are requested to complete payment through the fee portal or visit the accounts office.", category: "Fee" as const, isPublic: true },
    { title: "Annual Science Exhibition — Registrations Open", body: "We are delighted to announce the 5th Annual Science Exhibition on 20th April. Students from all batches are encouraged to participate. Register your project idea with your batch coordinator by 10th April.", category: "Event" as const, isPublic: true },
    { title: "New Batch Starting — NEET Dropper 2024", body: "Admissions are now open for the NEET Dropper Batch 2024. Limited seats (25 only). Scholarship available for applicants scoring 85%+ in the entrance test. Contact admissions office for details.", category: "Admissions" as const, isPublic: true },
    { title: "Parent-Teacher Meeting — May 2024", body: "The quarterly PTM is scheduled for Saturday, 11th May 2024 from 9:00 AM to 1:00 PM. Attendance is compulsory. Slot booking will open on 6th May via the parent portal.", category: "General" as const, isPublic: true },
    { title: "NEET Biology Marathon Sessions", body: "Special 3-day Biology marathon revision sessions will be conducted from 25th–27th April for NEET students. Focus areas: Genetics, Ecology, and Human Physiology. Attendance mandatory.", category: "Academic" as const, isPublic: true },
    { title: "Results — Internal Test Series #8", body: "Results for Internal Test Series #8 (Physics + Chemistry) are now published on the student portal. Students are advised to collect their answer sheets and attend the solution session on Monday.", category: "Test" as const, isPublic: true },
  ];
  await db.insert(schema.notices).values(noticeData).onConflictDoNothing();
  console.log("✅ Notices seeded");

  const enquiryData = [
    { name: "Arjun Mehta", email: "arjun.m@example.com", phone: "+91 98100 11001", courseInterest: "JEE Main & Advanced", message: "My son is in Class 10 and wants to prepare for JEE. Can we visit for a demo class?" },
    { name: "Priya Sharma", email: "priya.s@example.com", phone: "+91 99100 22002", courseInterest: "NEET UG", message: "Interested in NEET preparation for my daughter. Please share fee structure and batch timings." },
    { name: "Rajesh Kumar", email: "rajesh.k@example.com", phone: "+91 97100 33003", courseInterest: "NEET Dropper Batch", message: "I appeared in NEET 2024 and scored 540. Want to know about dropper batch and scholarship." },
  ];
  await db.insert(schema.enquiries).values(enquiryData).onConflictDoNothing();
  console.log("✅ Enquiries seeded");

  console.log("\n✅ Database seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
