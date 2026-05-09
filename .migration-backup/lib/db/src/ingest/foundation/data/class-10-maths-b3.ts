import type { FoundationQuestion } from "../types";

// Batch 3: harder/exam-style problems for Class 10 Maths.
export const CLASS_10_MATHS_B3: FoundationQuestion[] = [
  {
    subject: "Mathematics", topic: "Real Numbers", classGrade: "10", difficulty: "medium",
    ncertChapter: "Class 10 Maths Ch. 1 Real Numbers (HCF & LCM)",
    questionText: "If the HCF of two numbers is $13$ and their product is $1989$, then their LCM is",
    options: { A: "$153$", B: "$169$", C: "$183$", D: "$13$" },
    correctAnswer: "A",
    solution: "Use the identity $\\text{HCF}(a,b) \\times \\text{LCM}(a,b) = a \\times b$ for any two positive integers. So $\\text{LCM} = \\dfrac{1989}{13} = 153$. (NCERT Class 10 Maths Ch. 1.3)",
  },
  {
    subject: "Mathematics", topic: "Quadratic Equations", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 4 Quadratic Equations (Equal Roots)",
    questionText: "The value of $k$ for which the quadratic $kx^2 - 4x + 1 = 0$ has equal roots is",
    options: { A: "$2$", B: "$4$", C: "$8$", D: "$16$" },
    correctAnswer: "B",
    solution: "For equal (repeated) real roots, the discriminant must be zero: $D = b^2 - 4ac = 0$. With $a=k, b=-4, c=1$: $(-4)^2 - 4(k)(1) = 0 \\Rightarrow 16 - 4k = 0 \\Rightarrow k = 4$. (NCERT Class 10 Maths Ch. 4.4)",
  },
  {
    subject: "Mathematics", topic: "Arithmetic Progressions", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 5 Arithmetic Progressions (Sum)",
    questionText: "How many terms of the AP $9, 17, 25, \\ldots$ must be taken so that their sum is $636$?",
    options: { A: "$9$", B: "$10$", C: "$11$", D: "$12$" },
    correctAnswer: "D",
    solution: "Here $a = 9, d = 8$. Use $S_n = \\tfrac{n}{2}[2a + (n-1)d] = 636$: $\\tfrac{n}{2}[18 + 8(n-1)] = 636$, i.e. $n[18 + 8n - 8] = 1272$, so $n[8n + 10] = 1272$, i.e. $8n^2 + 10n - 1272 = 0$, i.e. $4n^2 + 5n - 636 = 0$. By the quadratic formula, $n = \\dfrac{-5 \\pm \\sqrt{25 + 10176}}{8} = \\dfrac{-5 \\pm \\sqrt{10201}}{8} = \\dfrac{-5 \\pm 101}{8}$. The positive root is $n = 96/8 = 12$. (NCERT Class 10 Maths Ch. 5.4)",
  },
  {
    subject: "Mathematics", topic: "Triangles (Similarity)", classGrade: "10", difficulty: "medium",
    ncertChapter: "Class 10 Maths Ch. 6 Triangles (BPT)",
    questionText: "In $\\triangle ABC$, $DE \\parallel BC$ with $D$ on $AB$ and $E$ on $AC$. If $AD = 4$ cm, $DB = 6$ cm, and $AE = 5$ cm, then $EC$ equals",
    options: { A: "$3$ cm", B: "$6$ cm", C: "$7.5$ cm", D: "$10$ cm" },
    correctAnswer: "C",
    solution: "By the Basic Proportionality Theorem (Thales' theorem), if a line drawn parallel to one side of a triangle cuts the other two sides, it divides them in the same ratio: $\\dfrac{AD}{DB} = \\dfrac{AE}{EC}$. So $\\dfrac{4}{6} = \\dfrac{5}{EC} \\Rightarrow EC = \\dfrac{5 \\times 6}{4} = 7.5$ cm. (NCERT Class 10 Maths Ch. 6.2 Theorem 6.1)",
  },
  {
    subject: "Mathematics", topic: "Coordinate Geometry (Collinearity)", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 7 Coordinate Geometry",
    questionText: "The points $(1, 2)$, $(3, k)$, and $(5, 6)$ are collinear when $k$ equals",
    options: { A: "$3$", B: "$4$", C: "$5$", D: "$6$" },
    correctAnswer: "B",
    solution: "Three points are collinear iff the area of the triangle they form is zero. Using the area formula $\\tfrac{1}{2}|x_1(y_2-y_3) + x_2(y_3-y_1) + x_3(y_1-y_2)| = 0$: $1(k-6) + 3(6-2) + 5(2-k) = 0 \\Rightarrow k - 6 + 12 + 10 - 5k = 0 \\Rightarrow -4k + 16 = 0 \\Rightarrow k = 4$. Alternatively, the slope between $(1,2)$ and $(5,6)$ is $1$, so $(3,k)$ on the same line gives $k = 2 + (3-1)(1) = 4$. (NCERT Class 10 Maths Ch. 7.4)",
  },
  {
    subject: "Mathematics", topic: "Introduction to Trigonometry (Identity)", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 8 Introduction to Trigonometry (Identities)",
    questionText: "The value of $\\dfrac{1 - \\cos^2\\theta}{\\sin^2\\theta}$ is",
    options: { A: "$0$", B: "$1$", C: "$\\sin^2 \\theta$", D: "$\\tan^2\\theta$" },
    correctAnswer: "B",
    solution: "From the Pythagorean identity $\\sin^2\\theta + \\cos^2\\theta = 1$, we get $1 - \\cos^2\\theta = \\sin^2\\theta$. Therefore $\\dfrac{1 - \\cos^2\\theta}{\\sin^2\\theta} = \\dfrac{\\sin^2\\theta}{\\sin^2\\theta} = 1$ (for $\\sin\\theta \\ne 0$). (NCERT Class 10 Maths Ch. 8.4)",
  },
  {
    subject: "Mathematics", topic: "Some Applications of Trigonometry", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 9 Some Applications of Trigonometry",
    questionText: "From a point on the ground, the angle of elevation of the top of a tower is $30^\\circ$. After walking $30$ m towards the tower, the angle becomes $60^\\circ$. The height of the tower is",
    options: { A: "$10\\sqrt{3}$ m", B: "$15\\sqrt{3}$ m", C: "$20\\sqrt{3}$ m", D: "$30$ m" },
    correctAnswer: "B",
    solution: "Let $h$ be the tower height and $x$ the horizontal distance from the second point to the tower. From the second point: $\\tan 60^\\circ = h/x \\Rightarrow h = x\\sqrt{3}$. From the first point (which is $x+30$ away): $\\tan 30^\\circ = h/(x+30) \\Rightarrow h = (x+30)/\\sqrt{3}$. Equating: $x\\sqrt{3} = (x+30)/\\sqrt{3} \\Rightarrow 3x = x + 30 \\Rightarrow x = 15$. So $h = 15\\sqrt{3}$ m $\\approx 25.98$ m. (NCERT Class 10 Maths Ch. 9.2)",
  },
  {
    subject: "Mathematics", topic: "Areas Related to Circles", classGrade: "10", difficulty: "hard",
    ncertChapter: "Class 10 Maths Ch. 12 Areas Related to Circles",
    questionText: "The area of the ring (annulus) bounded by two concentric circles of radii $14$ cm and $7$ cm is (take $\\pi = 22/7$)",
    options: { A: "$154$ cm$^2$", B: "$308$ cm$^2$", C: "$462$ cm$^2$", D: "$616$ cm$^2$" },
    correctAnswer: "C",
    solution: "Area of an annulus $= \\pi(R^2 - r^2)$. So $= \\dfrac{22}{7}(14^2 - 7^2) = \\dfrac{22}{7}(196 - 49) = \\dfrac{22}{7}(147) = 22 \\times 21 = 462$ cm$^2$. (NCERT Class 10 Maths Ch. 12.4)",
  },
];
