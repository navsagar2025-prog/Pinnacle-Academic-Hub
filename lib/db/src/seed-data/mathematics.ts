import { SeedQuestion, pickYear, pickDifficulty } from './types';

function makeQ(
  topic: string,
  classGrade: string,
  questionText: string,
  correct: string,
  distractors: string[],
  solution: string,
): SeedQuestion {
  const all = [correct, distractors[0], distractors[1], distractors[2]];
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const opts = ['', '', '', ''];
  let correctPos = 0;
  for (let i = 0; i < 4; i++) {
    opts[i] = all[idx[i]];
    if (idx[i] === 0) correctPos = i;
  }
  const labels = ['A', 'B', 'C', 'D'] as const;
  return {
    subject: 'Mathematics',
    topic,
    classGrade,
    year: pickYear(),
    difficulty: pickDifficulty(),
    questionType: 'mcq',
    questionText,
    options: { A: opts[0], B: opts[1], C: opts[2], D: opts[3] },
    correctAnswer: labels[correctPos],
    solution,
    marks: 4,
  };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

function frac(num: number, den: number): string {
  if (den === 0) return 'undefined';
  if (num === 0) return '0';
  const g = gcd(num, den);
  let n = num / g, d = den / g;
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

function topicSetsRelations(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Sets, Relations & Functions';
  // Inclusion-exclusion
  for (let p = 12; p <= 50; p += 2) {
    for (let q = 6; q <= 28; q += 4) {
      const r = Math.max(p, q) + ((p + q) % 7) + 2;
      const inter = p + q - r;
      if (inter <= 0 || inter > Math.min(p, q)) continue;
      Q.push(makeQ(topic, '11',
        `If n(A) = ${p}, n(B) = ${q} and n(A ∪ B) = ${r}, then n(A ∩ B) equals:`,
        `${inter}`,
        [`${inter + 2}`, `${Math.max(1, inter - 1)}`, `${p + q + r}`],
        `n(A ∩ B) = n(A) + n(B) − n(A ∪ B) = ${p} + ${q} − ${r} = ${inter}.`));
    }
  }
  // Subsets
  for (let n = 1; n <= 12; n++) {
    const s = 2 ** n;
    Q.push(makeQ(topic, '11',
      `The number of subsets of a set containing ${n} elements is:`,
      `${s}`,
      [`${s / 2 || 1}`, `${s + 1}`, `${n * n}`],
      `Number of subsets = 2^n = 2^${n} = ${s}.`));
    Q.push(makeQ(topic, '11',
      `The number of proper subsets of a set with ${n} elements is:`,
      `${s - 1}`,
      [`${s}`, `${s - 2 < 0 ? 0 : s - 2}`, `${2 * n}`],
      `Proper subsets = 2^n − 1 = ${s} − 1 = ${s - 1}.`));
  }
  // Linear function evaluation
  for (let a = 2; a <= 9; a++) {
    for (let b = -5; b <= 5; b++) {
      for (let c = 1; c <= 4; c++) {
        const v = a * c + b;
        Q.push(makeQ(topic, '11',
          `If f(x) = ${a}x ${b >= 0 ? '+ ' + b : '− ' + (-b)}, then f(${c}) =`,
          `${v}`,
          [`${v + a}`, `${v - 1}`, `${a + b + c}`],
          `f(${c}) = ${a}·${c} ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${v}.`));
        if (Q.length > 200) break;
      }
      if (Q.length > 200) break;
    }
    if (Q.length > 200) break;
  }
  // Number of relations
  for (let m = 2; m <= 5; m++) {
    for (let n = 2; n <= 4; n++) {
      const r = 2 ** (m * n);
      Q.push(makeQ(topic, '11',
        `If n(A) = ${m} and n(B) = ${n}, the number of relations from A to B is:`,
        `${r}`,
        [`${2 ** (m + n)}`, `${m * n}`, `${(m * n) ** 2}`],
        `Number of relations = 2^(m·n) = 2^${m * n} = ${r}.`));
    }
  }
  // Domain of square root
  for (let a = 1; a <= 15; a++) {
    Q.push(makeQ(topic, '11',
      `The domain of the function f(x) = √(x − ${a}) is:`,
      `[${a}, ∞)`,
      [`(${a}, ∞)`, `(−∞, ${a}]`, `R`],
      `For real values, x − ${a} ≥ 0 ⇒ x ≥ ${a}.`));
  }
  return Q;
}

function topicComplex(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Complex Numbers';
  // Modulus
  for (let a = -8; a <= 8; a++) {
    for (let b = 1; b <= 8; b++) {
      const m = Math.sqrt(a * a + b * b);
      const ms = Number.isInteger(m) ? `${m}` : `√${a * a + b * b}`;
      Q.push(makeQ(topic, '11',
        `The modulus of the complex number ${a} + ${b}i is:`,
        ms,
        [`${Math.abs(a) + b}`, `${a * a + b * b}`, `${Math.abs(a - b)}`],
        `|z| = √(a² + b²) = √(${a * a} + ${b * b}) = ${ms}.`));
      if (Q.length > 60) break;
    }
    if (Q.length > 60) break;
  }
  // Conjugate
  for (let a = -6; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      Q.push(makeQ(topic, '11',
        `The conjugate of ${a} + ${b}i is:`,
        `${a} − ${b}i`,
        [`${-a} + ${b}i`, `${-a} − ${b}i`, `${a} + ${b}i`],
        `Conjugate of (a + bi) is (a − bi).`));
      if (Q.length > 110) break;
    }
    if (Q.length > 110) break;
  }
  // Powers of i
  for (let k = 4; k <= 60; k++) {
    const r = ((k % 4) + 4) % 4;
    const val = r === 0 ? '1' : r === 1 ? 'i' : r === 2 ? '−1' : '−i';
    Q.push(makeQ(topic, '11',
      `The value of i^${k} is:`,
      val,
      ['1', '−1', 'i'].filter(x => x !== val).slice(0, 3),
      `i has cycle length 4: i^${k} = i^${r} = ${val}.`));
    if (Q.length > 165) break;
  }
  // Addition / multiplication
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 5; b++) {
      for (let c = 1; c <= 5; c++) {
        const re = a + c, im = b + b;
        Q.push(makeQ(topic, '11',
          `(${a} + ${b}i) + (${c} + ${b}i) =`,
          `${re} + ${im}i`,
          [`${re} + ${b}i`, `${a + b + c} + ${im}i`, `${re - 1} + ${im + 1}i`],
          `Add real and imaginary parts: (${a}+${c}) + (${b}+${b})i = ${re} + ${im}i.`));
        if (Q.length > 220) break;
      }
      if (Q.length > 220) break;
    }
    if (Q.length > 220) break;
  }
  return Q;
}

