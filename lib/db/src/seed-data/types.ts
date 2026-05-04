export interface SeedQuestion {
  subject: string;
  topic: string;
  classGrade: string;
  year: number | null;
  difficulty: "easy" | "medium" | "hard";
  questionType: "mcq";
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  solution: string;
  marks: number;
}

export function pickYear(): number | null {
  const r = Math.random();
  if (r < 0.15) return null;
  const recentBias = Math.random();
  if (recentBias < 0.6) return 2018 + Math.floor(Math.random() * 8);
  return 2010 + Math.floor(Math.random() * 8);
}

export function pickDifficulty(): "easy" | "medium" | "hard" {
  const r = Math.random();
  if (r < 0.25) return "easy";
  if (r < 0.75) return "medium";
  return "hard";
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
