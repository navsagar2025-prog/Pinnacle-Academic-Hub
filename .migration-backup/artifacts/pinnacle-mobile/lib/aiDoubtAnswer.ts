// AI doubt-answer generator (demo).
//
// Produces a structured, subject-aware "quick answer" that looks and
// reads like a real LLM response. To swap this for a real Gemini call
// later, replace `generateAIAnswer()` with a fetch to a backend route
// that proxies `ai.models.generateContent({ model: "gemini-2.5-flash", ... })`.
//
// All consumers should keep using the same Promise<AIAnswer> contract.

export type AIAnswer = {
  summary: string;
  steps: string[];
  finalNote: string;
  sources: string[];
  generatedAt: string;
};

const SUBJECT_LIBRARIES: Record<
  string,
  { keywords: string[]; concept: string; framework: string; sources: string[] }[]
> = {
  Physics: [
    {
      keywords: ["thermo", "heat", "entropy", "carnot", "law of thermodynamics"],
      concept: "Thermodynamics",
      framework:
        "Identify the system + surroundings, write the first-law equation (ΔU = Q − W), and substitute the given quantities with correct sign conventions.",
      sources: ["NCERT Class 11 — Ch. 12", "HC Verma Vol 1 — Thermodynamics"],
    },
    {
      keywords: ["kinematic", "velocity", "acceleration", "motion", "projectile"],
      concept: "Kinematics",
      framework:
        "Choose a positive direction, list known quantities (u, v, a, s, t), and pick the correct equation of motion. For 2-D problems, treat horizontal & vertical components independently.",
      sources: ["NCERT Class 11 — Ch. 3 & 4", "DC Pandey — Mechanics 1"],
    },
    {
      keywords: ["wave", "optics", "interference", "diffraction", "young"],
      concept: "Wave Optics",
      framework:
        "Use the path-difference condition (Δ = nλ for maxima, (n+½)λ for minima). For YDSE, fringe width β = λD/d.",
      sources: ["NCERT Class 12 — Ch. 10", "HC Verma Vol 1 — Light Waves"],
    },
    {
      keywords: ["electric", "circuit", "current", "ohm", "resistor", "kirchhoff"],
      concept: "Current Electricity",
      framework:
        "Apply Kirchhoff's voltage law around each loop and current law at each node. Reduce series/parallel combinations before writing the equations.",
      sources: ["NCERT Class 12 — Ch. 3", "HC Verma Vol 2 — Electric Current"],
    },
  ],
  Chemistry: [
    {
      keywords: ["organic", "mechanism", "reaction", "sn1", "sn2", "alkene"],
      concept: "Organic Reaction Mechanisms",
      framework:
        "Identify the substrate type, classify the reaction (substitution / addition / elimination), draw the transition state, and predict the major product using stability of the intermediate.",
      sources: ["NCERT Class 12 — Haloalkanes & Haloarenes", "Morrison & Boyd"],
    },
    {
      keywords: ["equilibrium", "kc", "kp", "le chatelier"],
      concept: "Chemical Equilibrium",
      framework:
        "Write the balanced equation, set up the ICE table (Initial, Change, Equilibrium), substitute into Kc / Kp, and solve.",
      sources: ["NCERT Class 11 — Ch. 7", "P. Bahadur — Physical Chemistry"],
    },
    {
      keywords: ["mole", "stoichiometry", "concentration"],
      concept: "Mole Concept",
      framework:
        "Convert all quantities to moles, identify the limiting reagent, apply mole ratios from the balanced equation, then convert back to the requested unit.",
      sources: ["NCERT Class 11 — Ch. 1"],
    },
  ],
  Mathematics: [
    {
      keywords: ["integral", "integration", "antiderivative"],
      concept: "Integration",
      framework:
        "Pick the technique: standard form, substitution, integration by parts (LIATE), or partial fractions. After integrating, always restore the original variable and add +C for indefinite integrals.",
      sources: ["NCERT Class 12 — Ch. 7", "RD Sharma Vol 2"],
    },
    {
      keywords: ["limit", "continuity", "differentia"],
      concept: "Limits & Differentiation",
      framework:
        "Try direct substitution first. If indeterminate (0/0 or ∞/∞), apply L'Hôpital's rule, factor & cancel, or rationalise. For continuity, check LHL = RHL = f(c).",
      sources: ["NCERT Class 11 — Ch. 13", "Cengage — Calculus"],
    },
    {
      keywords: ["matrix", "determinant", "inverse"],
      concept: "Matrices & Determinants",
      framework:
        "Use row-reduction or the adjoint formula A⁻¹ = (1/|A|) · adj(A). For systems Ax = b, the unique solution exists iff |A| ≠ 0.",
      sources: ["NCERT Class 12 — Ch. 3 & 4"],
    },
    {
      keywords: ["probability", "permutation", "combination"],
      concept: "Probability & Combinatorics",
      framework:
        "Identify whether order matters (P) or not (C). For probability, list the sample space, then P(E) = favorable / total. For conditional cases, apply Bayes' theorem.",
      sources: ["NCERT Class 11 — Ch. 16", "RD Sharma Vol 1"],
    },
  ],
  Biology: [
    {
      keywords: ["cell", "mitochondria", "organelle", "membrane"],
      concept: "Cell Biology",
      framework:
        "Sketch the labelled cell, identify the relevant organelle, and state its function in the process being asked about.",
      sources: ["NCERT Class 11 — Ch. 8 & 9"],
    },
    {
      keywords: ["physiology", "digestion", "respiration", "circulation"],
      concept: "Human Physiology",
      framework:
        "Trace the system step by step (organs involved → process → output). Mention the key enzymes/hormones at each stage.",
      sources: ["NCERT Class 11 — Unit IV"],
    },
    {
      keywords: ["genetic", "dna", "gene", "mendel", "inheritance"],
      concept: "Genetics & Inheritance",
      framework:
        "Identify the cross type (mono / di-hybrid), draw the Punnett square, and apply Mendelian ratios (3:1, 9:3:3:1).",
      sources: ["NCERT Class 12 — Ch. 5 & 6"],
    },
  ],
};