function topicQuadratic(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Quadratic Equations';
  // Sum and product of roots
  for (let a = 1; a <= 6; a++) {
    for (let b = -10; b <= 10; b++) {
      for (let c = -10; c <= 10; c++) {
        if (b === 0 && c === 0) continue;
        const sum = -b / a;
        const prod = c / a;
        Q.push(makeQ(topic, '11',
          `For the quadratic ${a}x² ${b >= 0 ? '+ ' + b : '− ' + (-b)}x ${c >= 0 ? '+ ' + c : '− ' + (-c)} = 0, the sum of the roots is:`,
          frac(-b, a),
          [frac(b, a), frac(c, a), frac(-c, a)],
          `Sum of roots = −b/a = ${frac(-b, a)}.`));
        if (Q.length > 80) break;
      }
      if (Q.length > 80) break;
    }
    if (Q.length > 80) break;
  }
  for (let a = 1; a <= 5; a++) {
    for (let b = -8; b <= 8; b++) {
      for (let c = -8; c <= 8; c++) {
        if (b === 0 && c === 0) continue;
        Q.push(makeQ(topic, '11',
          `For the quadratic ${a}x² ${b >= 0 ? '+ ' + b : '− ' + (-b)}x ${c >= 0 ? '+ ' + c : '− ' + (-c)} = 0, the product of the roots is:`,
          frac(c, a),
          [frac(-c, a), frac(b, a), frac(-b, a)],
          `Product of roots = c/a = ${frac(c, a)}.`));
        if (Q.length > 160) break;
      }
      if (Q.length > 160) break;
    }
    if (Q.length > 160) break;
  }
  // Discriminant and nature of roots
  for (let a = 1; a <= 4; a++) {
    for (let b = -6; b <= 6; b++) {
      for (let c = -6; c <= 6; c++) {
        const D = b * b - 4 * a * c;
        Q.push(makeQ(topic, '11',
          `The discriminant of ${a}x² ${b >= 0 ? '+ ' + b : '− ' + (-b)}x ${c >= 0 ? '+ ' + c : '− ' + (-c)} = 0 is:`,
          `${D}`,
          [`${b * b + 4 * a * c}`, `${4 * a * c - b * b}`, `${b * b - a * c}`],
          `D = b² − 4ac = ${b * b} − ${4 * a * c} = ${D}.`));
        if (Q.length > 240) break;
      }
      if (Q.length > 240) break;
    }
    if (Q.length > 240) break;
  }
  return Q;
}

function topicSequences(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Sequences & Series';
  // AP nth term
  for (let a = 1; a <= 10; a++) {
    for (let d = 1; d <= 8; d++) {
      for (let n = 5; n <= 12; n++) {
        const t = a + (n - 1) * d;
        Q.push(makeQ(topic, '11',
          `The ${n}th term of an A.P. whose first term is ${a} and common difference is ${d} is:`,
          `${t}`,
          [`${t + d}`, `${t - d}`, `${a * n + d}`],
          `T_n = a + (n − 1)d = ${a} + ${n - 1}·${d} = ${t}.`));
        if (Q.length > 90) break;
      }
      if (Q.length > 90) break;
    }
    if (Q.length > 90) break;
  }
  // Sum of AP
  for (let a = 1; a <= 8; a++) {
    for (let d = 1; d <= 6; d++) {
      for (let n = 5; n <= 15; n++) {
        const s = (n * (2 * a + (n - 1) * d)) / 2;
        Q.push(makeQ(topic, '11',
          `The sum of the first ${n} terms of an A.P. with first term ${a} and common difference ${d} is:`,
          `${s}`,
          [`${s + n}`, `${s - d}`, `${a * n + d * n}`],
          `S_n = (n/2)(2a + (n−1)d) = (${n}/2)(${2 * a} + ${(n - 1) * d}) = ${s}.`));
        if (Q.length > 180) break;
      }
      if (Q.length > 180) break;
    }
    if (Q.length > 180) break;
  }
  // GP nth term
  for (let a = 1; a <= 5; a++) {
    for (let r = 2; r <= 4; r++) {
      for (let n = 3; n <= 8; n++) {
        const t = a * r ** (n - 1);
        Q.push(makeQ(topic, '11',
          `The ${n}th term of a G.P. with first term ${a} and common ratio ${r} is:`,
          `${t}`,
          [`${a * r ** n}`, `${a + r * (n - 1)}`, `${a * (n - 1) * r}`],
          `T_n = a·r^(n−1) = ${a}·${r}^${n - 1} = ${t}.`));
        if (Q.length > 250) break;
      }
      if (Q.length > 250) break;
    }
    if (Q.length > 250) break;
  }
  // Sum of natural numbers
  for (let n = 5; n <= 30; n++) {
    const s = (n * (n + 1)) / 2;
    Q.push(makeQ(topic, '11',
      `The sum of the first ${n} natural numbers is:`,
      `${s}`,
      [`${s + n}`, `${n * n}`, `${(n * n + n) * 2}`],
      `Sum = n(n+1)/2 = ${n}·${n + 1}/2 = ${s}.`));
  }
  return Q;
}

