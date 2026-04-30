import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

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

  // Batches
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

  // Enquiries (sample)
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
