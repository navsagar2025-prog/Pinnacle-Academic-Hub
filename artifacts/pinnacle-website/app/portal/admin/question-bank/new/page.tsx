import { QuestionEditor } from "../QuestionEditor";

export const metadata = { title: "Add Question — Admin Panel" };

export default function NewQuestionPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Add Question</h1>
      <QuestionEditor />
    </div>
  );
}