function topicPermComb(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Permutations & Combinations';
  function fact(n: number): number { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; }
  function nPr(n: number, r: number): number { return fact(n) / fact(n - r); }
  function nCr(n: number, r: number): number { return fact(n) / (fact(r) * fact(n - r)); }
  // nPr
  for (let n = 4; n <= 10; n++) {
    for (let r = 1; r <= Math.min(n, 5); r++) {
      const v = nPr(n, r);
      Q.push(makeQ(topic, '11',
        `The value of ${n}P${r} is:`,
        `${v}`,
        [`${v + n}`, `${nCr(n, r)}`, `${fact(n)}`],
        `nPr = n!/(n−r)! = ${n}!/${n - r}! = ${v}.`));
    }
  }
  // nCr
  for (let n = 4; n <= 12; n++) {
    for (let r = 1; r <= Math.min(n, 6); r++) {
      const v = nCr(n, r);
      Q.push(makeQ(topic, '11',
        `The value of ${n}C${r} is:`,
        `${v}`,
        [`${v + 1}`, `${nPr(n, r)}`, `${v * 2}`],
        `nCr = n!/(r!(n−r)!) = ${v}.`));
    }
  }
  // Factorial values
  for (let n = 3; n <= 10; n++) {
    const v = fact(n);
    Q.push(makeQ(topic, '11',
      `The value of ${n}! is:`,
      `${v}`,
      [`${v + n}`, `${fact(n - 1)}`, `${n * n}`],
      `${n}! = ${n} × ${n - 1}! = ${v}.`));
  }
  // Arrangements of letters with all distinct
  const words = ['CAT', 'DOG', 'BOOK', 'TREE', 'STAR', 'PLANET', 'NUMBER', 'MATH', 'EXAM', 'PAPER', 'SOLVE', 'QUERY', 'GRAPH', 'PRIME', 'CUBE', 'SQUARE', 'LINE', 'POINT', 'CIRCLE', 'ANGLE'];
  for (const w of words) {
    const n = w.length;
    const distinct = new Set(w.split('')).size === n;
    if (!distinct) continue;
    const v = fact(n);
    Q.push(makeQ(topic, '11',
      `The number of arrangements of all letters of the word "${w}" is:`,
      `${v}`,
      [`${v + n}`, `${n * n}`, `${fact(n - 1)}`],
      `All ${n} letters distinct ⇒ arrangements = ${n}! = ${v}.`));
  }
  // Binomial coefficient C(n,2)
  for (let n = 4; n <= 30; n++) {
    const v = (n * (n - 1)) / 2;
    Q.push(makeQ(topic, '11',
      `The number of ways to choose 2 objects from ${n} distinct objects is:`,
      `${v}`,
      [`${v + n}`, `${n * n}`, `${v - 1}`],
      `C(n,2) = n(n−1)/2 = ${n}·${n - 1}/2 = ${v}.`));
  }
  return Q;
}

function topicMatrices(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Matrices & Determinants';
  // 2x2 determinants
  for (let a = -5; a <= 5; a++) {
    for (let b = -5; b <= 5; b++) {
      for (let c = -5; c <= 5; c++) {
        for (let d = -5; d <= 5; d++) {
          const det = a * d - b * c;
          Q.push(makeQ(topic, '12',
            `The determinant |[[${a}, ${b}], [${c}, ${d}]]| is:`,
            `${det}`,
            [`${a * d + b * c}`, `${a * c - b * d}`, `${b * c - a * d}`],
            `det = ad − bc = (${a})(${d}) − (${b})(${c}) = ${det}.`));
          if (Q.length > 150) break;
        }
        if (Q.length > 150) break;
      }
      if (Q.length > 150) break;
    }
    if (Q.length > 150) break;
  }
  // Trace
  for (let a = -8; a <= 8; a++) {
    for (let d = -8; d <= 8; d++) {
      const t = a + d;
      Q.push(makeQ(topic, '12',
        `The trace of the matrix [[${a}, 1], [2, ${d}]] is:`,
        `${t}`,
        [`${a * d}`, `${t + 3}`, `${a - d}`],
        `Trace = sum of diagonal entries = ${a} + ${d} = ${t}.`));
      if (Q.length > 280) break;
    }
    if (Q.length > 280) break;
  }
  return Q;
}

function topicTrigonometry(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Trigonometry';
  // Standard angle values
  const std: Array<[string, string, string, string]> = [
    ['0°', '0', '1', '0'],
    ['30°', '1/2', '√3/2', '1/√3'],
    ['45°', '1/√2', '1/√2', '1'],
    ['60°', '√3/2', '1/2', '√3'],
    ['90°', '1', '0', 'undefined'],
    ['180°', '0', '−1', '0'],
    ['270°', '−1', '0', 'undefined'],
    ['360°', '0', '1', '0'],
  ];
  for (const [ang, s, c, t] of std) {
    Q.push(makeQ(topic, '11',
      `The value of sin ${ang} is:`,
      s,
      ['1', '0', '−1'].filter(x => x !== s).slice(0, 3),
      `By standard table, sin ${ang} = ${s}.`));
    Q.push(makeQ(topic, '11',
      `The value of cos ${ang} is:`,
      c,
      ['1', '0', '−1'].filter(x => x !== c).slice(0, 3),
      `By standard table, cos ${ang} = ${c}.`));
    Q.push(makeQ(topic, '11',
      `The value of tan ${ang} is:`,
      t,
      ['1', '0', '√3'].filter(x => x !== t).slice(0, 3),
      `By standard table, tan ${ang} = ${t}.`));
  }
  // sin²θ + cos²θ = 1 → given sinθ find cosθ
  const pyth: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
  for (const [a, b, h] of pyth) {
    Q.push(makeQ(topic, '11',
      `If sin θ = ${a}/${h} and θ is acute, then cos θ =`,
      `${b}/${h}`,
      [`${a}/${b}`, `${h}/${b}`, `${b}/${a}`],
      `cos θ = √(1 − sin²θ) = √(1 − ${a * a}/${h * h}) = ${b}/${h}.`));
    Q.push(makeQ(topic, '11',
      `If cos θ = ${b}/${h} and θ is acute, then sin θ =`,
      `${a}/${h}`,
      [`${b}/${a}`, `${h}/${a}`, `${a}/${b}`],
      `sin θ = √(1 − cos²θ) = ${a}/${h}.`));
    Q.push(makeQ(topic, '11',
      `If sin θ = ${a}/${h} and θ is acute, then tan θ =`,
      `${a}/${b}`,
      [`${b}/${a}`, `${h}/${a}`, `${h}/${b}`],
      `tan θ = sin θ / cos θ = (${a}/${h})/(${b}/${h}) = ${a}/${b}.`));
  }
  // sin(A+B) = sinA cosB + cosA sinB - test with known values
  const pairs: Array<[string, string, number]> = [
    ['30°', '60°', 1], ['45°', '45°', 1], ['60°', '30°', 1], ['90°', '0°', 1], ['0°', '90°', 1]
  ];
  for (const [A, B] of pairs) {
    Q.push(makeQ(topic, '11',
      `The value of sin(${A} + ${B}) is:`,
      '1',
      ['0', '1/2', '√3/2'],
      `sin(${A} + ${B}) = sin 90° = 1.`));
  }
  // Identities
  for (let k = 1; k <= 60; k++) {
    Q.push(makeQ(topic, '11',
      `The value of sin²(${k}°) + cos²(${k}°) is:`,
      '1',
      ['0', '2', `sin(${2 * k}°)`],
      `By Pythagorean identity, sin²θ + cos²θ = 1.`));
  }
  return Q;
}

