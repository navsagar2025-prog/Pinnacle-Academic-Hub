import { redirect } from "next/navigation";

// Direct browsing of the question bank by students has been retired. Students
// only reach question-bank questions via teacher-curated Practice Sets, Mock
// Tests, or post-attempt review. The bank itself remains a staff-only authoring
// tool. Any deep-link here forwards to the new Practice page.
export default function StudentQuestionBankRedirect() {
  redirect("/portal/student/practice");
}
