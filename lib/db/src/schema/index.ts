import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

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
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
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
  transactionRef: text("transaction_ref"),
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

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  value: text("value"),
  label: text("label"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