function topicStraightLines(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Straight Lines';
  // Slope between two points
  for (let x1 = -4; x1 <= 4; x1++) {
    for (let y1 = -4; y1 <= 4; y1++) {
      for (let x2 = x1 + 1; x2 <= x1 + 5; x2++) {
        for (let y2 = -4; y2 <= 4; y2++) {
          const m = (y2 - y1) / (x2 - x1);
          const ms = frac(y2 - y1, x2 - x1);
          Q.push(makeQ(topic, '11',
            `The slope of the line joining (${x1}, ${y1}) and (${x2}, ${y2}) is:`,
            ms,
            [frac(x2 - x1, y2 - y1 || 1), frac(y1 - y2, x2 - x1), frac(y2 + y1, x2 + x1 || 1)],
            `Slope = (y₂ − y₁)/(x₂ − x₁) = (${y2} − ${y1})/(${x2} − ${x1}) = ${ms}.`));
          if (Q.length > 70) break;
        }
        if (Q.length > 70) break;
      }
      if (Q.length > 70) break;
    }
    if (Q.length > 70) break;
  }
  // Distance between points
  for (let x1 = -3; x1 <= 3; x1++) {
    for (let y1 = -3; y1 <= 3; y1++) {
      for (let dx = 3; dx <= 6; dx++) {
        for (let dy = 4; dy <= 8; dy++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          const ds = Number.isInteger(d) ? `${d}` : `√${dx * dx + dy * dy}`;
          Q.push(makeQ(topic, '11',
            `The distance between the points (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy}) is:`,
            ds,
            [`${dx + dy}`, `${dx * dy}`, `√${dx * dx - dy * dy < 0 ? dx * dx + dy * dy + 1 : dx * dx - dy * dy}`],
            `Distance = √((Δx)² + (Δy)²) = √(${dx * dx} + ${dy * dy}) = ${ds}.`));
          if (Q.length > 150) break;
        }
        if (Q.length > 150) break;
      }
      if (Q.length > 150) break;
    }
    if (Q.length > 150) break;
  }
  // Midpoint
  for (let a = -8; a <= 8; a++) {
    for (let b = -8; b <= 8; b++) {
      for (let c = -8; c <= 8; c++) {
        for (let d = -8; d <= 8; d++) {
          if ((a + c) % 2 !== 0 || (b + d) % 2 !== 0) continue;
          Q.push(makeQ(topic, '11',
            `The midpoint of the segment joining (${a}, ${b}) and (${c}, ${d}) is:`,
            `(${(a + c) / 2}, ${(b + d) / 2})`,
            [`(${a + c}, ${b + d})`, `(${(a - c) / 2}, ${(b - d) / 2})`, `(${a}, ${d})`],
            `Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2) = (${(a + c) / 2}, ${(b + d) / 2}).`));
          if (Q.length > 240) break;
        }
        if (Q.length > 240) break;
      }
      if (Q.length > 240) break;
    }
    if (Q.length > 240) break;
  }
  return Q;
}

function topicCircles(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Coordinate Geometry - Circles';
  // Equation of circle with center (h,k) radius r
  for (let h = -5; h <= 5; h++) {
    for (let k = -5; k <= 5; k++) {
      for (let r = 1; r <= 6; r++) {
        Q.push(makeQ(topic, '12',
          `The equation of the circle with centre (${h}, ${k}) and radius ${r} is:`,
          `(x − ${h})² + (y − ${k})² = ${r * r}`,
          [`(x + ${h})² + (y + ${k})² = ${r * r}`, `(x − ${h})² + (y − ${k})² = ${r}`, `x² + y² = ${r * r}`],
          `Standard form: (x − h)² + (y − k)² = r² with h=${h}, k=${k}, r=${r}.`));
        if (Q.length > 100) break;
      }
      if (Q.length > 100) break;
    }
    if (Q.length > 100) break;
  }
  // Center and radius from x²+y²+2gx+2fy+c=0
  for (let g = -4; g <= 4; g++) {
    for (let f = -4; f <= 4; f++) {
      for (let c = -10; c <= 5; c++) {
        const r2 = g * g + f * f - c;
        if (r2 <= 0) continue;
        const r = Math.sqrt(r2);
        if (!Number.isInteger(r)) continue;
        Q.push(makeQ(topic, '12',
          `The centre of the circle x² + y² ${2 * g >= 0 ? '+ ' + 2 * g : '− ' + (-2 * g)}x ${2 * f >= 0 ? '+ ' + 2 * f : '− ' + (-2 * f)}y ${c >= 0 ? '+ ' + c : '− ' + (-c)} = 0 is:`,
          `(${-g}, ${-f})`,
          [`(${g}, ${f})`, `(${-g}, ${f})`, `(${g}, ${-f})`],
          `For x² + y² + 2gx + 2fy + c = 0, centre = (−g, −f) = (${-g}, ${-f}).`));
        if (Q.length > 200) break;
      }
      if (Q.length > 200) break;
    }
    if (Q.length > 200) break;
  }
  // Radius from x²+y² = r²
  for (let r = 1; r <= 30; r++) {
    Q.push(makeQ(topic, '12',
      `The radius of the circle x² + y² = ${r * r} is:`,
      `${r}`,
      [`${r * r}`, `${r * 2}`, `√${r}`],
      `Comparing with x² + y² = r², r² = ${r * r} ⇒ r = ${r}.`));
  }
  return Q;
}

