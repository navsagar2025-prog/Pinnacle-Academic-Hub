// Hand-authored Foundation (Class 9 & 10) seed questions. These are written
// by humans (not the AI generator), so they go in as MANUAL source and skip
// the AI review queue — they are immediately published.

export type FoundationQuestion = {
  subject: "Mathematics" | "Physics" | "Chemistry" | "Biology" | "Science";
  topic: string;
  classGrade: "9" | "10";
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  solution: string;
  ncertChapter: string;
};

// Normalize a question's text for duplicate detection. Strips LaTeX wrappers,
// whitespace, and punctuation so that "What is $2+2$?" and "what is 2+2"
// hash to the same key.
export function normalizeForDedup(s: string): string {
  return s
    .toLowerCase()
    .replace(/\$+/g, " ")
    .replace(/\\[a-z]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