function pickTopic(subject: string, question: string) {
  const q = question.toLowerCase();
  const lib = SUBJECT_LIBRARIES[subject] ?? [];
  for (const entry of lib) {
    if (entry.keywords.some((k) => q.includes(k))) return entry;
  }
  return lib[0];
}

function generateGenericSteps(question: string): string[] {
  // Try to detect the question form so the steps don't read identically every time.
  const q = question.trim();
  const isHowMany = /how many|how much|find/i.test(q);
  const isWhy = /\bwhy\b|explain|reason/i.test(q);
  const isProve = /\bprove\b|show that|derive/i.test(q);

  if (isProve) {
    return [
      "Restate what you need to prove and list the given conditions explicitly.",
      "Choose the most efficient technique (algebraic manipulation, induction, contradiction, or geometric construction).",
      "Carry out each transformation, justifying every step with a named theorem or identity.",
      "Conclude by re-stating the result you set out to prove (Q.E.D.).",
    ];
  }
  if (isWhy) {
    return [
      "Identify the underlying concept the question is testing.",
      "State the governing law / principle in one clean sentence.",
      "Explain why the situation in the question follows from that law — link cause to effect.",
      "Mention one common misconception and why it's wrong, to lock the idea in.",
    ];
  }
  if (isHowMany) {
    return [
      "List every quantity given and the unit it's in. Convert to SI / consistent units.",
      "Pick the formula whose unknowns match what you need to find.",
      "Substitute carefully, keeping track of signs and powers of 10.",
      "Sanity-check the magnitude of the answer against a real-world reference.",
    ];
  }
  return [
    "Read the question twice and underline the quantities given vs the quantity asked.",
    "Identify which chapter/concept it belongs to and recall the relevant formula.",
    "Apply the formula step by step, keeping units consistent throughout.",
    "Verify your answer by plugging it back into the original conditions.",
  ];
}

/**
 * Public entry point. Returns a Promise so the call site can show a
 * loading state — and so we can plug a real LLM in later without changing
 * the caller. Resolves after a short artificial delay so the user feels
 * the AI "thinking".
 */
export function generateAIAnswer(subject: string, question: string): Promise<AIAnswer> {
  const topic = pickTopic(subject, question);
  const summary = topic
    ? `This is a ${subject} question on **${topic.concept}**. ${topic.framework}`
    : `This is a ${subject} question. Approach it systematically using the framework below.`;

  const steps = generateGenericSteps(question);
  const finalNote = topic
    ? `Once you have the numerical answer, double-check using ${topic.concept} consistency rules. If you're still stuck after this, post a follow-up — a teacher will jump in.`
    : `If you're still stuck after working through these steps, post a follow-up with what you tried and where you got stuck — a teacher will respond within 24h.`;

  const sources = topic?.sources ?? ["NCERT", "Coaching notes"];

  return new Promise((resolve) => {
    // 1.4-1.9s "thinking" delay
    const delay = 1400 + Math.random() * 500;
    setTimeout(() => {
      resolve({
        summary,
        steps,
        finalNote,
        sources,
        generatedAt: new Date().toISOString(),
      });
    }, delay);
  });
}
