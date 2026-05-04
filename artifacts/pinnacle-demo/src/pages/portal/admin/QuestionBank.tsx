import { useState, useEffect, useRef, useCallback } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminNavItems } from "./Dashboard";
import {
  Search, BookOpen, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  Sparkles, X, Loader2, Check, Trash2, Save, Edit3, RotateCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUBJECTS_FILTER = ["All", "Physics", "Chemistry", "Mathematics", "Biology"];
const DIFFICULTIES_FILTER = ["All", "Easy", "Medium", "Hard"];
const CLASSES_FILTER = ["All", "11", "12"];

const bankQuestions = [
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

const MODEL_GROUPS = [
  { provider: "openai", label: "OpenAI", color: "#10a37f", models: [{ id: "gpt-4o", label: "GPT-4o" }, { id: "gpt-4o-mini", label: "GPT-4o Mini" }] },
  { provider: "gemini", label: "Gemini", color: "#4285f4", models: [{ id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" }, { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }] },
  { provider: "anthropic", label: "Claude", color: "#d97706", models: [{ id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" }, { id: "claude-haiku-3-5", label: "Claude Haiku 3.5" }] },
  { provider: "openrouter", label: "OpenRouter", color: "#7c3aed", models: [{ id: "llama-3.3-70b", label: "Llama 3.3 70B" }, { id: "deepseek-r1", label: "DeepSeek R1" }] },
];

const AI_SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const AI_TOPICS: Record<string, string[]> = {
  Physics: ["Mechanics", "Waves & Oscillations", "Optics", "Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Modern Physics", "Thermodynamics", "Semiconductors", "Nuclear Physics", "Fluid Mechanics", "Gravitation", "Rotational Motion"],
  Chemistry: ["Atomic Structure", "Chemical Bonding", "Periodic Table", "Thermodynamics", "Equilibrium", "Electrochemistry", "Chemical Kinetics", "Organic Chemistry", "Coordination Compounds", "Solutions", "p-Block Elements", "d-Block Elements", "Biomolecules", "Polymers"],
  Mathematics: ["Algebra", "Calculus", "Coordinate Geometry", "Trigonometry", "Probability & Statistics", "Vectors & 3D Geometry", "Matrices & Determinants", "Sequences & Series", "Complex Numbers", "Differential Equations", "Permutations & Combinations", "Sets & Relations"],
  Biology: ["Cell Biology", "Genetics & Heredity", "Molecular Biology", "Human Physiology", "Plant Physiology", "Ecology", "Evolution", "Biotechnology", "Human Health & Disease", "Reproduction", "Plant Anatomy", "Animal Kingdom"],
};

const DEMO_POOLS: Record<string, Array<{ questionText: string; options: { A: string; B: string; C: string; D: string }; correctAnswer: string; solution: string; difficulty: string }>> = {
  Physics: [
    { questionText: "A projectile is fired at an angle of 45° with initial velocity 20 m/s. What is the maximum height reached?", options: { A: "10 m", B: "5 m", C: "20 m", D: "15 m" }, correctAnswer: "A", solution: "H = u²sin²θ/(2g) = (400 × 0.5)/(2 × 10) = 10 m", difficulty: "medium" },
    { questionText: "The moment of inertia of a solid sphere about its diameter is:", options: { A: "2/5 MR²", B: "2/3 MR²", C: "1/2 MR²", D: "MR²" }, correctAnswer: "A", solution: "For a solid sphere, I = 2/5 MR² about any diameter.", difficulty: "easy" },
    { questionText: "In Young's double slit experiment, if the slit separation is halved and distance to screen is doubled, fringe width becomes:", options: { A: "4 times", B: "2 times", C: "Same", D: "Half" }, correctAnswer: "A", solution: "β = λD/d. If D→2D and d→d/2, β→4λD/d = 4β", difficulty: "hard" },
    { questionText: "A capacitor of 2μF is charged to 100V. The energy stored is:", options: { A: "10 mJ", B: "0.01 J", C: "100 J", D: "1 J" }, correctAnswer: "B", solution: "E = ½CV² = ½ × 2×10⁻⁶ × 10000 = 0.01 J", difficulty: "easy" },
    { questionText: "The work function of cesium is 2.14 eV. The threshold frequency for photoelectric emission is:", options: { A: "5.16 × 10¹⁴ Hz", B: "3.2 × 10¹⁴ Hz", C: "6.5 × 10¹⁴ Hz", D: "4.8 × 10¹⁴ Hz" }, correctAnswer: "A", solution: "φ = hν₀, so ν₀ = φ/h = 2.14 × 1.6×10⁻¹⁹ / 6.63×10⁻³⁴ ≈ 5.16 × 10¹⁴ Hz", difficulty: "medium" },
  ],
  Chemistry: [
    { questionText: "The IUPAC name of CH₃-CH(OH)-CH₂-CHO is:", options: { A: "3-hydroxybutanal", B: "2-hydroxybutanal", C: "4-hydroxybutanal", D: "1-hydroxybutanal" }, correctAnswer: "A", solution: "Numbering starts from aldehyde carbon. OH is on C3, hence 3-hydroxybutanal.", difficulty: "medium" },
    { questionText: "Which of the following has the highest lattice energy?", options: { A: "MgO", B: "NaCl", C: "KCl", D: "CaO" }, correctAnswer: "A", solution: "MgO has highest lattice energy due to small size and high charge of both ions (Mg²⁺, O²⁻).", difficulty: "medium" },
    { questionText: "The hybridization of carbon in diamond is:", options: { A: "sp³", B: "sp²", C: "sp", D: "dsp²" }, correctAnswer: "A", solution: "Each carbon in diamond is tetrahedrally bonded to 4 other carbons, hence sp³ hybridized.", difficulty: "easy" },
    { questionText: "The rate constant of a first-order reaction is 0.693 min⁻¹. The half-life is:", options: { A: "1 min", B: "2 min", C: "0.5 min", D: "0.693 min" }, correctAnswer: "A", solution: "t₁/₂ = 0.693/k = 0.693/0.693 = 1 min", difficulty: "easy" },
    { questionText: "In the extraction of copper, the self-reduction step involves:", options: { A: "Cu₂S + 2Cu₂O → 6Cu + SO₂", B: "CuFeS₂ + O₂ → Cu₂S + FeO", C: "Cu₂O + C → 2Cu + CO", D: "CuSO₄ + Fe → Cu + FeSO₄" }, correctAnswer: "A", solution: "In bessemerization, Cu₂S reduces Cu₂O — no external reducing agent needed.", difficulty: "hard" },
  ],
  Mathematics: [
    { questionText: "The value of lim(x→0) (sin 3x)/(2x) is:", options: { A: "3/2", B: "2/3", C: "1", D: "0" }, correctAnswer: "A", solution: "lim(x→0) sin3x/2x = (3/2) × lim(x→0) sin3x/3x = 3/2 × 1 = 3/2", difficulty: "easy" },
    { questionText: "If A is a 3×3 matrix with det(A) = 5, then det(3A) equals:", options: { A: "135", B: "15", C: "45", D: "5" }, correctAnswer: "A", solution: "det(kA) = k^n × det(A) for n×n matrix. det(3A) = 3³ × 5 = 135", difficulty: "medium" },
    { questionText: "The number of surjections from a set of 4 elements to a set of 2 elements is:", options: { A: "14", B: "16", C: "12", D: "8" }, correctAnswer: "A", solution: "Total functions = 2⁴ = 16. Non-surjective = 2 (all to one element). Surjections = 16 - 2 = 14.", difficulty: "hard" },
    { questionText: "If f(x) = x³ − 3x + 2, the number of real roots is:", options: { A: "3", B: "2", C: "1", D: "0" }, correctAnswer: "A", solution: "f(1) = 0, so (x-1) is a factor. f(x) = (x-1)²(x+2). Roots: x = 1 (double), x = -2.", difficulty: "medium" },
    { questionText: "The area bounded by y = x², x-axis and lines x = 1, x = 3 is:", options: { A: "26/3", B: "8", C: "9", D: "10" }, correctAnswer: "A", solution: "∫₁³ x² dx = [x³/3]₁³ = 27/3 - 1/3 = 26/3", difficulty: "easy" },
  ],
  Biology: [
    { questionText: "Which enzyme unwinds the DNA double helix during replication?", options: { A: "Helicase", B: "Ligase", C: "Primase", D: "Topoisomerase" }, correctAnswer: "A", solution: "Helicase breaks the hydrogen bonds between complementary bases to unwind the DNA helix.", difficulty: "easy" },
    { questionText: "The C4 pathway of carbon fixation is also known as:", options: { A: "Hatch-Slack pathway", B: "Calvin cycle", C: "Krebs cycle", D: "Hill reaction" }, correctAnswer: "A", solution: "The C4 pathway was discovered by Hatch and Slack, hence called the Hatch-Slack pathway.", difficulty: "medium" },
    { questionText: "Which of the following is NOT a function of the liver?", options: { A: "Production of insulin", B: "Bile secretion", C: "Glycogen storage", D: "Detoxification" }, correctAnswer: "A", solution: "Insulin is produced by beta cells of the Islets of Langerhans in the pancreas, not the liver.", difficulty: "medium" },
    { questionText: "In PCR, the denaturation step typically occurs at:", options: { A: "94-98°C", B: "50-65°C", C: "72°C", D: "37°C" }, correctAnswer: "A", solution: "Denaturation in PCR separates double-stranded DNA at 94-98°C.", difficulty: "easy" },
    { questionText: "The Hardy-Weinberg equilibrium is disturbed by:", options: { A: "All of the above", B: "Gene flow", C: "Natural selection", D: "Genetic drift" }, correctAnswer: "A", solution: "Gene flow, natural selection, genetic drift, mutations, and non-random mating all disrupt Hardy-Weinberg equilibrium.", difficulty: "hard" },
  ],
};

interface GeneratedQuestion {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  solution: string;
  difficulty: string;
  selected: boolean;
  editing: boolean;
}

function DifficultyBadge({ d }: { d: string }) {
  const cls = d === "Easy" ? "bg-green-50 text-green-700 border-green-200" : d === "Hard" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", cls)}>{d}</span>;
}

function SubjectBadge({ s }: { s: string }) {
  const cls = s === "Physics" ? "bg-blue-50 text-blue-700" : s === "Chemistry" ? "bg-purple-50 text-purple-700" : s === "Mathematics" ? "bg-teal-50 text-teal-700" : "bg-emerald-50 text-emerald-700";
  return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls)}>{s}</span>;
}

function AIQuestionGenerator({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("Mechanics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [count, setCount] = useState(5);
  const [classGrade, setClassGrade] = useState("11");
  const [examType, setExamType] = useState("JEE Main");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [rawOutput, setRawOutput] = useState("");
  const [saveResult, setSaveResult] = useState<{ inserted: number } | null>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    const topics = AI_TOPICS[subject] ?? [];
    if (topics.length > 0 && !topics.includes(topic)) setTopic(topics[0]);
  }, [subject, topic]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  const generate = useCallback(async () => {
    abortRef.current = false;
    setGenerating(true);
    setQuestions([]);
    setRawOutput("");
    setSaveResult(null);

    const pool = DEMO_POOLS[subject] || DEMO_POOLS.Physics;
    const selected = pool.slice(0, Math.min(count, pool.length));

    const jsonStr = JSON.stringify(selected, null, 2);
    let displayed = "";

    for (let i = 0; i < jsonStr.length; i++) {
      if (abortRef.current) break;
      displayed += jsonStr[i];
      if (i % 3 === 0) {
        setRawOutput(displayed);
        await new Promise((r) => setTimeout(r, 8));
      }
    }
    setRawOutput(displayed);

    if (!abortRef.current) {
      await new Promise((r) => setTimeout(r, 400));
      const qs: GeneratedQuestion[] = selected.map((q) => ({
        ...q,
        difficulty: difficulty === "mixed" ? q.difficulty : difficulty,
        selected: true,
        editing: false,
      }));
      setQuestions(qs);
      setRawOutput("");
    }

    setGenerating(false);
  }, [subject, count, difficulty]);

  const toggleSelect = (idx: number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, selected: !q.selected } : q));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleEdit = (idx: number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, editing: !q.editing } : q));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (field.startsWith("options.")) {
          const key = field.split(".")[1] as keyof typeof q.options;
          return { ...q, options: { ...q.options, [key]: value } };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const saveToBank = useCallback(async () => {
    const sel = questions.filter((q) => q.selected);
    if (sel.length === 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaveResult({ inserted: sel.length });
    setQuestions([]);
    setSaving(false);
  }, [questions]);

  const selectedCount = questions.filter((q) => q.selected).length;
  const currentGroup = MODEL_GROUPS.find((g) => g.provider === provider);
  const currentModel = currentGroup?.models.find((m) => m.id === model);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) { abortRef.current = true; onClose(); } }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-primary">AI Question Generator</h2>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">DEMO</span>
          </div>
          <button onClick={() => { abortRef.current = true; onClose(); }} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {saveResult && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <Check size={16} /> Saved {saveResult.inserted} question(s) to the Question Bank!
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {AI_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Topic</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {(AI_TOPICS[subject] ?? []).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Count (1-20)</label>
              <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value))))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Class</label>
              <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Style</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option>JEE Main</option>
                <option>JEE Advanced</option>
                <option>NEET</option>
                <option>CBSE Board</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative" ref={modelRef}>
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm hover:border-slate-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentGroup?.color }} />
                <span className="text-slate-600">{currentGroup?.label} · {currentModel?.label}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {modelOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-72 overflow-hidden">
                  {MODEL_GROUPS.map((group) => (
                    <div key={group.provider}>
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{group.label}</span>
                      </div>
                      {group.models.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setProvider(group.provider); setModel(m.id); setModelOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${provider === group.provider && model === m.id ? "text-primary font-medium bg-blue-50" : "text-slate-700"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? "Generating..." : "Generate Questions"}
            </button>
          </div>

          {generating && rawOutput && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {rawOutput}
              <span className="inline-block w-1 h-3 bg-secondary animate-pulse ml-0.5" />
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  {questions.length} question(s) generated · {selectedCount} selected
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, selected: true })))} className="text-xs text-secondary hover:underline">Select All</button>
                  <button onClick={() => setQuestions((prev) => prev.map((q) => ({ ...q, selected: false })))} className="text-xs text-slate-500 hover:underline">Deselect All</button>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className={`border rounded-xl p-4 transition-colors ${q.selected ? "border-secondary/30 bg-teal-50/30" : "border-slate-200 bg-white opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(idx)} className="mt-1 flex-shrink-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${q.selected ? "bg-secondary border-secondary" : "border-slate-300"}`}>
                        {q.selected && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-500">Q{idx + 1}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-green-100 text-green-700" : q.difficulty === "hard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-400">Answer: {q.correctAnswer}</span>
                      </div>

                      {q.editing ? (
                        <div className="space-y-2 mt-2">
                          <textarea value={q.questionText} onChange={(e) => updateQuestion(idx, "questionText", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} />
                          <div className="grid grid-cols-2 gap-2">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className={`text-xs font-bold w-5 ${q.correctAnswer === key ? "text-green-600" : "text-slate-500"}`}>{key}.</span>
                                <input value={q.options[key]} onChange={(e) => updateQuestion(idx, `options.${key}`, e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1 text-sm" />
                              </div>
                            ))}
                          </div>
                          <select value={q.correctAnswer} onChange={(e) => updateQuestion(idx, "correctAnswer", e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-sm">
                            {["A", "B", "C", "D"].map((k) => <option key={k}>{k}</option>)}
                          </select>
                          <textarea value={q.solution} onChange={(e) => updateQuestion(idx, "solution", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Solution..." />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-primary">{q.questionText}</p>
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                              <div key={key} className={`text-xs px-2 py-1 rounded ${q.correctAnswer === key ? "bg-green-100 text-green-800 font-medium" : "text-slate-600"}`}>
                                {key}. {q.options[key]}
                              </div>
                            ))}
                          </div>
                          {q.solution && <p className="text-xs text-slate-500 mt-2 italic">{q.solution}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => toggleEdit(idx)} className="p-1.5 text-slate-400 hover:text-secondary rounded hover:bg-slate-100" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => removeQuestion(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button onClick={generate} disabled={generating} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors">
              <RotateCcw size={14} /> Regenerate
            </button>
            <button
              onClick={saveToBank}
              disabled={saving || selectedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : `Save ${selectedCount} Question(s) to Bank`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminQuestionBank() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [classGrade, setClassGrade] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const filtered = bankQuestions.filter((q) => {
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
        <button
          onClick={() => setAiOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold flex items-center gap-1.5 hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />Generate with AI
        </button>
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
              {SUBJECTS_FILTER.map((s) => <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground">
              {DIFFICULTIES_FILTER.map((d) => <option key={d} value={d}>{d === "All" ? "All Difficulties" : d}</option>)}
            </select>
            <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground">
              {CLASSES_FILTER.map((c) => <option key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</option>)}
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
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{q.topic}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
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

      {aiOpen && <AIQuestionGenerator onClose={() => setAiOpen(false)} />}
    </PortalLayout>
  );
}
