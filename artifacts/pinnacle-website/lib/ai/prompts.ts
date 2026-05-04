export type AiTool =
  | "notice_writer"
  | "enquiry_responder"
  | "study_summariser"
  | "batch_insight"
  | "fee_reminder"
  | "question_generator";

export interface NoticeWriterCtx {
  topic: string;
  tone: string;
  audience: string;
  recentNotices?: { title: string; body: string }[];
}

export interface EnquiryResponderCtx {
  name: string;
  phone: string;
  email?: string | null;
  courseInterest?: string | null;
  message?: string | null;
}

export interface StudySummariserCtx {
  topic: string;
  concepts: string;
}

export interface BatchInsightCtx {
  batchName: string;
  courseTitle: string;
  studentCount: number;
  maxStudents: number;
  materialCount: number;
  totalFeeRecords: number;
  paidFeeRecords: number;
}

export interface FeeReminderCtx {
  studentName: string;
  rollNumber: string;
  period: string;
  amount: number;
  dueDate: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
}

export interface QuestionGeneratorCtx {
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  count: number;
  classGrade?: string;
  examType?: string;
}

export type AiContext =
  | NoticeWriterCtx
  | EnquiryResponderCtx
  | StudySummariserCtx
  | BatchInsightCtx
  | FeeReminderCtx
  | QuestionGeneratorCtx;

const INSTITUTE =
  "Pinnacle Academic Classes (managed by KCK Corporate Services Pvt. Ltd.), Greater Noida, offering JEE/NEET/Foundation coaching.";