function topicConics(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Coordinate Geometry - Conics';
  // Parabola y² = 4ax → focus (a,0), directrix x = -a
  for (let a = 1; a <= 30; a++) {
    Q.push(makeQ(topic, '12',
      `The focus of the parabola y² = ${4 * a}x is:`,
      `(${a}, 0)`,
      [`(0, ${a})`, `(${-a}, 0)`, `(${2 * a}, 0)`],
      `For y² = 4ax, focus is (a, 0). Here 4a = ${4 * a} ⇒ a = ${a}.`));
    Q.push(makeQ(topic, '12',
      `The directrix of the parabola y² = ${4 * a}x is:`,
      `x = ${-a}`,
      [`x = ${a}`, `y = ${-a}`, `y = ${a}`],
      `Directrix of y² = 4ax is x = −a = ${-a}.`));
    Q.push(makeQ(topic, '12',
      `The length of the latus rectum of y² = ${4 * a}x is:`,
      `${4 * a}`,
      [`${2 * a}`, `${a}`, `${8 * a}`],
      `Length of latus rectum of y² = 4ax is 4a = ${4 * a}.`));
  }
  // Ellipse eccentricity x²/a² + y²/b² = 1
  for (let a = 3; a <= 12; a++) {
    for (let b = 1; b < a; b++) {
      const e2 = 1 - (b * b) / (a * a);
      const eNum = a * a - b * b;
      Q.push(makeQ(topic, '12',
        `The eccentricity of the ellipse x²/${a * a} + y²/${b * b} = 1 is:`,
        `√${eNum}/${a}`,
        [`${b}/${a}`, `√${a * a - b * b}/${b}`, `${a}/${b}`],
        `e = √(1 − b²/a²) = √(${eNum}/${a * a}) = √${eNum}/${a}.`));
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  // Hyperbola eccentricity
  for (let a = 2; a <= 8; a++) {
    for (let b = 1; b <= 6; b++) {
      const eNum = a * a + b * b;
      Q.push(makeQ(topic, '12',
        `The eccentricity of the hyperbola x²/${a * a} − y²/${b * b} = 1 is:`,
        `√${eNum}/${a}`,
        [`${b}/${a}`, `√${eNum}/${b}`, `${a}/${b}`],
        `e = √(1 + b²/a²) = √(${eNum}/${a * a}) = √${eNum}/${a}.`));
    }
  }
  return Q;
}

function topicLimits(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Limits & Continuity';
  // (x^n - a^n)/(x - a) → n a^(n-1)
  for (let n = 2; n <= 12; n++) {
    for (let a = 1; a <= 6; a++) {
      const v = n * a ** (n - 1);
      Q.push(makeQ(topic, '11',
        `lim (x → ${a}) (x^${n} − ${a ** n})/(x − ${a}) =`,
        `${v}`,
        [`${a ** n}`, `${n * a}`, `${a ** (n - 1)}`],
        `Standard limit: lim (x→a)(xⁿ − aⁿ)/(x − a) = n·a^(n−1) = ${n}·${a ** (n - 1)} = ${v}.`));
    }
  }
  // sin(ax)/x → a
  for (let a = 1; a <= 30; a++) {
    Q.push(makeQ(topic, '11',
      `lim (x → 0) sin(${a}x)/x =`,
      `${a}`,
      [`${a * a}`, `${1 / a}`, `0`],
      `lim (x→0) sin(ax)/x = a = ${a}.`));
  }
  // (1 - cos(ax))/x² → a²/2
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '11',
      `lim (x → 0) (1 − cos(${a}x))/x² =`,
      `${(a * a) / 2}`,
      [`${a * a}`, `${a / 2}`, `0`],
      `lim (x→0) (1 − cos(ax))/x² = a²/2 = ${(a * a) / 2}.`));
  }
  // (e^(ax) - 1)/x → a
  for (let a = 1; a <= 30; a++) {
    Q.push(makeQ(topic, '11',
      `lim (x → 0) (e^(${a}x) − 1)/x =`,
      `${a}`,
      [`${a * a}`, `1`, `0`],
      `lim (x→0) (e^(ax) − 1)/x = a = ${a}.`));
  }
  // tan(ax)/x → a
  for (let a = 1; a <= 25; a++) {
    Q.push(makeQ(topic, '11',
      `lim (x → 0) tan(${a}x)/x =`,
      `${a}`,
      [`${a * a}`, `0`, `${a + 1}`],
      `lim (x→0) tan(ax)/x = a = ${a}.`));
  }
  return Q;
}

