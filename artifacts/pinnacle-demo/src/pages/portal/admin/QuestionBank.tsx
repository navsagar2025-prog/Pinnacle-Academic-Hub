import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import { Search, Plus, BookOpen, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics", "Biology"];
const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const CLASSES = ["All", "11", "12"];

const questions = [
  { id: 1, subject: "Physics", topic: "Mechanics", difficulty: "Medium", classGrade: "11", year: 2024, text: "A block of mass 5 kg is placed on an inclined plane making an angle of 30° with the horizontal. The coefficient of friction is 0.3. What is the acceleration of the block?", options: ["2.4 m/s²", "2.9 m/s²", "3.5 m/s²", "1.8 m/s²"], correct: 1 },
  { id: 2, subject: "Physics", topic: "Electrostatics", difficulty: "Hard", classGrade: "12", year: 2023, text: "Two point charges q₁ = +3μC and q₂ = −5μC are separated by 20 cm. At what point on the line joining them is the electric potential zero?", options: ["7.5 cm from q₁", "12.5 cm from q₁", "15 cm from q₁", "10 cm from q₁"], correct: 0 },
  { id: 3, subject: "Chemistry", topic: "Organic Chemistry", difficulty: "Medium", classGrade: "12", year: 2024, text: "Which of the following reagents is used to distinguish between a primary, secondary, and tertiary amine?", options: ["Hinsberg reagent", "Lucas reagent", "Tollens reagent", "Fehling solution"], correct: 0 },
  { id: 4, subject: "Chemistry", topic: "Chemical Bonding", difficulty: "Easy", classGrade: "11", year: 2022, text: "The shape of SF₆ molecule is:", options: ["Octahedral", "Trigonal bipyramidal", "Square planar", "Tetrahedral"], correct: 0 },
  { id: 5, subject: "Mathematics", topic: "Calculus", difficulty: "Hard", classGrade: "12", year: 2025, text: "The value of ∫₀^π x·sin(x)/(1 + cos²x) dx is equal to:", options: ["π²/4", "π²/2", "π²/8", "π²"], correct: 0 },
  { id: 6, subject: "Mathematics", topic: "Algebra", difficulty: "Medium", classGrade: "11", year: 2023, text: "If the roots of x² − px + q = 0 are in the ratio 2:3, then which relation holds?", options: ["6p² = 25q", "p² = 6q", "5p² = 24q", "3p² = 10q"], correct: 0 },
  { id: 7, subject: "Biology", topic: "Genetics", difficulty: "Medium", classGrade: "12", year: 2024, text: "In Mendel's dihybrid cross, the phenotypic ratio of F₂ generation is:", options: ["9:3:3:1", "1:1:1:1", "3:1", "1:2:1"], correct: 0 },
  { id: 8, subject: "Biology", topic: "Cell Biology", difficulty: "Easy", classGrade: "11", year: 2022, text: "Which organelle is known as the 'powerhouse of the cell'?", options: ["Mitochondria", "Golgi apparatus", "Endoplasmic reticulum", "Nucleus"], correct: 0 },
  { id: 9, subject: "Physics", topic: "Optics", difficulty: "Easy", classGrade: "12", year: 2021, text: "The phenomenon of splitting of white light into its component colors is called:", options: ["Dispersion", "Diffraction", "Interference", "Polarization"], correct: 0 },
  { id: 10, subject: "Physics", topic: "Modern Physics", difficulty: "Hard", classGrade: "12", year: 2025, text: "The de Broglie wavelength of an electron accelerated through a potential difference of 100 V is approximately:", options: ["1.23 Å", "0.123 Å", "12.3 Å", "0.0123 Å"], correct: 0 },
  { id: 11, subject: "Chemistry", topic: "Thermodynamics", difficulty: "Medium", classGrade: "11", year: 2023, text: "For a spontaneous process at constant temperature and pressure, which condition must be satisfied?", options: ["ΔG < 0", "ΔG > 0", "ΔH < 0", "ΔS < 0"], correct: 0 },
  { id: 12, subject: "Chemistry", topic: "Electrochemistry", difficulty: "Hard", classGrade: "12", year: 2024, text: "The standard electrode potential of Cu²⁺/Cu is +0.34 V and that of Zn²⁺/Zn is −0.76 V. The EMF of a Daniel cell is:", options: ["1.10 V", "0.42 V", "1.50 V", "0.76 V"], correct: 0 },
  { id: 13, subject: "Mathematics", topic: "Coordinate Geometry", difficulty: "Easy", classGrade: "11", year: 2022, text: "The distance between the points (3, 4) and (−1, 1) is:", options: ["5", "4", "3", "6"], correct: 0 },
  { id: 14, subject: "Mathematics", topic: "Probability", difficulty: "Medium", classGrade: "12", year: 2024, text: "Two dice are thrown simultaneously. The probability of getting a sum of 7 is:", options: ["1/6", "5/36", "7/36", "1/12"], correct: 0 },
  { id: 15, subject: "Biology", topic: "Human Physiology", difficulty: "Hard", classGrade: "11", year: 2023, text: "The bundle of His is a part of which system in the human body?", options: ["Cardiac conduction system", "Nervous system", "Digestive system", "Respiratory system"], correct: 0 },
  { id: 16, subject: "Biology", topic: "Ecology", difficulty: "Easy", classGrade: "12", year: 2025, text: "The pyramid of energy in an ecosystem is always:", options: ["Upright", "Inverted", "Spindle-shaped", "Irregular"], correct: 0 },
];

const subjectCounts: Record<string, number> = { Physics: 2869, Chemistry: 2544, Mathematics: 4181, Biology: 2001 };
const totalQuestions = 11595;

function DifficultyBadge({ d }: { d: string }) {
  const cls = d === "Easy" ? "bg-green-50 text-green-700 border-green-200" : d === "Hard" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", cls)}>{d}</span>;
}

function SubjectBadge({ s }: { s: string }) {
  const cls = s === "Physics" ? "bg-blue-50 text-blue-700" : s === "Chemistry" ? "bg-purple-50 text-purple-700" : s === "Mathematics" ? "bg-teal-50 text-teal-700" : "bg-emerald-50 text-emerald-700";
  return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls)}>{s}</span>;
}