export function buildPrompt(
  tool: AiTool,
  context: AiContext
): { systemPrompt: string; userPrompt: string } {
  switch (tool) {
    case "notice_writer": {
      const ctx = context as NoticeWriterCtx;
      const examples =
        ctx.recentNotices && ctx.recentNotices.length > 0
          ? ctx.recentNotices
              .map(
                (n, i) =>
                  `Example ${i + 1}:\nTitle: ${n.title}\nBody: ${n.body}`
              )
              .join("\n\n")
          : "No recent examples available.";
      return {
        systemPrompt: `You are a professional notice writer for ${INSTITUTE}. Write concise, clear notices in formal English. Always include a title (starting with "NOTICE:") followed by a body. Maintain the institute's professional tone.`,
        userPrompt: `Write a notice about the following:\n\nTopic: ${ctx.topic}\nTone: ${ctx.tone}\nTarget audience: ${ctx.audience}\n\nHere are style examples from our recent notices:\n${examples}\n\nNow write a new, original notice. Start with the title on the first line, then leave a blank line, then the body.`,
      };
    }

    case "enquiry_responder": {
      const ctx = context as EnquiryResponderCtx;
      return {
        systemPrompt: `You are a warm, professional admissions counsellor at ${INSTITUTE}. Write personalised, encouraging replies to prospective students and parents. Include relevant details about our courses (JEE Main, JEE Advanced, NEET, Foundation for Classes 9–10). Always end with contact info: call/WhatsApp us at our admission helpline, or visit our Greater Noida campus.`,
        userPrompt: `Draft a professional counsellor reply to this enquiry:\n\nName: ${ctx.name}\nPhone: ${ctx.phone}${ctx.email ? `\nEmail: ${ctx.email}` : ""}${ctx.courseInterest ? `\nCourse Interest: ${ctx.courseInterest}` : ""}${ctx.message ? `\nMessage: ${ctx.message}` : ""}\n\nWrite a warm, personalised reply (3–4 paragraphs) that addresses their interest, highlights our strengths, and invites them for a counselling session.`,
      };
    }

    case "study_summariser": {
      const ctx = context as StudySummariserCtx;
      return {
        systemPrompt: `You are an expert academic content creator specialising in JEE/NEET/Foundation coaching. Write revision summaries that are concise, well-structured, and student-friendly.`,
        userPrompt: `Create a concise revision summary for students on the following:\n\nTopic: ${ctx.topic}\nKey Concepts to cover: ${ctx.concepts}\n\nStructure your summary with:\n1. **Overview** (2–3 sentences)\n2. **Key Definitions** (bullet list)\n3. **Core Concepts** (brief explanations)\n4. **Common Exam Tips** (3–5 tips)\n5. **Quick Recap** (5 key points to remember)`,
      };
    }

    case "batch_insight": {
      const ctx = context as BatchInsightCtx;
      const feeRate =
        ctx.totalFeeRecords > 0
          ? Math.round((ctx.paidFeeRecords / ctx.totalFeeRecords) * 100)
          : 0;
      const occupancy =
        ctx.maxStudents > 0
          ? Math.round((ctx.studentCount / ctx.maxStudents) * 100)
          : 0;
      return {
        systemPrompt: `You are an academic performance analyst for ${INSTITUTE}. Write clear, insightful 2-paragraph performance briefs for batch coordinators and management. Be factual, constructive, and actionable.`,
        userPrompt: `Analyse the following batch data and write a 2-paragraph performance brief:\n\nBatch: ${ctx.batchName} (${ctx.courseTitle})\nEnrolment: ${ctx.studentCount}/${ctx.maxStudents} students (${occupancy}% capacity)\nStudy Materials Uploaded: ${ctx.materialCount}\nFee Collection Rate: ${feeRate}% (${ctx.paidFeeRecords} of ${ctx.totalFeeRecords} records paid)\nNote: Live attendance data not yet tracked in the system — focus analysis on enrolment occupancy, content delivery, and fee discipline.\n\nParagraph 1: Overall batch health and highlights based on the available data.\nParagraph 2: Areas of concern and recommended actions for coordinators to improve engagement and fee collection.`,
      };
    }

    case "fee_reminder": {
      const ctx = context as FeeReminderCtx;
      return {
        systemPrompt: `You are a professional fee management officer at ${INSTITUTE}. Write polite, respectful, and firm fee reminder messages in BOTH English and Hindi. Maintain a caring tone — students are our priority.`,
        userPrompt: `Write a bilingual (English + Hindi) fee reminder message for:\n\nStudent: ${ctx.studentName} (Roll No: ${ctx.rollNumber})${ctx.guardianName ? `\nGuardian: ${ctx.guardianName}` : ""}${ctx.guardianPhone ? ` (${ctx.guardianPhone})` : ""}\nFee Period: ${ctx.period}\nAmount Due: ₹${ctx.amount.toLocaleString("en-IN")}\nDue Date: ${ctx.dueDate}\n\nFormat:\n**English Message:**\n[Write the English message here]\n\n**Hindi Message (हिंदी संदेश):**\n[Write the Hindi message here]\n\nKeep each message under 150 words. Be polite but clear about the urgency.`,
      };
    }

    case "question_generator": {
      const ctx = context as QuestionGeneratorCtx;
      const diffInstruction = ctx.difficulty === "mixed"
        ? "Mix difficulties: roughly 25% easy, 50% medium, 25% hard."
        : `All questions should be "${ctx.difficulty}" difficulty.`;
      const classNote = ctx.classGrade ? `Target class: ${ctx.classGrade}.` : "";
      const examNote = ctx.examType ? `Style: ${ctx.examType} previous-year pattern.` : "Style: JEE/NEET competitive exam pattern.";
      return {
        systemPrompt: `You are an expert question paper setter for ${INSTITUTE}. Generate high-quality multiple-choice questions (MCQs) for competitive exam preparation. Each question MUST have exactly 4 options (A, B, C, D) with exactly one correct answer and a clear, concise solution explaining the reasoning. Output ONLY a valid JSON array — no markdown fences, no extra text.`,
        userPrompt: `Generate exactly ${ctx.count} MCQ question(s) for:

Subject: ${ctx.subject}
Topic: ${ctx.topic}
${classNote}
${examNote}
${diffInstruction}

Output a JSON array where each element has these exact keys:
{
  "questionText": "the question",
  "options": { "A": "option A", "B": "option B", "C": "option C", "D": "option D" },
  "correctAnswer": "A",
  "solution": "1-3 sentence explanation with key formula/steps",
  "difficulty": "easy" | "medium" | "hard"
}

Rules:
- Questions must be original, exam-quality, and conceptually distinct from each other
- Distractors (wrong options) must be plausible — no obviously silly answers
- Solutions should reference the key formula, principle, or reasoning
- Do NOT repeat similar questions with just numbers changed
- Output ONLY the JSON array, nothing else`,
      };
    }
  }
}
