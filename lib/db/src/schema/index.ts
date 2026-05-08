import {
  pgTable,
  pgSchema,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  real,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Postgres `tsvector` for full-text search columns.
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const roleEnum = pgEnum("role", ["student", "parent", "teacher", "admin"]);
export const feeStatusEnum = pgEnum("fee_status", ["paid", "partial", "due", "overdue", "waived"]);
export const classStatusEnum = pgEnum("class_status", ["scheduled", "live", "completed", "cancelled"]);
export const materialTypeEnum = pgEnum("material_type", ["notes", "formula", "exercise", "summary", "paper"]);
export const noticeCategoryEnum = pgEnum("notice_category", ["Academic", "Test", "Fee", "Event", "Admissions", "General"]);
export const batchStatusEnum = pgEnum("batch_status", ["active", "upcoming", "full", "completed"]);
export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "contacted", "interested", "converted", "declined"]);
export const blogStatusEnum = pgEnum("blog_status", ["draft", "published"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("student"),
  fcmToken: text("fcm_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("General"),
  startDate: timestamp("start_date"),
  durationLabel: text("duration_label"),
  annualFee: integer("annual_fee").notNull(),
  admissionFee: integer("admission_fee").default(2000),
  maxBatchSize: integer("max_batch_size").default(35),
  eligibility: text("eligibility"),
  highlights: text("highlights").array(),
  featuredImageUrl: text("featured_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id),
  name: text("name").notNull(),
  timingLabel: text("timing_label").notNull(),
  daysLabel: text("days_label").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxStudents: integer("max_students").default(30),
  status: batchStatusEnum("status").default("active"),
  room: text("room"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  batchId: uuid("batch_id").references(() => batches.id),
  rollNumber: text("roll_number").unique().notNull(),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  previousSchool: text("previous_school"),
  feePlan: text("fee_plan").default("annual"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  studentId: uuid("student_id").references(() => students.id),
  relation: text("relation").default("Parent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  designation: text("designation").notNull(),
  qualification: text("qualification"),
  subjects: text("subjects").array(),
  experienceYears: integer("experience_years"),
  bio: text("bio"),
  initials: text("initials"),
  isExaminer: boolean("is_examiner").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  photoUrl: text("photo_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studyMaterials = pgTable("study_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  type: materialTypeEnum("type").notNull().default("notes"),
  fileUrl: text("file_url"),
  fileSize: text("file_size"),
  downloadCount: integer("download_count").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const practicePapers = pgTable("practice_papers", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id),
  title: text("title").notNull(),
  paperType: text("paper_type").notNull(),
  subject: text("subject").notNull(),
  durationMinutes: integer("duration_minutes"),
  totalQuestions: integer("total_questions"),
  maxMarks: integer("max_marks"),
  fileUrl: text("file_url"),
  downloadCount: integer("download_count").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feeRecords = pgTable("fee_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id),
  period: text("period").notNull(),
  amount: integer("amount").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: feeStatusEnum("status").notNull().default("due"),
  paymentMethod: text("payment_method"),
  transactionRef: text("transaction_ref"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: uuid("id").primaryKey().defaultRandom(),
  postedBy: uuid("posted_by").references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: noticeCategoryEnum("category").notNull().default("General"),
  isPublic: boolean("is_public").default(true),
  targetBatchId: uuid("target_batch_id").references(() => batches.id),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id),
  teacherId: uuid("teacher_id").references(() => teachers.id),
  subject: text("subject").notNull(),
  topic: text("topic"),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  isRecurring: boolean("is_recurring").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const liveClasses = pgTable("live_classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id),
  teacherId: uuid("teacher_id").references(() => teachers.id),
  topic: text("topic").notNull(),
  subject: text("subject"),
  zoomMeetingId: text("zoom_meeting_id"),
  zoomJoinUrl: text("zoom_join_url"),
  zoomHostUrl: text("zoom_host_url"),
  zoomPasscode: text("zoom_passcode"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: classStatusEnum("status").default("scheduled"),
  durationMinutes: integer("duration_minutes"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classRecordings = pgTable("class_recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  liveClassId: uuid("live_class_id").references(() => liveClasses.id),
  // Legacy single-batch link, retained so existing rows + the live-class
  // join keep working. New writes mirror batchIds[0] into this column.
  batchId: uuid("batch_id").references(() => batches.id),
  // Authoritative many-batch assignment. A student may watch this
  // recording iff their active batch appears in this array.
  batchIds: uuid("batch_ids").array().notNull().default(sql`ARRAY[]::uuid[]`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  teacherName: text("teacher_name"),
  recordingUrl: text("recording_url").notNull(),
  sourceProvider: text("source_provider").default("zoom"),
  classDate: timestamp("class_date"),
  durationMinutes: integer("duration_minutes"),
  isVisible: boolean("is_visible").default(true),
  viewCount: integer("view_count").default(0),
  createdById: uuid("created_by_id").references(() => users.id),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recordingStreamTokens = pgTable("recording_stream_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").unique().notNull(),
  recordingId: uuid("recording_id").notNull().references(() => classRecordings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  ip: text("ip"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RecordingStreamToken = typeof recordingStreamTokens.$inferSelect;

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  courseInterest: text("course_interest"),
  message: text("message"),
  source: text("source").default("website"),
  isFollowedUp: boolean("is_followed_up").default(false),
  admissionStatus: enquiryStatusEnum("admission_status").default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  category: text("category").notNull().default("General"),
  tags: text("tags").array(),
  authorName: text("author_name").notNull(),
  featuredImageUrl: text("featured_image_url"),
  status: blogStatusEnum("status").notNull().default("draft"),
  readMinutes: integer("read_minutes").default(5),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const results = pgTable("results", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentName: text("student_name").notNull(),
  examName: text("exam_name").notNull(),
  subject: text("subject"),
  marks: text("marks"),
  rank: text("rank").notNull(),
  college: text("college"),
  batch: text("batch"),
  academicYear: text("academic_year").notNull(),
  quote: text("quote"),
  initials: text("initials").notNull(),
  isTopper: boolean("is_topper").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").references(() => batches.id, { onDelete: "cascade" }),
    postedBy: uuid("posted_by").references(() => users.id),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    description: text("description"),
    fileUrl: text("file_url"),
    dueDate: timestamp("due_date").notNull(),
    maxMarks: integer("max_marks"),
    isVisible: boolean("is_visible").default(true).notNull(),
    scheduleId: uuid("schedule_id").references(() => assignmentSchedules.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // Race-safe dedup for materialised occurrences: at most one row per (schedule, due_date).
    scheduleDueUq: uniqueIndex("assignments_schedule_due_uq")
      .on(t.scheduleId, t.dueDate)
      .where(sql`schedule_id IS NOT NULL`),
  }),
);

export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "active",
  "paused",
  "ended",
]);

export const assignmentSchedules = pgTable("assignment_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "cascade" }),
  postedBy: uuid("posted_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  maxMarks: integer("max_marks"),
  frequency: scheduleFrequencyEnum("frequency").notNull(),
  daysOfWeek: integer("days_of_week").array(),
  dayOfMonth: integer("day_of_month"),
  intervalDays: integer("interval_days"),
  dueTimeOfDay: text("due_time_of_day").notNull().default("23:59"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: scheduleStatusEnum("status").notNull().default("active"),
  lastMaterialisedDate: timestamp("last_materialised_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late"]);

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  subject: text("subject").notNull(),
  status: attendanceStatusEnum("status").notNull().default("present"),
  note: text("note"),
  markedBy: uuid("marked_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentTestResults = pgTable("student_test_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  batchId: uuid("batch_id").references(() => batches.id),
  examName: text("exam_name").notNull(),
  subject: text("subject").notNull(),
  totalMarks: integer("total_marks").notNull(),
  marksObtained: integer("marks_obtained").notNull(),
  rank: text("rank"),
  examDate: timestamp("exam_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  caption: text("caption"),
  category: text("category").notNull().default("General"),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seoOverrides = pgTable("seo_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  route: text("route").unique().notNull(),
  title: text("title"),
  description: text("description"),
  focusKeyword: text("focus_keyword"),
  noIndex: boolean("no_index").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  value: text("value"),
  label: text("label"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceLowAlerts = pgTable("attendance_low_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull().unique(),
  notifiedAt: timestamp("notified_at").defaultNow().notNull(),
  notifiedPct: integer("notified_pct").notNull(),
  hasRecovered: boolean("has_recovered").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mockTests = pgTable("mock_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  examType: text("exam_type").default("Mixed"),
  batchId: uuid("batch_id").references(() => batches.id),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  marksPerQuestion: integer("marks_per_question").notNull().default(4),
  negativeMarkingPercent: integer("negative_marking_percent").notNull().default(25),
  instructions: text("instructions"),
  isPublished: boolean("is_published").default(false).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  autoPublishAtStart: boolean("auto_publish_at_start").default(false).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Optional sections within a mock test (e.g. Physics / Chemistry / Maths).
// A test without rows here is treated as a single un-sectioned test.
export const mockTestSections = pgTable("mock_test_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").references(() => mockTests.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  ordering: integer("ordering").notNull().default(0),
  // Per-section instructions shown above the section header on the take page.
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mockTestQuestions = pgTable("mock_test_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").references(() => mockTests.id, { onDelete: "cascade" }).notNull(),
  // Nullable so legacy/un-sectioned questions still work. Set null on delete so
  // dropping a section keeps its questions but moves them to the "General" group.
  sectionId: uuid("section_id").references(() => mockTestSections.id, { onDelete: "set null" }),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  // 'mcq' (single correct), 'multi' (multiple correct), 'numerical' (numeric answer)
  questionType: text("question_type").default("mcq").notNull(),
  // Options are nullable so numerical questions don't need them.
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  // For mcq: 'A' | 'B' | 'C' | 'D'. Null for numerical / multi.
  correctOption: text("correct_option"),
  // For multi: subset of ['A','B','C','D'].
  correctOptions: text("correct_options").array(),
  // For numerical: the expected numeric answer and an absolute tolerance band.
  numericalAnswer: real("numerical_answer"),
  numericalTolerance: real("numerical_tolerance").default(0),
  topic: text("topic"),
  explanation: text("explanation"),
  imageUrl: text("image_url"),
  optionAImageUrl: text("option_a_image_url"),
  optionBImageUrl: text("option_b_image_url"),
  optionCImageUrl: text("option_c_image_url"),
  optionDImageUrl: text("option_d_image_url"),
  explanationImageUrl: text("explanation_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tracks reminder emails sent for scheduled mock tests so we don't double-send.
// `kind` is either 'open' (sent when scheduledStart has just passed) or
// 'starting_soon' (sent ~1 hour before scheduledStart).
export const mockTestNotifications = pgTable("mock_test_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").references(() => mockTests.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (t) => ({
  uniqTestKind: uniqueIndex("mock_test_notifications_test_kind_uniq").on(t.testId, t.kind),
}));

export const mockTestAttempts = pgTable("mock_test_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").references(() => mockTests.id, { onDelete: "cascade" }).notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  totalQuestions: integer("total_questions").notNull().default(0),
  attemptedCount: integer("attempted_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const mockTestAnswers = pgTable("mock_test_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").references(() => mockTestAttempts.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => mockTestQuestions.id, { onDelete: "cascade" }).notNull(),
  // Per-type response: only one of these is populated based on the question's type.
  selectedOption: text("selected_option"),         // mcq
  selectedOptions: text("selected_options").array(), // multi
  numericalResponse: real("numerical_response"),    // numerical
  isCorrect: boolean("is_correct"),
  marksAwarded: real("marks_awarded").default(0),
  isMarkedForReview: boolean("is_marked_for_review").default(false).notNull(),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("mock_test_answers_attempt_question_uq").on(t.attemptId, t.questionId),
]);

export const doubts = pgTable("doubts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  batchId: uuid("batch_id").references(() => batches.id),
  subject: text("subject").notNull(),
  topic: text("topic"),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  status: text("status").default("open").notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  answerCount: integer("answer_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const doubtAnswers = pgTable("doubt_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  doubtId: uuid("doubt_id").references(() => doubts.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  authorRole: text("author_role").notNull(),
  answerText: text("answer_text").notNull(),
  imageUrl: text("image_url"),
  upvotes: integer("upvotes").default(0).notNull(),
  isOfficial: boolean("is_official").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doubtAnswerVotes = pgTable("doubt_answer_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  answerId: uuid("answer_id").references(() => doubtAnswers.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionTypeEnum = pgEnum("question_type", ["mcq", "short", "long", "numerical"]);
export const questionDifficultyEnum = pgEnum("question_difficulty", ["easy", "medium", "hard"]);

// Dedicated Postgres schema for the question bank so it can be backed up,
// permission-scoped, and indexed independently of the operational tables.
export const qbSchema = pgSchema("question_bank");

export const questionBank = qbSchema.table("question_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  classGrade: text("class_grade"),
  year: integer("year"),
  difficulty: questionDifficultyEnum("difficulty").notNull().default("medium"),
  questionType: questionTypeEnum("question_type").notNull().default("mcq"),
  questionText: text("question_text").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  solution: text("solution"),
  imageUrl: text("image_url"),
  solutionImageUrl: text("solution_image_url"),
  examName: text("exam_name"),
  marks: integer("marks").default(4).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  // Exam targets this question is suitable for (multi-valued so one question can
  // serve JEE Main + NEET, etc.). Allowed values, validated at the application
  // layer: 'JEE_MAIN' | 'JEE_ADVANCED' | 'NEET' | 'CBSE_BOARDS' | 'FOUNDATION'.
  examTarget: text("exam_target").array(),
  // Provenance of the row. Used for filtering, attribution, and the AI review
  // queue. Allowed values: 'PYQ' | 'AI' | 'MANUAL' | 'NCERT_EXEMPLAR' | 'THIRD_PARTY_FREE'.
  source: text("source").default("MANUAL").notNull(),
  // Review state. AI-generated rows land as 'pending' and must be reviewed by
  // an admin/teacher before they can be published. Allowed values:
  // 'pending' | 'approved' | 'rejected'.
  reviewStatus: text("review_status").default("approved").notNull(),
  // Language code for forward-compat (Hindi translation later). Default 'en'.
  language: text("language").default("en").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Two-stage deletion governance. Teachers/examiners flag a question with
  // (deletionRequestedAt, deletionRequestedBy, deletionReason); admins
  // approve by stamping deletedAt (soft-delete → 7-day bin). Auto-purged
  // by the daily cron once deletedAt < now()-7d.
  deletionRequestedAt: timestamp("deletion_requested_at"),
  deletionRequestedBy: uuid("deletion_requested_by").references(() => users.id),
  deletionReason: text("deletion_reason"),
  deletedAt: timestamp("deleted_at"),
  // Generated tsvector for full-text search: question_text (A) > topic (B) > solution (C).
  // Stored generated column — Postgres only supports STORED, which Drizzle emits by default.
  searchVector: tsvector("search_vector").generatedAlwaysAs(
    sql`setweight(to_tsvector('english', coalesce(question_text, '')), 'A') || setweight(to_tsvector('english', coalesce(topic, '')), 'B') || setweight(to_tsvector('english', coalesce(solution, '')), 'C')`,
  ),
}, (t) => [
  index("question_bank_subject_idx").on(t.subject),
  index("question_bank_topic_idx").on(t.topic),
  index("question_bank_year_idx").on(t.year),
  index("question_bank_exam_name_idx").on(t.examName),
  index("question_bank_deleted_at_idx").on(t.deletedAt),
  index("question_bank_deletion_requested_at_idx").on(t.deletionRequestedAt),
  index("question_bank_search_vector_idx").using("gin", t.searchVector),
  index("question_bank_source_idx").on(t.source),
  index("question_bank_review_status_idx").on(t.reviewStatus),
  index("question_bank_class_grade_idx").on(t.classGrade),
  index("question_bank_exam_target_idx").using("gin", t.examTarget),
]);

export const questionBookmarks = qbSchema.table("question_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questionBank.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionAttempts = qbSchema.table("question_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questionBank.id, { onDelete: "cascade" }).notNull(),
  practiceSetId: uuid("practice_set_id"),
  submittedAnswer: text("submitted_answer"),
  isCorrect: boolean("is_correct"),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Practice Sets — teacher/admin-curated bundles of questions assigned to batches
// or individual students. The ONLY way students reach question-bank questions
// (the raw bank is staff-only). A set is a lightweight cousin of a mock test:
// no timer, no submission window, no scoring rollup — just curated drill.
export const practiceSets = pgTable("practice_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject"),
  createdBy: uuid("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("practice_sets_created_by_idx").on(t.createdBy),
  index("practice_sets_subject_idx").on(t.subject),
]);

export const practiceSetQuestions = pgTable("practice_set_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  setId: uuid("set_id").references(() => practiceSets.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questionBank.id, { onDelete: "cascade" }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("practice_set_questions_unique_idx").on(t.setId, t.questionId),
  index("practice_set_questions_set_idx").on(t.setId),
]);

// An assignment links a set to either an entire batch (batchId set) or a single
// student (studentId set). Exactly one of those should be populated per row;
// the application layer enforces this invariant on insert.
export const practiceSetAssignments = pgTable("practice_set_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  setId: uuid("set_id").references(() => practiceSets.id, { onDelete: "cascade" }).notNull(),
  batchId: uuid("batch_id").references(() => batches.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by").references(() => users.id),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("practice_set_assignments_set_idx").on(t.setId),
  index("practice_set_assignments_batch_idx").on(t.batchId),
  index("practice_set_assignments_student_idx").on(t.studentId),
]);

// Per-admin saved filter combinations for the Question Bank screen. The
// `queryString` is the URL search-params string (without the leading `?`)
// captured at save time — replaying the view is a `router.push(?<query>)`.
// Scoped per-user via `userId` so each admin only sees their own views.
export const questionBankSavedViews = pgTable("question_bank_saved_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  queryString: text("query_string").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("question_bank_saved_views_user_idx").on(t.userId),
  uniqueIndex("question_bank_saved_views_user_name_uq").on(t.userId, t.name),
]);

export const aiFeatureKeyEnum = pgEnum("ai_feature_key", [
  "ai_assistant",
  "question_generation",
  "solution_writer",
  "classifier",
]);

export const aiProviderEnum = pgEnum("ai_provider", [
  "openai",
  "gemini",
  "anthropic",
  "openrouter",
]);

export const aiFeatureModels = pgTable("ai_feature_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureKey: aiFeatureKeyEnum("feature_key").notNull().unique(),
  provider: aiProviderEnum("provider").notNull(),
  model: text("model").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const impersonationSessions = pgTable("impersonation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // SHA-256 hex of the random token stored in the admin's cookie. We never
  // store the raw token so a stolen DB row cannot be replayed as a cookie.
  tokenHash: text("token_hash").notNull().unique(),
  adminUserId: uuid("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  endedAt: timestamp("ended_at"),
  endedReason: text("ended_reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const watermarkSettings = pgTable("watermark_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  // 'global' or one of the doc-type slugs: receipt | study_material | assignment | question_bank
  docType: text("doc_type").unique().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  textTemplate: text("text_template").notNull().default("{{centreName}} • {{userName}} • {{date}}"),
  position: text("position").notNull().default("tile"), // tile | center | footer
  opacity: integer("opacity").notNull().default(12), // 0-100
  rotation: integer("rotation").notNull().default(45),
  fontSize: integer("font_size").notNull().default(36),
  color: text("color").notNull().default("#888888"),
  logoObjectPath: text("logo_object_path"),
  // For non-global rows: when true, the doc-type inherits everything from the
  // global row and the per-doc-type fields above are ignored.
  useGlobal: boolean("use_global").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WatermarkSettings = typeof watermarkSettings.$inferSelect;
export type InsertWatermarkSettings = typeof watermarkSettings.$inferInsert;

/**
 * Per-request hit tracker for sliding-window rate limiting.
 * Separate from security_events so rate limit counting does not pollute the
 * admin security event log. Only security_events gets a row when a request
 * is actually *blocked*; this table is for the counter side only.
 */
export const rateLimitHits = pgTable("rate_limit_hits", {
  id: uuid("id").primaryKey().defaultRandom(),
  hitKey: text("hit_key").notNull(),  // "ip:1.2.3.4" or "user:<uuid>"
  route: text("route").notNull(),     // route identifier, e.g. "api.enquiry.submit"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("rl_hits_key_route_created_idx").on(t.hitKey, t.route, t.createdAt),
]);

export type RateLimitHit = typeof rateLimitHits.$inferSelect;

export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(), // login_success | login_fail | rate_limited | ip_blocked | ip_unblocked
  actorEmail: text("actor_email"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  route: text("route"),
  outcome: text("outcome").notNull(), // success | fail | blocked
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("security_events_ip_idx").on(t.ip),
  index("security_events_created_at_idx").on(t.createdAt),
  index("security_events_event_type_idx").on(t.eventType),
]);

export const ipLockouts = pgTable("ip_lockouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ip: text("ip").unique().notNull(),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  route: text("route"),
  unlockedAt: timestamp("unlocked_at"),
  unlockedBy: text("unlocked_by"), // admin email
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ip_lockouts_ip_idx").on(t.ip),
  index("ip_lockouts_locked_until_idx").on(t.lockedUntil),
]);

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;
export type IpLockout = typeof ipLockouts.$inferSelect;
export type InsertIpLockout = typeof ipLockouts.$inferInsert;

/**
 * Server-side page-view tracker — privacy-friendly fallback when GA4 is not
 * configured. One row per (path, date) pair; counts are upserted on each
 * beacon so the table stays small.
 */
export const pageViews = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  path: text("path").notNull(),
  country: text("country"),
  // One row per (path, date, deviceType, referrer) where referrer is the
  // normalised hostname bucket (e.g. "google.com", "direct", "facebook.com").
  // Storing only the domain, not the full URL, keeps cardinality manageable
  // while still enabling traffic-source breakdown in the fallback dashboard.
  deviceType: text("device_type").notNull().default("desktop"), // desktop | mobile | tablet
  referrer: text("referrer"), // normalised hostname or NULL for direct/unknown
  count: integer("count").notNull().default(1),
  date: text("date").notNull(), // YYYY-MM-DD — stored as text to avoid timezone drift
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("page_views_path_date_device_ref_uq").on(t.path, t.date, t.deviceType, t.referrer),
  index("page_views_date_idx").on(t.date),
]);

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = typeof batches.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;
export type FeeRecord = typeof feeRecords.$inferSelect;
export type InsertFeeRecord = typeof feeRecords.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;
export type LiveClass = typeof liveClasses.$inferSelect;
export type InsertLiveClass = typeof liveClasses.$inferInsert;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type ClassRecording = typeof classRecordings.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type Result = typeof results.$inferSelect;
export type InsertResult = typeof results.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = typeof galleryItems.$inferInsert;
export type SeoOverride = typeof seoOverrides.$inferSelect;
export type MockTest = typeof mockTests.$inferSelect;
export type InsertMockTest = typeof mockTests.$inferInsert;
export type MockTestQuestion = typeof mockTestQuestions.$inferSelect;
export type InsertMockTestQuestion = typeof mockTestQuestions.$inferInsert;
export type MockTestSection = typeof mockTestSections.$inferSelect;
export type InsertMockTestSection = typeof mockTestSections.$inferInsert;
export type MockTestNotification = typeof mockTestNotifications.$inferSelect;
export type InsertMockTestNotification = typeof mockTestNotifications.$inferInsert;
export type MockTestAttempt = typeof mockTestAttempts.$inferSelect;
export type MockTestAnswer = typeof mockTestAnswers.$inferSelect;
export type Doubt = typeof doubts.$inferSelect;
export type InsertDoubt = typeof doubts.$inferInsert;
export type DoubtAnswer = typeof doubtAnswers.$inferSelect;
export type InsertDoubtAnswer = typeof doubtAnswers.$inferInsert;
export type DoubtAnswerVote = typeof doubtAnswerVotes.$inferSelect;
export type QuestionBank = typeof questionBank.$inferSelect;
export type InsertQuestionBank = typeof questionBank.$inferInsert;
export type QuestionBookmark = typeof questionBookmarks.$inferSelect;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type PracticeSet = typeof practiceSets.$inferSelect;
export type InsertPracticeSet = typeof practiceSets.$inferInsert;
export type PracticeSetQuestion = typeof practiceSetQuestions.$inferSelect;
export type PracticeSetAssignment = typeof practiceSetAssignments.$inferSelect;
export type QuestionBankSavedView = typeof questionBankSavedViews.$inferSelect;
export type InsertQuestionBankSavedView = typeof questionBankSavedViews.$inferInsert;