export default function AdminQuestionBank() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [classGrade, setClassGrade] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = questions.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subject === "All" || q.subject === subject;
    const matchDiff = difficulty === "All" || q.difficulty === difficulty;
    const matchClass = classGrade === "All" || q.classGrade === classGrade;
    return matchSearch && matchSubject && matchDiff && matchClass;
  });

  return (
    <PortalLayout role="admin" navItems={adminNavItems} userName="Admin — Pinnacle" userSub="Full Access">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Question Bank</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalQuestions.toLocaleString()} questions across 4 subjects — NCERT / JEE / NEET PYQs (2010–2025)</p>
        </div>
        <div className="flex gap-2">
          <button disabled title="Demo mode" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold opacity-50 cursor-not-allowed flex items-center gap-1.5">
            <Plus className="w-4 h-4" />Add Question
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(subjectCounts).map(([subj, count]) => {
          const colors: Record<string, string> = { Physics: "border-blue-200 bg-blue-50", Chemistry: "border-purple-200 bg-purple-50", Mathematics: "border-teal-200 bg-teal-50", Biology: "border-emerald-200 bg-emerald-50" };
          return (
            <div key={subj} className={cn("rounded-xl border p-4 text-center", colors[subj])}>
              <div className="text-2xl font-bold text-foreground">{count.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">{subj}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search questions or topics..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground">
              {SUBJECTS.map((s) => <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d === "All" ? "All Difficulties" : d}</option>)}
            </select>
            <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground">
              {CLASSES.map((c) => <option key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => (
          <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
            >
              <div className="mt-0.5">
                {expanded === q.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-relaxed">{q.text}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <SubjectBadge s={q.subject} />
                  <DifficultyBadge d={q.difficulty} />
                  <span className="text-[10px] text-muted-foreground font-medium">Class {q.classGrade}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{q.topic}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{q.year}</span>
                </div>
              </div>
            </button>
            {expanded === q.id && (
              <div className="px-5 pb-4 border-t border-border pt-3 ml-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
                      oi === q.correct ? "border-green-300 bg-green-50 text-green-800 font-medium" : "border-border bg-muted/30 text-foreground"
                    )}>
                      {oi === q.correct ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                      <span className="font-medium mr-1 text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No questions match your filters</p>
          <p className="text-sm mt-1">Try adjusting the subject, difficulty, or search term</p>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {totalQuestions.toLocaleString()} questions (demo preview)
      </div>
    </PortalLayout>
  );
}