function topicDifferentiation(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Differentiation';
  // d/dx of x^n = n x^(n-1)
  for (let n = 2; n <= 15; n++) {
    Q.push(makeQ(topic, '12',
      `d/dx (x^${n}) =`,
      `${n}x^${n - 1}`,
      [`${n - 1}x^${n}`, `x^${n - 1}`, `${n}x^${n}`],
      `Power rule: d/dx (xⁿ) = n·x^(n−1).`));
  }
  // d/dx (a x^n + b) at x=c
  for (let a = 1; a <= 5; a++) {
    for (let n = 2; n <= 6; n++) {
      for (let b = -5; b <= 5; b++) {
        const exprDeriv = `${a * n}x^${n - 1}`;
        Q.push(makeQ(topic, '12',
          `d/dx (${a}x^${n} ${b >= 0 ? '+ ' + b : '− ' + (-b)}) =`,
          exprDeriv,
          [`${a * n}x^${n}`, `${a}x^${n - 1}`, `${a * (n - 1)}x^${n}`],
          `d/dx (a x^n + b) = a·n·x^(n−1) = ${exprDeriv}.`));
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  // d/dx of sin(ax)
  for (let a = 1; a <= 25; a++) {
    Q.push(makeQ(topic, '12',
      `d/dx (sin(${a}x)) =`,
      `${a} cos(${a}x)`,
      [`${a} sin(${a}x)`, `cos(${a}x)`, `−${a} cos(${a}x)`],
      `Chain rule: d/dx sin(ax) = a·cos(ax).`));
  }
  // d/dx of cos(ax)
  for (let a = 1; a <= 25; a++) {
    Q.push(makeQ(topic, '12',
      `d/dx (cos(${a}x)) =`,
      `−${a} sin(${a}x)`,
      [`${a} sin(${a}x)`, `−sin(${a}x)`, `${a} cos(${a}x)`],
      `Chain rule: d/dx cos(ax) = −a·sin(ax).`));
  }
  // d/dx of e^(ax)
  for (let a = 1; a <= 25; a++) {
    Q.push(makeQ(topic, '12',
      `d/dx (e^(${a}x)) =`,
      `${a} e^(${a}x)`,
      [`e^(${a}x)`, `${a}x e^(${a}x)`, `${a} e^(${a - 1}x)`],
      `Chain rule: d/dx e^(ax) = a·e^(ax).`));
  }
  // d/dx of ln(ax)
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '12',
      `d/dx (ln(${a}x)) =`,
      `1/x`,
      [`${a}/x`, `${1 / a}/x`, `1/(${a}x)`],
      `d/dx ln(ax) = (1/(ax))·a = 1/x.`));
  }
  return Q;
}

function topicAppDerivatives(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Applications of Derivatives';
  // Slope of tangent to y = ax² + b at x = c is 2ac
  for (let a = 1; a <= 6; a++) {
    for (let b = -5; b <= 5; b++) {
      for (let c = -5; c <= 5; c++) {
        const m = 2 * a * c;
        Q.push(makeQ(topic, '12',
          `The slope of the tangent to the curve y = ${a}x² ${b >= 0 ? '+ ' + b : '− ' + (-b)} at x = ${c} is:`,
          `${m}`,
          [`${a * c}`, `${a * c * c}`, `${m + b}`],
          `dy/dx = 2·${a}·x; at x=${c}: slope = ${m}.`));
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  // Maxima of -ax² + bx + c = b/(2a)
  for (let a = 1; a <= 6; a++) {
    for (let b = 2; b <= 18; b += 2) {
      for (let c = -5; c <= 5; c++) {
        const x = b / (2 * a);
        const xs = frac(b, 2 * a);
        Q.push(makeQ(topic, '12',
          `The function f(x) = −${a}x² + ${b}x ${c >= 0 ? '+ ' + c : '− ' + (-c)} attains its maximum at x =`,
          xs,
          [frac(-b, 2 * a), `${b}`, `${a}`],
          `f'(x) = −2·${a}·x + ${b} = 0 ⇒ x = ${xs}.`));
        if (Q.length > 240) break;
      }
      if (Q.length > 240) break;
    }
    if (Q.length > 240) break;
  }
  return Q;
}

function topicIntegration(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Integration';
  // ∫ x^n dx = x^(n+1)/(n+1) + C
  for (let n = 0; n <= 15; n++) {
    Q.push(makeQ(topic, '12',
      `∫ x^${n} dx =`,
      `x^${n + 1}/${n + 1} + C`,
      [`${n}x^${n - 1} + C`, `x^${n} + C`, `x^${n + 1} + C`],
      `Power rule: ∫xⁿ dx = x^(n+1)/(n+1) + C.`));
  }
  // ∫ sin(ax) dx
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '12',
      `∫ sin(${a}x) dx =`,
      `−cos(${a}x)/${a} + C`,
      [`cos(${a}x)/${a} + C`, `−${a} cos(${a}x) + C`, `sin(${a}x)/${a} + C`],
      `∫ sin(ax) dx = −cos(ax)/a + C.`));
  }
  // ∫ cos(ax) dx
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '12',
      `∫ cos(${a}x) dx =`,
      `sin(${a}x)/${a} + C`,
      [`−sin(${a}x)/${a} + C`, `${a} sin(${a}x) + C`, `cos(${a}x)/${a} + C`],
      `∫ cos(ax) dx = sin(ax)/a + C.`));
  }
  // ∫ e^(ax) dx
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '12',
      `∫ e^(${a}x) dx =`,
      `e^(${a}x)/${a} + C`,
      [`${a} e^(${a}x) + C`, `e^(${a}x) + C`, `e^(${a - 1}x) + C`],
      `∫ e^(ax) dx = e^(ax)/a + C.`));
  }
  // Definite ∫₀^a x^n dx = a^(n+1)/(n+1)
  for (let a = 1; a <= 5; a++) {
    for (let n = 1; n <= 6; n++) {
      const v = a ** (n + 1) / (n + 1);
      const vs = Number.isInteger(v) ? `${v}` : frac(a ** (n + 1), n + 1);
      Q.push(makeQ(topic, '12',
        `∫₀^${a} x^${n} dx =`,
        vs,
        [`${a ** n}`, `${a ** (n + 1)}`, frac(a ** n, n + 1)],
        `∫₀^a xⁿ dx = a^(n+1)/(n+1) = ${a ** (n + 1)}/${n + 1}.`));
    }
  }
  // ∫ 1/x dx
  Q.push(makeQ(topic, '12', `∫ 1/x dx =`, `ln|x| + C`,
    [`1/x² + C`, `−1/x² + C`, `ln(x²) + C`], `Standard integral: ∫ dx/x = ln|x| + C.`));
  return Q;
}

