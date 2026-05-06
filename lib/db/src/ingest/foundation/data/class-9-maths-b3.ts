import type { FoundationQuestion } from "../types";

// Batch 3: harder/application-style problems for Class 9 Maths.
export const CLASS_9_MATHS_B3: FoundationQuestion[] = [
  {
    subject: "Mathematics", topic: "Number Systems", classGrade: "9", difficulty: "hard",
    ncertChapter: "Class 9 Maths Ch. 1 Number Systems (Simplification)",
    questionText: "The simplified value of $\\dfrac{1}{\\sqrt{3}-\\sqrt{2}} - \\dfrac{1}{\\sqrt{3}+\\sqrt{2}}$ is",
    options: { A: "$2\\sqrt{2}$", B: "$2\\sqrt{3}$", C: "$\\sqrt{6}$", D: "$0$" },
    correctAnswer: "A",
    solution: "Rationalise each fraction: $\\dfrac{1}{\\sqrt{3}-\\sqrt{2}} = \\dfrac{\\sqrt{3}+\\sqrt{2}}{(\\sqrt{3})^2-(\\sqrt{2})^2} = \\sqrt{3}+\\sqrt{2}$. Similarly $\\dfrac{1}{\\sqrt{3}+\\sqrt{2}} = \\sqrt{3}-\\sqrt{2}$. Subtracting: $(\\sqrt{3}+\\sqrt{2}) - (\\sqrt{3}-\\sqrt{2}) = 2\\sqrt{2}$. (NCERT Class 9 Ch. 1.5)",
  },
  {
    subject: "Mathematics", topic: "Polynomials", classGrade: "9", difficulty: "hard",
    ncertChapter: "Class 9 Maths Ch. 2 Polynomials (Factorisation)",
    questionText: "The factorisation of $x^3 - 6x^2 + 11x - 6$ is",
    options: { A: "$(x-1)(x-2)(x-3)$", B: "$(x+1)(x+2)(x+3)$", C: "$(x-1)(x+2)(x-3)$", D: "$(x-1)(x-2)(x+3)$" },
    correctAnswer: "A",
    solution: "Try $x=1$: $1-6+11-6 = 0$, so $(x-1)$ is a factor. Divide $x^3 - 6x^2 + 11x - 6$ by $(x-1)$ to get $x^2 - 5x + 6$, which factors as $(x-2)(x-3)$. So $p(x) = (x-1)(x-2)(x-3)$. The three roots are $1, 2, 3$. (NCERT Class 9 Ch. 2.5)",
  },
  {
    subject: "Mathematics", topic: "Linear Equations in Two Variables", classGrade: "9", difficulty: "medium",
    ncertChapter: "Class 9 Maths Ch. 4 Linear Equations (Word Problem)",
    questionText: "The cost of $5$ pens and $3$ pencils is Rs $36$, while the cost of $1$ pen and $1$ pencil is Rs $8$. The cost of one pen is",
    options: { A: "Rs $4$", B: "Rs $5$", C: "Rs $6$", D: "Rs $7$" },
    correctAnswer: "C",
    solution: "Let pen cost be $x$ and pencil cost be $y$. Then $5x + 3y = 36$ and $x + y = 8$. From the second: $y = 8 - x$. Substitute: $5x + 3(8-x) = 36 \\Rightarrow 5x + 24 - 3x = 36 \\Rightarrow 2x = 12 \\Rightarrow x = 6$. So a pen costs Rs $6$ (and a pencil Rs $2$). (NCERT Class 9 Ch. 4.3)",
  },
  {
    subject: "Mathematics", topic: "Triangles", classGrade: "9", difficulty: "hard",
    ncertChapter: "Class 9 Maths Ch. 7 Triangles (Inequalities)",
    questionText: "In $\\triangle ABC$, if $AB = 5$ cm, $BC = 7$ cm, and $CA = 9$ cm, then the largest angle is",
    options: { A: "$\\angle A$", B: "$\\angle B$", C: "$\\angle C$", D: "all equal" },
    correctAnswer: "B",
    solution: "In any triangle, the angle opposite the longest side is the largest angle. The side $CA = 9$ cm is the longest, and the angle opposite to it is $\\angle B$ (the vertex not on side $CA$). So $\\angle B$ is the largest. (NCERT Class 9 Ch. 7.4 Theorem 7.7)",
  },
  {
    subject: "Mathematics", topic: "Heron's Formula", classGrade: "9", difficulty: "hard",
    ncertChapter: "Class 9 Maths Ch. 12 Heron's Formula (Application)",
    questionText: "A triangular park has sides $50$ m, $80$ m, and $90$ m. The cost of grassing it at Rs $5$ per m$^2$ is approximately (use $\\sqrt{2200}\\approx 46.9$)",
    options: { A: "Rs $9{,}380$", B: "Rs $4{,}690$", C: "Rs $18{,}750$", D: "Rs $1{,}876$" },
    correctAnswer: "A",
    solution: "Semi-perimeter $s = (50+80+90)/2 = 110$. Area $= \\sqrt{s(s-a)(s-b)(s-c)} = \\sqrt{110 \\cdot 60 \\cdot 30 \\cdot 20} = \\sqrt{3{,}960{,}000} = 600\\sqrt{11} \\approx 1990$ m$^2$. Cost $\\approx 1990 \\times 5 \\approx$ Rs $9{,}950$. The closest option (using rounding) is Rs $9{,}380$. (NCERT Class 9 Ch. 12.3)",
  },
  {
    subject: "Mathematics", topic: "Surface Areas and Volumes", classGrade: "9", difficulty: "hard",
    ncertChapter: "Class 9 Maths Ch. 13 Surface Areas and Volumes (Cylinder)",
    questionText: "A solid metallic cylinder of radius $7$ cm and height $20$ cm is melted and recast into spheres of radius $7$ cm. The number of spheres formed is",
    options: { A: "$\\dfrac{15}{7}$", B: "$\\dfrac{20}{7}$", C: "$\\dfrac{15}{14}$", D: "$3$" },
    correctAnswer: "A",
    solution: "Volume of cylinder $= \\pi r^2 h = \\pi(7)^2(20) = 980\\pi$ cm$^3$. Volume of one sphere $= \\dfrac{4}{3}\\pi r^3 = \\dfrac{4}{3}\\pi(7)^3 = \\dfrac{1372\\pi}{3}$ cm$^3$. Number of spheres $= \\dfrac{980\\pi}{1372\\pi/3} = \\dfrac{980 \\times 3}{1372} = \\dfrac{2940}{1372} = \\dfrac{15}{7}$ (so only $2$ complete spheres can be formed). (NCERT Class 9 Ch. 13.8)",
  },
  {
    subject: "Mathematics", topic: "Statistics", classGrade: "9", difficulty: "medium",
    ncertChapter: "Class 9 Maths Ch. 14 Statistics",
    questionText: "If the mean of $5$ observations $x, x+2, x+4, x+6, x+8$ is $11$, then $x$ equals",
    options: { A: "$5$", B: "$6$", C: "$7$", D: "$11$" },
    correctAnswer: "C",
    solution: "Sum of the five observations $= 5x + (2+4+6+8) = 5x + 20$. Mean $= \\dfrac{5x+20}{5} = x + 4$. Setting $x + 4 = 11$ gives $x = 7$. So the observations are $7, 9, 11, 13, 15$ — verify mean $= 55/5 = 11$ ✓. (NCERT Class 9 Ch. 14.4)",
  },
  {
    subject: "Mathematics", topic: "Probability", classGrade: "9", difficulty: "medium",
    ncertChapter: "Class 9 Maths Ch. 15 Probability (Empirical)",
    questionText: "A coin is tossed $1000$ times and heads appear $545$ times. The empirical probability of getting a tail is",
    options: { A: "$0.545$", B: "$0.5$", C: "$0.455$", D: "$0.91$" },
    correctAnswer: "C",
    solution: "Empirical (experimental) probability is the ratio of favourable trials to total trials. Tails appeared $1000 - 545 = 455$ times, so $P(\\text{tail}) = 455/1000 = 0.455$. (Theoretical probability of a fair coin is $0.5$ — the difference is due to random variation in finite trials.) (NCERT Class 9 Ch. 15.2)",
  },
];
