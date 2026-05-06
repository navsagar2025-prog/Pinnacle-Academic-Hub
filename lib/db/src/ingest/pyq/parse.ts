// Heuristic parser for exam-paper text (JEE / NEET / CBSE / NCERT-Exemplar style).
// Real PDFs are messy; this is intentionally conservative and feeds a human
// review queue rather than auto-publishing.

import type { ParsedQuestion, ParsedQuestionWithAnswer } from "./types.js";

// ---------- regex patterns ----------

// Question heading at line start. Accepts:
//   "1.", "Q1.", "Q.1", "Q. 1."
// Deliberately rejects "(1) ..." and bare "1) ..." because those forms are
// reserved for OPTIONS in JEE / NEET / NCERT-Exemplar papers — letting them
// through would misread every option as a new question.
const QUESTION_HEAD_RE =
  /^\s*(?:Q\s*\.?\s*)?(\d{1,3})\s*\.\s+(.+\S)\s*$/;

// Option line. Accepts:
//   "(1) ...", "(A) ...", "1) ...", "A. ...", "(a) ..."
const OPTION_RE = /^\s*\(?\s*([1-4]|[A-Da-d])\s*[\)\.\]]\s+(.+\S)\s*$/;

// Single answer-key entry. Accepts:
//   "1. (3)", "1 - 3", "1) C", "1.C", "1->2", "Q1: D"
const ANS_KEY_RE =
  /(?:^|[^A-Za-z0-9])(?:Q\.?\s*)?(\d{1,3})\s*[\.\-\)\:>]+\s*\(?\s*([1-4]|[A-Da-d])\s*[\)\]]?(?=$|[^A-Za-z0-9])/g;

// Markers that conventionally precede an answer-key block.
const ANS_KEY_HEADERS = [
  "ANSWER KEY",
  "Answer Key",
  "Answers Key",
  "ANSWERS",
  "Answers",
  "Solutions",
  "SOLUTIONS",
];

// ---------- helpers ----------

function normaliseLetter(raw: string): string {
  if (/^[1-4]$/.test(raw)) return ["A", "B", "C", "D"][parseInt(raw, 10) - 1]!;
  return raw.toUpperCase();
}

// ---------- question segmentation ----------

interface RawQuestion {
  num: number;
  lines: string[]; // first element is the text after "1." on the heading line
}

export function parseQuestions(rawText: string): ParsedQuestion[] {
  // Strip the answer-key tail so we don't accidentally re-parse keys as questions.
  const cutAt = findAnswerKeyOffset(rawText);
  const text = cutAt >= 0 ? rawText.slice(0, cutAt) : rawText;

  const lines = text.split(/\r?\n/);

  const groups: RawQuestion[] = [];
  let current: RawQuestion | null = null;
  let lastNum = 0;

  for (const line of lines) {
    const head = QUESTION_HEAD_RE.exec(line);
    // Only treat as a new question if the number is monotonic (next or +1..+5).
    // Prevents accidental matches on "9.8 m/s^2" or "1.5 Volts".
    if (head) {
      const n = parseInt(head[1]!, 10);
      const looksLikeNextQ = n === lastNum + 1 || (lastNum === 0 && n === 1) || (n > lastNum && n <= lastNum + 3);
      if (looksLikeNextQ) {
        if (current) groups.push(current);
        current = { num: n, lines: [head[2]!] };
        lastNum = n;
        continue;
      }
    }
    if (current) current.lines.push(line);
  }
  if (current) groups.push(current);

  return groups.map(buildQuestion).filter((q) => q.questionText.length > 0);
}

function buildQuestion(g: RawQuestion): ParsedQuestion {
  const qTextParts: string[] = [];
  const opts: { letter: string; text: string }[] = [];
  let inOptions = false;
  let cur: { letter: string; text: string } | null = null;

  for (const raw of g.lines) {
    const line = raw.trim();
    if (!line) continue;
    const optMatch = OPTION_RE.exec(line);
    if (optMatch) {
      if (cur) opts.push(cur);
      cur = { letter: normaliseLetter(optMatch[1]!), text: optMatch[2]!.trim() };
      inOptions = true;
    } else if (inOptions && cur) {
      // Continuation of the current option (wrapped lines).
      cur.text += " " + line;
    } else {
      qTextParts.push(line);
    }
  }
  if (cur) opts.push(cur);

  // De-dup option letters in case the parser caught the same letter twice.
  const optionMap: Record<string, string> = {};
  for (const o of opts) {
    if (!optionMap[o.letter]) optionMap[o.letter] = o.text;
  }

  return {
    num: g.num,
    questionText: qTextParts.join(" ").replace(/\s+/g, " ").trim(),
    options: optionMap,
  };
}

// ---------- answer key parsing ----------

function findAnswerKeyOffset(text: string): number {
  for (const header of ANS_KEY_HEADERS) {
    const idx = text.lastIndexOf(header);
    if (idx > 0) return idx;
  }
  return -1;
}

export function parseAnswerKey(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const cutAt = findAnswerKeyOffset(text);
  // Refuse to infer an answer key from the document body. If no explicit
  // header is found, return empty so the ingester drops questions instead of
  // confidently assigning wrong answers (e.g. reading the "1." in a question
  // stem like "1. A body of mass..." as Q1 → A).
  if (cutAt < 0) return map;
  const search = text.slice(cutAt);
  let m: RegExpExecArray | null;
  while ((m = ANS_KEY_RE.exec(search)) !== null) {
    const num = parseInt(m[1]!, 10);
    const letter = normaliseLetter(m[2]!);
    if (!map.has(num)) map.set(num, letter);
  }
  return map;
}

// ---------- top-level convenience ----------

export function parseExamText(text: string): ParsedQuestionWithAnswer[] {
  const questions = parseQuestions(text);
  const key = parseAnswerKey(text);
  return questions.map((q) => ({ ...q, correctAnswer: key.get(q.num) }));
}