function topicAppIntegrals(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Applications of Integrals';
  // Area under y = a x^n from 0 to b = a b^(n+1)/(n+1)
  for (let a = 1; a <= 5; a++) {
    for (let n = 1; n <= 5; n++) {
      for (let b = 1; b <= 6; b++) {
        const v = (a * b ** (n + 1)) / (n + 1);
        const vs = Number.isInteger(v) ? `${v}` : frac(a * b ** (n + 1), n + 1);
        Q.push(makeQ(topic, '12',
          `The area bounded by y = ${a}x^${n}, x = 0, x = ${b} and the x-axis is:`,
          vs,
          [`${a * b ** n}`, `${a * b}`, `${b ** (n + 1)}`],
          `Area = ∫₀^${b} ${a}x^${n} dx = ${a}·${b ** (n + 1)}/${n + 1} = ${vs}.`));
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  return Q;
}

function topicDiffEq(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Differential Equations';
  // dy/dx = ax → y = ax²/2 + C
  for (let a = 1; a <= 30; a++) {
    Q.push(makeQ(topic, '12',
      `The general solution of dy/dx = ${a}x is:`,
      `y = ${frac(a, 2)}x² + C`,
      [`y = ${a}x² + C`, `y = ${2 * a}x² + C`, `y = ${a}x + C`],
      `Integrating both sides: y = ∫ ${a}x dx = ${frac(a, 2)}x² + C.`));
  }
  // Order/degree of d²y/dx² + p dy/dx + q = 0 is 2, 1
  for (let p = 1; p <= 10; p++) {
    for (let q = 1; q <= 6; q++) {
      Q.push(makeQ(topic, '12',
        `The order of the differential equation d²y/dx² + ${p} dy/dx + ${q}y = 0 is:`,
        `2`,
        [`1`, `3`, `0`],
        `The highest derivative is d²y/dx², so order = 2.`));
    }
  }
  // dy/dx = ay → y = C e^(ax)
  for (let a = 1; a <= 20; a++) {
    Q.push(makeQ(topic, '12',
      `The general solution of dy/dx = ${a}y is:`,
      `y = C e^(${a}x)`,
      [`y = C e^(−${a}x)`, `y = ${a}x + C`, `y = C x^${a}`],
      `Separable: dy/y = ${a} dx ⇒ ln|y| = ${a}x + C₁ ⇒ y = C e^(${a}x).`));
  }
  return Q;
}

function topicVectors(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Vectors';
  // Magnitude
  for (let a = -5; a <= 5; a++) {
    for (let b = -5; b <= 5; b++) {
      for (let c = -5; c <= 5; c++) {
        const m2 = a * a + b * b + c * c;
        if (m2 === 0) continue;
        const m = Math.sqrt(m2);
        const ms = Number.isInteger(m) ? `${m}` : `√${m2}`;
        Q.push(makeQ(topic, '12',
          `The magnitude of the vector ${a}î + ${b}ĵ + ${c}k̂ is:`,
          ms,
          [`${Math.abs(a) + Math.abs(b) + Math.abs(c)}`, `${m2}`, `√${Math.abs(a * b * c) + 1}`],
          `|v| = √(a² + b² + c²) = √${m2} = ${ms}.`));
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  // Dot product
  for (let a1 = -4; a1 <= 4; a1++) {
    for (let b1 = -4; b1 <= 4; b1++) {
      for (let c1 = -4; c1 <= 4; c1++) {
        for (let a2 = -3; a2 <= 3; a2++) {
          const b2 = 2, c2 = 1;
          const dp = a1 * a2 + b1 * b2 + c1 * c2;
          Q.push(makeQ(topic, '12',
            `The dot product of (${a1}î + ${b1}ĵ + ${c1}k̂) and (${a2}î + ${b2}ĵ + ${c2}k̂) is:`,
            `${dp}`,
            [`${a1 * a2 - b1 * b2 - c1 * c2}`, `${dp + 1}`, `${a1 + b1 + c1 + a2 + b2 + c2}`],
            `Dot product = a₁a₂ + b₁b₂ + c₁c₂ = ${a1 * a2} + ${b1 * b2} + ${c1 * c2} = ${dp}.`));
          if (Q.length > 260) break;
        }
        if (Q.length > 260) break;
      }
      if (Q.length > 260) break;
    }
    if (Q.length > 260) break;
  }
  return Q;
}

function topic3D(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = '3D Geometry';
  // Distance between two points
  for (let x1 = -3; x1 <= 3; x1++) {
    for (let y1 = -3; y1 <= 3; y1++) {
      for (let z1 = -3; z1 <= 3; z1++) {
        for (let dx = 2; dx <= 4; dx++) {
          const dy = 3, dz = 6;
          const d2 = dx * dx + dy * dy + dz * dz;
          const d = Math.sqrt(d2);
          const ds = Number.isInteger(d) ? `${d}` : `√${d2}`;
          Q.push(makeQ(topic, '12',
            `The distance between the points (${x1}, ${y1}, ${z1}) and (${x1 + dx}, ${y1 + dy}, ${z1 + dz}) is:`,
            ds,
            [`${dx + dy + dz}`, `${d2}`, `${dx * dy * dz}`],
            `Distance = √((Δx)² + (Δy)² + (Δz)²) = √${d2} = ${ds}.`));
          if (Q.length > 130) break;
        }
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  return Q;
}

function topicProbability(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Probability';
  // Simple probability
  for (let total = 4; total <= 30; total++) {
    for (let fav = 1; fav < total; fav++) {
      Q.push(makeQ(topic, '12',
        `A box contains ${fav} red and ${total - fav} blue balls. The probability of drawing a red ball is:`,
        frac(fav, total),
        [frac(total - fav, total), frac(fav, fav + total), `${fav}/${total - fav}`],
        `P(red) = ${fav}/${total}.`));
      if (Q.length > 200) break;
    }
    if (Q.length > 200) break;
  }
  // Coin/dice
  for (let n = 1; n <= 8; n++) {
    const total = 2 ** n;
    Q.push(makeQ(topic, '12',
      `A fair coin is tossed ${n} times. The total number of outcomes is:`,
      `${total}`,
      [`${2 * n}`, `${total / 2 || 1}`, `${n * n}`],
      `Each toss has 2 outcomes ⇒ total = 2^${n} = ${total}.`));
  }
  // Probability of getting head/tail in n tosses
  for (let n = 1; n <= 6; n++) {
    Q.push(makeQ(topic, '12',
      `The probability of getting all heads in ${n} tosses of a fair coin is:`,
      `1/${2 ** n}`,
      [`${n}/${2 * n}`, `${1}/${2 * n}`, `${1}/${n + 1}`],
      `P(all heads) = (1/2)^${n} = 1/${2 ** n}.`));
  }
  return Q;
}

function topicStatistics(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Statistics';
  // Mean of n consecutive integers starting from a
  for (let a = 1; a <= 30; a++) {
    for (let n = 3; n <= 12; n++) {
      const sum = (n * (2 * a + n - 1)) / 2;
      const mean = sum / n;
      const ms = Number.isInteger(mean) ? `${mean}` : frac(sum, n);
      const list = Array.from({ length: n }, (_, i) => a + i).join(', ');
      Q.push(makeQ(topic, '11',
        `The arithmetic mean of the numbers ${list} is:`,
        ms,
        [`${sum}`, `${n}`, `${a}`],
        `Mean = sum/n = ${sum}/${n} = ${ms}.`));
      if (Q.length > 200) break;
    }
    if (Q.length > 200) break;
  }
  // Median of small ordered lists
  for (let a = 1; a <= 25; a++) {
    const list = [a, a + 1, a + 2, a + 3, a + 4];
    Q.push(makeQ(topic, '11',
      `The median of the data ${list.join(', ')} is:`,
      `${a + 2}`,
      [`${a}`, `${a + 4}`, `${a + 1}`],
      `For ordered odd-count data, median is the middle value = ${a + 2}.`));
  }
  return Q;
}

function topicLP(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Linear Programming';
  // Maximize Z = ax + by at vertex
  for (let a = 1; a <= 8; a++) {
    for (let b = 1; b <= 8; b++) {
      for (let x = 1; x <= 6; x++) {
        for (let y = 1; y <= 6; y++) {
          const z = a * x + b * y;
          Q.push(makeQ(topic, '12',
            `If Z = ${a}x + ${b}y, the value of Z at the point (${x}, ${y}) is:`,
            `${z}`,
            [`${a * x - b * y}`, `${a + b + x + y}`, `${a * y + b * x}`],
            `Z = ${a}·${x} + ${b}·${y} = ${a * x} + ${b * y} = ${z}.`));
          if (Q.length > 130) break;
        }
        if (Q.length > 130) break;
      }
      if (Q.length > 130) break;
    }
    if (Q.length > 130) break;
  }
  return Q;
}

function topicMathReasoning(): SeedQuestion[] {
  const Q: SeedQuestion[] = [];
  const topic = 'Mathematical Reasoning';
  const statements = [
    'It is raining', 'The sky is blue', 'x is even', 'n > 5', '2 + 2 = 4', 'all triangles are equal',
    'the moon is bright', 'birds can fly', 'water boils at 100°C', 'every prime is odd',
    'a square has four sides', 'paris is in france', 'the earth is round', 'n is prime',
    'roses are red', 'snow is cold', 'fire is hot', 'cats are mammals', '2 is even',
    'the sun rises in the east', 'gold is a metal', 'iron rusts', 'oxygen is a gas',
    'lions roar', 'monkeys climb trees', 'fish swim', 'rivers flow', 'mountains are high',
    'oceans are deep', 'time is precious', 'knowledge is power', 'practice makes perfect'
  ];
  // Negation
  for (const s of statements) {
    Q.push(makeQ(topic, '11',
      `The negation of the statement "${s}" is:`,
      `It is not the case that ${s}`,
      [`${s} and false`, `It is true that ${s}`, `${s} or true`],
      `Negation of p is ¬p, i.e., "It is not the case that p".`));
  }
  // Truth table p ∧ p, p ∨ ¬p
  for (let i = 0; i < 30; i++) {
    Q.push(makeQ(topic, '11',
      `The statement p ∨ ¬p is a:`,
      `Tautology`,
      [`Contradiction`, `Contingency`, `Fallacy`],
      `p ∨ ¬p is always true (Law of Excluded Middle), hence a tautology.`));
  }
  for (let i = 0; i < 30; i++) {
    Q.push(makeQ(topic, '11',
      `The statement p ∧ ¬p is a:`,
      `Contradiction`,
      [`Tautology`, `Contingency`, `Identity`],
      `p ∧ ¬p is always false, hence a contradiction.`));
  }
  return Q;
}

export function generateMathematicsQuestions(): SeedQuestion[] {
  const all: SeedQuestion[] = [];
  all.push(...topicSetsRelations());
  all.push(...topicComplex());
  all.push(...topicQuadratic());
  all.push(...topicSequences());
  all.push(...topicPermComb());
  all.push(...topicMatrices());
  all.push(...topicTrigonometry());
  all.push(...topicStraightLines());
  all.push(...topicCircles());
  all.push(...topicConics());
  all.push(...topicLimits());
  all.push(...topicDifferentiation());
  all.push(...topicAppDerivatives());
  all.push(...topicIntegration());
  all.push(...topicAppIntegrals());
  all.push(...topicDiffEq());
  all.push(...topicVectors());
  all.push(...topic3D());
  all.push(...topicProbability());
  all.push(...topicStatistics());
  all.push(...topicLP());
  all.push(...topicMathReasoning());
  return all;
}
