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
  batchId: uuid("batch_id").references(() => batches.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  teacherName: text("teacher_name"),
  recordingUrl: text("recording_url").notNull(),
  durationMinutes: integer("duration_minutes"),
  isVisible: boolean("is_visible").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const assignments = pgTable("assignments", {
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
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mockTestQuestions = pgTable("mock_test_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").references(() => mockTests.id, { onDelete: "cascade" }).notNull(),
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
  marks: integer("marks").default(4).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Generated tsvector for full-text search: question_text (A) > topic (B) > solution (C).
  // Stored generated column — Postgres only supports STORED, which Drizzle emits by default.
  searchVector: tsvector("search_vector").generatedAlwaysAs(
    sql`setweight(to_tsvector('english', coalesce(question_text, '')), 'A') || setweight(to_tsvector('english', coalesce(topic, '')), 'B') || setweight(to_tsvector('english', coalesce(solution, '')), 'C')`,
  ),
}, (t) => [
  index("question_bank_subject_idx").on(t.subject),
  index("question_bank_topic_idx").on(t.topic),
  index("question_bank_year_idx").on(t.year),
  index("question_bank_search_vector_idx").using("gin", t.searchVector),
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
  submittedAnswer: text("submitted_answer"),
  isCorrect: boolean("is_correct"),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
