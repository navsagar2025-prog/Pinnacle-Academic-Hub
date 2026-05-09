import { SeedQuestion, pickYear, pickDifficulty } from "./types";

function makeQ(
  topic: string,
  classGrade: string,
  questionText: string,
  correct: string,
  d1: string,
  d2: string,
  d3: string,
  solution: string
): SeedQuestion {
  const opts = [
    { key: "A" as const, val: correct },
    { key: "B" as const, val: d1 },
    { key: "C" as const, val: d2 },
    { key: "D" as const, val: d3 },
  ];
  const idx = Math.floor(Math.random() * 4);
  const tmp = opts[0];
  opts[0] = opts[idx];
  opts[idx] = tmp;
  const correctKey = opts.find((o) => o.val === correct)!.key;
  return {
    subject: "Physics",
    topic,
    classGrade,
    year: pickYear(),
    difficulty: pickDifficulty(),
    questionType: "mcq",
    questionText,
    options: { A: opts[0].val, B: opts[1].val, C: opts[2].val, D: opts[3].val },
    correctAnswer: correctKey,
    solution,
    marks: 4,
  };
}

export function generatePhysicsQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];

  for (let m = 2; m <= 20; m += 2) {
    for (let v = 2; v <= 10; v += 2) {
      const ke = 0.5 * m * v * v;
      qs.push(makeQ("Mechanics", "11", `A body of mass ${m} kg moves at ${v} m/s. Its kinetic energy is:`, `${ke} J`, `${2 * ke} J`, `${m * v} J`, `${ke / 2} J`, `KE = ½mv² = ½×${m}×${v}² = ${ke} J.`));
    }
  }

  for (let u = 10; u <= 50; u += 5) {
    const h = (u * u) / 20;
    qs.push(makeQ("Mechanics", "11", `A ball thrown vertically upward at ${u} m/s reaches max height (g=10):`, `${h} m`, `${2 * h} m`, `${h / 2} m`, `${u} m`, `H = u²/(2g) = ${u}²/20 = ${h} m.`));
  }

  for (let a = 2; a <= 10; a++) {
    for (let t = 1; t <= 5; t++) {
      const v = a * t;
      const s = 0.5 * a * t * t;
      qs.push(makeQ("Mechanics", "11", `A body starts from rest with acceleration ${a} m/s². Velocity after ${t} s:`, `${v} m/s`, `${v + a} m/s`, `${v - 1} m/s`, `${s} m/s`, `v = u + at = 0 + ${a}×${t} = ${v} m/s.`));
      qs.push(makeQ("Mechanics", "11", `A body starts from rest with acceleration ${a} m/s². Distance in ${t} s:`, `${s} m`, `${s + a} m`, `${v} m`, `${2 * s} m`, `s = ½at² = ½×${a}×${t}² = ${s} m.`));
    }
  }

  for (let F = 5; F <= 50; F += 5) {
    for (let m = 1; m <= 5; m++) {
      const a = F / m;
      qs.push(makeQ("Mechanics", "11", `A force of ${F} N acts on mass ${m} kg. Acceleration is:`, `${a} m/s²`, `${a / 2} m/s²`, `${a + 5} m/s²`, `${F + m} m/s²`, `F = ma, so a = F/m = ${F}/${m} = ${a} m/s².`));
    }
  }

  for (let m = 1; m <= 10; m++) {
    const w = m * 10;
    qs.push(makeQ("Mechanics", "11", `Weight of ${m} kg mass on Earth (g=10 m/s²):`, `${w} N`, `${w / 2} N`, `${m} N`, `${w * 2} N`, `W = mg = ${m}×10 = ${w} N.`));
  }

  const angles = [0, 30, 45, 60, 90];
  for (const ang of angles) {
    const cosVal: Record<number, string> = { 0: "1", 30: "√3/2", 45: "1/√2", 60: "1/2", 90: "0" };
    const sinVal: Record<number, string> = { 0: "0", 30: "1/2", 45: "1/√2", 60: "√3/2", 90: "1" };
    qs.push(makeQ("Mechanics", "11", `Work done by force F over displacement d at angle ${ang}° is W = Fd cos${ang}°. The value of cos${ang}° is:`, cosVal[ang], sinVal[ang], `${ang === 0 ? "0" : "1"}`, "undefined", `cos${ang}° = ${cosVal[ang]}.`));
  }

  for (let m = 1; m <= 10; m++) {
    for (let r = 1; r <= 5; r++) {
      const v = r * 2;
      const fc = (m * v * v) / r;
      qs.push(makeQ("Mechanics", "11", `A ${m} kg body moves in circle of radius ${r} m at ${v} m/s. Centripetal force:`, `${fc} N`, `${fc / 2} N`, `${fc + m} N`, `${m * v} N`, `F = mv²/r = ${m}×${v}²/${r} = ${fc} N.`));
    }
  }

  const pendulumLengths = [0.25, 1, 2.25, 4, 6.25];
  for (const L of pendulumLengths) {
    const T = 2 * Math.sqrt(L / 10);
    const Tstr = T % 1 === 0 ? `${T}` : T.toFixed(2);
    qs.push(makeQ("Waves & Oscillations", "11", `Time period of pendulum of length ${L} m (g=10 m/s², T=2π√(L/g)):`, `${Tstr}π s`, `${(T * 2).toFixed(2)}π s`, `π s`, `2π s`, `T = 2π√(${L}/10) = ${Tstr}π s.`));
  }

  for (let f = 100; f <= 1000; f += 100) {
    const T = 1 / f;
    const Tstr = T.toFixed(4);
    qs.push(makeQ("Waves & Oscillations", "11", `A wave has frequency ${f} Hz. Its time period is:`, `${Tstr} s`, `${f} s`, `${(1 / (f * 2)).toFixed(4)} s`, `${(2 / f).toFixed(4)} s`, `T = 1/f = 1/${f} = ${Tstr} s.`));
  }

  for (let v = 300; v <= 350; v += 10) {
    for (let f = 200; f <= 500; f += 50) {
      const lam = (v / f).toFixed(2);
      qs.push(makeQ("Waves & Oscillations", "11", `Sound at ${v} m/s with frequency ${f} Hz has wavelength:`, `${lam} m`, `${(v * f / 1000).toFixed(2)} m`, `${(f / v).toFixed(4)} m`, `${(v / (f + 100)).toFixed(2)} m`, `λ = v/f = ${v}/${f} = ${lam} m.`));
    }
  }

  const beatPairs = [[256, 4], [440, 5], [512, 3], [340, 6], [200, 8]];
  for (const [f1, beat] of beatPairs) {
    qs.push(makeQ("Waves & Oscillations", "11", `A ${f1} Hz tuning fork produces ${beat} beats/s with another. The other fork's frequency:`, `${f1 + beat} or ${f1 - beat} Hz`, `${f1 + beat * 2} Hz`, `${f1} Hz`, `${beat} Hz`, `|f₁ - f₂| = ${beat}, so f₂ = ${f1}±${beat} = ${f1 + beat} or ${f1 - beat} Hz.`));
  }

  for (let A = 1; A <= 5; A++) {
    for (let omega = 2; omega <= 10; omega += 2) {
      const vmax = A * omega;
      const amax = A * omega * omega;
      qs.push(makeQ("Waves & Oscillations", "11", `In SHM with amplitude ${A} cm and ω=${omega} rad/s, max velocity:`, `${vmax} cm/s`, `${amax} cm/s`, `${A} cm/s`, `${omega} cm/s`, `v_max = Aω = ${A}×${omega} = ${vmax} cm/s.`));
    }
  }

  for (let u = -20; u >= -50; u -= 5) {
    for (let f = 10; f <= 20; f += 5) {
      const denom = u + f;
      if (denom === 0) continue;
      const v = (u * f) / denom;
      const vStr = v % 1 === 0 ? `${v}` : v.toFixed(1);
      qs.push(makeQ("Optics", "12", `Concave mirror: object at u=${u} cm, f=${-f} cm. Image distance:`, `${vStr} cm`, `${-u} cm`, `${f} cm`, `${u + f} cm`, `1/v + 1/u = 1/f. v = uf/(u+f) = ${u}×${-f}/(${u}+${-f}) = ${vStr} cm.`));
    }
  }

  for (let n = 1.2; n <= 2.0; n += 0.2) {
    const nStr = n.toFixed(1);
    const angle = Math.asin(1 / n) * (180 / Math.PI);
    const angleStr = angle.toFixed(1);
    qs.push(makeQ("Optics", "12", `Critical angle for medium with refractive index ${nStr}:`, `${angleStr}°`, `${(90 - angle).toFixed(1)}°`, `45°`, `90°`, `sinθc = 1/n = 1/${nStr}. θc ≈ ${angleStr}°.`));
  }

  for (let d = 0.1; d <= 1.0; d += 0.1) {
    const dStr = d.toFixed(1);
    for (let lam = 400; lam <= 700; lam += 100) {
      const D = 1;
      const beta = (lam * 1e-9 * D * 1000) / (d * 1e-3);
      const betaStr = beta.toFixed(2);
      qs.push(makeQ("Optics", "12", `Young's double slit: d=${dStr} mm, D=1 m, λ=${lam} nm. Fringe width:`, `${betaStr} mm`, `${(beta * 2).toFixed(2)} mm`, `${(beta / 2).toFixed(2)} mm`, `${lam} mm`, `β = λD/d = ${lam}×10⁻⁹×1/${dStr}×10⁻³ = ${betaStr} mm.`));
  }
  }

  const lensTypes = [
    { name: "convex", fSign: 1 },
    { name: "concave", fSign: -1 },
  ];
  for (const lens of lensTypes) {
    for (let f = 10; f <= 30; f += 5) {
      const P = lens.fSign * (100 / f);
      qs.push(makeQ("Optics", "12", `Power of a ${lens.name} lens of focal length ${f} cm:`, `${P > 0 ? "+" : ""}${P} D`, `${-P} D`, `${f} D`, `${f / 10} D`, `P = 1/f(m) = ${lens.fSign > 0 ? "" : "-"}100/${f} = ${P} D.`));
    }
  }

  for (let q1 = 1; q1 <= 5; q1++) {
    for (let q2 = 1; q2 <= 5; q2++) {
      for (let r = 1; r <= 3; r++) {
        const F = (9 * q1 * q2) / (r * r);
        const Fstr = F % 1 === 0 ? `${F}` : F.toFixed(1);
        qs.push(makeQ("Electrostatics", "12", `Force between charges ${q1} μC and ${q2} μC at ${r} cm (k=9×10⁹):`, `${Fstr} N`, `${(F / 2).toFixed(1)} N`, `${(F * 2).toFixed(1)} N`, `${q1 * q2} N`, `F = kq₁q₂/r² = 9×10⁹×${q1}×10⁻⁶×${q2}×10⁻⁶/(${r}×10⁻²)² = ${Fstr} N.`));
      }
    }
  }

  for (let C = 1; C <= 10; C++) {
    for (let V = 5; V <= 25; V += 5) {
      const Q = C * V;
      const E = 0.5 * C * V * V;
      qs.push(makeQ("Electrostatics", "12", `Capacitor ${C} μF charged to ${V} V. Charge stored:`, `${Q} μC`, `${E} μC`, `${Q / 2} μC`, `${C + V} μC`, `Q = CV = ${C}×${V} = ${Q} μC.`));
      qs.push(makeQ("Electrostatics", "12", `Energy stored in ${C} μF capacitor at ${V} V:`, `${E} μJ`, `${2 * E} μJ`, `${Q} μJ`, `${V * V} μJ`, `E = ½CV² = ½×${C}×${V}² = ${E} μJ.`));
    }
  }

  for (let V = 2; V <= 20; V += 2) {
    for (let R = 1; R <= 10; R++) {
      const I = V / R;
      const Istr = I % 1 === 0 ? `${I}` : I.toFixed(2);
      qs.push(makeQ("Current Electricity", "12", `Current through ${R} Ω resistor with ${V} V across it:`, `${Istr} A`, `${(I * 2).toFixed(2)} A`, `${(V + R)} A`, `${(I / 2).toFixed(2)} A`, `I = V/R = ${V}/${R} = ${Istr} A.`));
    }
  }

  for (let R1 = 2; R1 <= 10; R1 += 2) {
    for (let R2 = 2; R2 <= 10; R2 += 2) {
      const series = R1 + R2;
      const parallel = (R1 * R2) / (R1 + R2);
      const pStr = parallel % 1 === 0 ? `${parallel}` : parallel.toFixed(2);
      qs.push(makeQ("Current Electricity", "12", `${R1} Ω and ${R2} Ω in series. Total resistance:`, `${series} Ω`, `${pStr} Ω`, `${R1 * R2} Ω`, `${Math.abs(R1 - R2)} Ω`, `R_series = R₁ + R₂ = ${R1} + ${R2} = ${series} Ω.`));
      qs.push(makeQ("Current Electricity", "12", `${R1} Ω and ${R2} Ω in parallel. Equivalent resistance:`, `${pStr} Ω`, `${series} Ω`, `${R1} Ω`, `${R2} Ω`, `1/R = 1/${R1} + 1/${R2}. R = ${R1}×${R2}/${series} = ${pStr} Ω.`));
    }
  }

  for (let I = 1; I <= 5; I++) {
    for (let R = 2; R <= 10; R += 2) {
      const P = I * I * R;
      qs.push(makeQ("Current Electricity", "12", `Power dissipated in ${R} Ω resistor carrying ${I} A:`, `${P} W`, `${I * R} W`, `${P / 2} W`, `${I + R} W`, `P = I²R = ${I}²×${R} = ${P} W.`));
    }
  }

  for (let I = 1; I <= 5; I++) {
    for (let r = 1; r <= 5; r++) {
      const B = (2 * I) / (r * 10);
      const Bstr = B.toFixed(2);
      qs.push(makeQ("Magnetism", "12", `Magnetic field at ${r} cm from wire carrying ${I} A (μ₀/4π = 10⁻⁷):`, `${Bstr}×10⁻⁵ T`, `${(B * 2).toFixed(2)}×10⁻⁵ T`, `${(B / 2).toFixed(2)}×10⁻⁵ T`, `${I} T`, `B = μ₀I/(2πr) = 2×10⁻⁷×${I}/${r}×10⁻² = ${Bstr}×10⁻⁵ T.`));
    }
  }

  for (let I = 1; I <= 5; I++) {
    for (let L = 1; L <= 5; L++) {
      for (let B = 1; B <= 3; B++) {
        const F = B * I * L;
        qs.push(makeQ("Magnetism", "12", `Force on ${L} m wire carrying ${I} A in ${B} T field (perpendicular):`, `${F} N`, `${F / 2} N`, `${F * 2} N`, `${I * L} N`, `F = BIL = ${B}×${I}×${L} = ${F} N.`));
      }
    }
  }

  for (let N = 50; N <= 200; N += 50) {
    for (let dPhi = 1; dPhi <= 5; dPhi++) {
      for (let dt = 1; dt <= 3; dt++) {
        const emf = (N * dPhi) / dt;
        const emfStr = emf % 1 === 0 ? `${emf}` : emf.toFixed(1);
        qs.push(makeQ("Electromagnetic Induction", "12", `Coil of ${N} turns: flux changes by ${dPhi} Wb in ${dt} s. EMF induced:`, `${emfStr} V`, `${(emf / 2).toFixed(1)} V`, `${N} V`, `${dPhi} V`, `ε = -NdΦ/dt = ${N}×${dPhi}/${dt} = ${emfStr} V.`));
      }
    }
  }

  for (let L = 1; L <= 10; L++) {
    for (let I = 2; I <= 10; I += 2) {
      const E = 0.5 * L * I * I;
      qs.push(makeQ("Electromagnetic Induction", "12", `Energy stored in ${L} H inductor carrying ${I} A:`, `${E} J`, `${2 * E} J`, `${L * I} J`, `${E / 2} J`, `E = ½LI² = ½×${L}×${I}² = ${E} J.`));
    }
  }

  for (let phi = 2; phi <= 5; phi++) {
    const lam = Math.round(12400 / phi);
    qs.push(makeQ("Modern Physics", "12", `Work function ${phi} eV. Threshold wavelength (hc=12400 eV·Å):`, `${lam} Å`, `${lam * 2} Å`, `${Math.round(lam / 2)} Å`, `${phi * 1000} Å`, `λ₀ = hc/φ = 12400/${phi} = ${lam} Å.`));
  }

  for (let n = 1; n <= 6; n++) {
    const En = (-13.6 / (n * n)).toFixed(2);
    qs.push(makeQ("Modern Physics", "12", `Energy of electron in ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} orbit of hydrogen atom:`, `${En} eV`, `${(-13.6 / n).toFixed(2)} eV`, `${(-13.6 * n * n).toFixed(2)} eV`, `0 eV`, `Eₙ = -13.6/n² = -13.6/${n}² = ${En} eV.`));
  }

  for (let n = 1; n <= 5; n++) {
    const r = n * n * 0.53;
    const rStr = r.toFixed(2);
    qs.push(makeQ("Modern Physics", "12", `Radius of ${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Bohr orbit (a₀=0.53 Å):`, `${rStr} Å`, `${(n * 0.53).toFixed(2)} Å`, `${(r * 2).toFixed(2)} Å`, `0.53 Å`, `rₙ = n²a₀ = ${n}²×0.53 = ${rStr} Å.`));
  }

  for (let t = 0.5; t <= 3; t += 0.5) {
    const halfLife = t;
    for (let totalTime = 1; totalTime <= 6; totalTime++) {
      const nHalf = totalTime / halfLife;
      if (nHalf !== Math.floor(nHalf) || nHalf < 1 || nHalf > 6) continue;
      const frac = Math.pow(2, nHalf);
      qs.push(makeQ("Modern Physics", "12", `Half-life = ${halfLife} h. Fraction remaining after ${totalTime} h:`, `1/${frac}`, `1/${frac * 2}`, `1/${frac / 2 > 0 ? frac / 2 : 1}`, `${nHalf}/${frac}`, `n = ${totalTime}/${halfLife} = ${nHalf} half-lives. Fraction = (1/2)^${nHalf} = 1/${frac}.`));
    }
  }

  for (let T1 = 300; T1 <= 600; T1 += 100) {
    for (let T2 = 200; T2 < T1; T2 += 100) {
      const eff = ((T1 - T2) / T1 * 100).toFixed(1);
      qs.push(makeQ("Thermodynamics", "11", `Carnot engine: T_hot=${T1} K, T_cold=${T2} K. Efficiency:`, `${eff}%`, `${(T2 / T1 * 100).toFixed(1)}%`, `${((T1 - T2) / T2 * 100).toFixed(1)}%`, `100%`, `η = 1 - T₂/T₁ = 1 - ${T2}/${T1} = ${eff}%.`));
    }
  }

  for (let n = 1; n <= 5; n++) {
    for (let dT = 10; dT <= 50; dT += 10) {
      const monoQ = (1.5 * n * 8.314 * dT).toFixed(1);
      qs.push(makeQ("Thermodynamics", "11", `Heat needed to raise ${n} mol monoatomic gas temp by ${dT} K (const V):`, `${monoQ} J`, `${(n * 8.314 * dT).toFixed(1)} J`, `${(2.5 * n * 8.314 * dT).toFixed(1)} J`, `${(n * dT).toFixed(1)} J`, `Q = nCᵥΔT = ${n}×(3R/2)×${dT} = ${monoQ} J.`));
    }
  }

  for (let T = 200; T <= 600; T += 50) {
    const vrms = Math.sqrt((3 * 8.314 * T) / 0.032);
    const vrmsStr = vrms.toFixed(0);
    qs.push(makeQ("Kinetic Theory", "11", `RMS speed of O₂ (M=32 g/mol) at ${T} K:`, `${vrmsStr} m/s`, `${(vrms * 1.5).toFixed(0)} m/s`, `${(vrms / 2).toFixed(0)} m/s`, `${T} m/s`, `v_rms = √(3RT/M) = √(3×8.314×${T}/0.032) ≈ ${vrmsStr} m/s.`));
  }

  const gases = [
    { name: "He", M: 4, f: 3 },
    { name: "N₂", M: 28, f: 5 },
    { name: "CO₂", M: 44, f: 7 },
  ];
  for (const gas of gases) {
    const CvR = gas.f / 2;
    const CpR = CvR + 1;
    const gamma = CpR / CvR;
    qs.push(makeQ("Kinetic Theory", "11", `For ${gas.name} (${gas.f} DOF), the ratio Cₚ/Cᵥ (γ) is:`, `${gamma.toFixed(2)}`, `${(gamma + 0.2).toFixed(2)}`, `${(gamma - 0.2).toFixed(2)}`, `1.00`, `γ = (f+2)/f = ${gas.f + 2}/${gas.f} = ${gamma.toFixed(2)}.`));
  }

  const diodes = [
    { type: "Si", Vk: "0.7" },
    { type: "Ge", Vk: "0.3" },
  ];
  for (const d of diodes) {
    qs.push(makeQ("Semiconductors", "12", `The knee voltage of a ${d.type} diode is approximately:`, `${d.Vk} V`, `${d.type === "Si" ? "0.3" : "0.7"} V`, `1.0 V`, `0.1 V`, `${d.type} diodes have a knee voltage of approximately ${d.Vk} V.`));
  }

  const gates = [
    { name: "AND", truth: "output 1 only when all inputs are 1" },
    { name: "OR", truth: "output 1 when any input is 1" },
    { name: "NOT", truth: "output is complement of input" },
    { name: "NAND", truth: "output 0 only when all inputs are 1" },
    { name: "NOR", truth: "output 1 only when all inputs are 0" },
    { name: "XOR", truth: "output 1 when inputs are different" },
  ];
  for (const g of gates) {
    qs.push(makeQ("Semiconductors", "12", `A ${g.name} gate has the property that its:`, g.truth, gates[(gates.indexOf(g) + 1) % gates.length].truth, gates[(gates.indexOf(g) + 2) % gates.length].truth, gates[(gates.indexOf(g) + 3) % gates.length].truth, `${g.name} gate: ${g.truth}.`));
  }

  for (let beta = 50; beta <= 200; beta += 25) {
    const alpha = beta / (beta + 1);
    qs.push(makeQ("Semiconductors", "12", `Transistor with β=${beta}. Current gain α:`, `${alpha.toFixed(3)}`, `${(1 / beta).toFixed(3)}`, `${beta}`, `1`, `α = β/(β+1) = ${beta}/${beta + 1} = ${alpha.toFixed(3)}.`));
  }

  const modTypes = ["Amplitude", "Frequency", "Phase"];
  for (const mod of modTypes) {
    qs.push(makeQ("Communication Systems", "12", `In ${mod} Modulation (${mod[0]}M), which property of carrier is varied?`, `${mod.toLowerCase()}`, modTypes.filter((m) => m !== mod)[0].toLowerCase(), modTypes.filter((m) => m !== mod)[1].toLowerCase(), "wavelength", `In ${mod[0]}M, the ${mod.toLowerCase()} of the carrier wave is varied according to the message signal.`));
  }

  for (let bw = 5; bw <= 50; bw += 5) {
    for (let fc = 100; fc <= 500; fc += 100) {
      const sideband = bw / 2;
      qs.push(makeQ("Communication Systems", "12", `AM signal: carrier ${fc} kHz, bandwidth ${bw} kHz. Max modulating freq:`, `${sideband} kHz`, `${bw} kHz`, `${fc} kHz`, `${fc - sideband} kHz`, `Bandwidth = 2×fm. fm = ${bw}/2 = ${sideband} kHz.`));
    }
  }

  const units = [
    { qty: "Force", unit: "Newton", dim: "MLT⁻²" },
    { qty: "Energy", unit: "Joule", dim: "ML²T⁻²" },
    { qty: "Power", unit: "Watt", dim: "ML²T⁻³" },
    { qty: "Pressure", unit: "Pascal", dim: "ML⁻¹T⁻²" },
    { qty: "Momentum", unit: "kg·m/s", dim: "MLT⁻¹" },
    { qty: "Angular momentum", unit: "kg·m²/s", dim: "ML²T⁻¹" },
    { qty: "Torque", unit: "N·m", dim: "ML²T⁻²" },
    { qty: "Electric charge", unit: "Coulomb", dim: "AT" },
    { qty: "Electric potential", unit: "Volt", dim: "ML²T⁻³A⁻¹" },
    { qty: "Magnetic flux", unit: "Weber", dim: "ML²T⁻²A⁻¹" },
  ];
  for (const u of units) {
    qs.push(makeQ("Units & Dimensions", "11", `The SI unit of ${u.qty} is:`, u.unit, units[(units.indexOf(u) + 1) % units.length].unit, units[(units.indexOf(u) + 2) % units.length].unit, units[(units.indexOf(u) + 3) % units.length].unit, `${u.qty} has SI unit ${u.unit} with dimensions [${u.dim}].`));
    qs.push(makeQ("Units & Dimensions", "11", `The dimensional formula of ${u.qty} is:`, `[${u.dim}]`, `[${units[(units.indexOf(u) + 1) % units.length].dim}]`, `[${units[(units.indexOf(u) + 2) % units.length].dim}]`, `[${units[(units.indexOf(u) + 3) % units.length].dim}]`, `${u.qty} = [${u.dim}].`));
  }

  for (let rho = 800; rho <= 1200; rho += 100) {
    for (let h = 1; h <= 10; h++) {
      const P = rho * 10 * h;
      qs.push(makeQ("Fluid Mechanics", "11", `Pressure at depth ${h} m in liquid of density ${rho} kg/m³ (g=10):`, `${P} Pa`, `${P / 2} Pa`, `${rho * h} Pa`, `${P * 2} Pa`, `P = ρgh = ${rho}×10×${h} = ${P} Pa.`));
    }
  }

  for (let F = 10; F <= 100; F += 10) {
    for (let A = 1; A <= 5; A++) {
      const stress = F / A;
      qs.push(makeQ("Elasticity", "11", `Stress when ${F} N acts on area ${A} mm²:`, `${stress} MPa`, `${stress / 2} MPa`, `${F} MPa`, `${A} MPa`, `Stress = F/A = ${F}/${A}×10⁻⁶ = ${stress}×10⁶ Pa = ${stress} MPa.`));
    }
  }

  for (let F = 5; F <= 50; F += 5) {
    for (let L = 1; L <= 5; L++) {
      for (let dL = 1; dL <= 3; dL++) {
        const strain = dL / (L * 100);
        const strainStr = strain.toFixed(4);
        qs.push(makeQ("Elasticity", "11", `Wire length ${L} m extends by ${dL} mm under force ${F} N. Strain:`, strainStr, `${(strain * 2).toFixed(4)}`, `${(F / L).toFixed(4)}`, `${dL}`, `Strain = ΔL/L = ${dL}×10⁻³/${L} = ${strainStr}.`));
      }
    }
  }

  const emWaves = [
    { name: "Radio waves", range: "10⁻¹ to 10⁴ m", rank: 1 },
    { name: "Microwaves", range: "10⁻³ to 10⁻¹ m", rank: 2 },
    { name: "Infrared", range: "700 nm to 1 mm", rank: 3 },
    { name: "Visible light", range: "400 to 700 nm", rank: 4 },
    { name: "Ultraviolet", range: "10 to 400 nm", rank: 5 },
    { name: "X-rays", range: "0.01 to 10 nm", rank: 6 },
    { name: "Gamma rays", range: "< 0.01 nm", rank: 7 },
  ];
  for (let i = 0; i < emWaves.length; i++) {
    const w = emWaves[i];
    qs.push(makeQ("Electromagnetic Waves", "12", `${w.name} have wavelength range approximately:`, w.range, emWaves[(i + 1) % emWaves.length].range, emWaves[(i + 2) % emWaves.length].range, emWaves[(i + 3) % emWaves.length].range, `${w.name} occupy the range ${w.range} in the EM spectrum.`));
  }

  qs.push(makeQ("Electromagnetic Waves", "12", "The EM wave with highest frequency in the spectrum is:", "Gamma rays", "X-rays", "Ultraviolet", "Microwaves", "Gamma rays have the highest frequency and shortest wavelength in the EM spectrum."));
  qs.push(makeQ("Electromagnetic Waves", "12", "Electromagnetic waves are produced by:", "Accelerating charges", "Stationary charges", "Charges moving at constant velocity", "Gravitational fields", "Accelerating charges produce electromagnetic waves, as described by Maxwell's equations."));
  qs.push(makeQ("Electromagnetic Waves", "12", "The speed of electromagnetic waves in vacuum is:", "3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "Depends on frequency", "All EM waves travel at c = 3×10⁸ m/s in vacuum, regardless of frequency."));

  for (let m = 1; m <= 8; m++) {
    for (let v = 1; v <= 5; v++) {
      const p = m * v;
      qs.push(makeQ("Mechanics", "11", `Linear momentum of ${m} kg body moving at ${v} m/s:`, `${p} kg·m/s`, `${p / 2} kg·m/s`, `${m + v} kg·m/s`, `${p * 2} kg·m/s`, `p = mv = ${m}×${v} = ${p} kg·m/s.`));
    }
  }

  for (let m = 2; m <= 10; m += 2) {
    for (let h = 5; h <= 25; h += 5) {
      const pe = m * 10 * h;
      qs.push(makeQ("Mechanics", "11", `Potential energy of ${m} kg at height ${h} m (g=10):`, `${pe} J`, `${pe / 2} J`, `${m * h} J`, `${pe * 2} J`, `PE = mgh = ${m}×10×${h} = ${pe} J.`));
    }
  }

  for (let I = 1; I <= 5; I++) {
    for (let omega = 2; omega <= 10; omega += 2) {
      const L = I * omega;
      const KE = 0.5 * I * omega * omega;
      qs.push(makeQ("Mechanics", "11", `Angular momentum of body with I=${I} kg·m², ω=${omega} rad/s:`, `${L} kg·m²/s`, `${KE} kg·m²/s`, `${L / 2} kg·m²/s`, `${I + omega} kg·m²/s`, `L = Iω = ${I}×${omega} = ${L} kg·m²/s.`));
    }
  }

  for (let R1 = 1; R1 <= 5; R1++) {
    for (let R2 = 1; R2 <= 5; R2++) {
      for (let R3 = 1; R3 <= 3; R3++) {
        if (R1 === R2 && R2 === R3) continue;
        const Rs = R1 + R2 + R3;
        qs.push(makeQ("Current Electricity", "12", `Three resistors ${R1}Ω, ${R2}Ω, ${R3}Ω in series. Total:`, `${Rs} Ω`, `${Rs / 3} Ω`, `${R1 * R2} Ω`, `${Rs + R3} Ω`, `R = R₁+R₂+R₃ = ${R1}+${R2}+${R3} = ${Rs} Ω.`));
      }
    }
  }

  for (let M = 5; M <= 50; M += 5) {
    for (let R = 1; R <= 10; R++) {
      const g = (6.674 * M) / (R * R);
      const gStr = g.toFixed(2);
      qs.push(makeQ("Gravitation", "11", `Gravitational field at surface of planet (M=${M}×10²⁴ kg, R=${R}×10⁶ m):`, `${gStr} m/s²`, `${(g * 2).toFixed(2)} m/s²`, `${(g / 2).toFixed(2)} m/s²`, `${M} m/s²`, `g = GM/R² = 6.674×10⁻¹¹×${M}×10²⁴/(${R}×10⁶)² ≈ ${gStr} m/s².`));
    }
  }

  for (let h = 100; h <= 1000; h += 100) {
    const Re = 6400;
    const gRatio = Math.pow(Re / (Re + h), 2);
    qs.push(makeQ("Gravitation", "11", `g at height ${h} km (Re=6400 km) as fraction of surface g:`, `${gRatio.toFixed(3)}g`, `${(1 - h / Re).toFixed(3)}g`, `${(gRatio / 2).toFixed(3)}g`, `g`, `g_h = g(R/(R+h))² = g(6400/${Re + h})² = ${gRatio.toFixed(3)}g.`));
  }

  for (let r = 1; r <= 10; r++) {
    const ve = Math.sqrt(2 * 10 * r * 1000).toFixed(0);
    qs.push(makeQ("Gravitation", "11", `Escape velocity from planet with g=10 m/s², R=${r}×10³ km:`, `${ve} m/s`, `${(Number(ve) / 2).toFixed(0)} m/s`, `${(Number(ve) * 2).toFixed(0)} m/s`, `${r * 1000} m/s`, `vₑ = √(2gR) = √(2×10×${r}×10⁶) ≈ ${ve} m/s.`));
  }

  for (let T = 1; T <= 10; T++) {
    const r3 = T * T;
    qs.push(makeQ("Gravitation", "11", `Kepler's 3rd law: if T=${T} units, then r³ ∝:`, `${r3}`, `${T}`, `${r3 * 2}`, `${T * T * T}`, `T² ∝ r³. If T=${T}, then r³ ∝ T² = ${r3}.`));
  }

  const shapes = [
    { name: "solid sphere", formula: "2MR²/5", factor: 0.4 },
    { name: "hollow sphere", formula: "2MR²/3", factor: 0.667 },
    { name: "solid cylinder", formula: "MR²/2", factor: 0.5 },
    { name: "thin ring", formula: "MR²", factor: 1.0 },
    { name: "thin rod (center)", formula: "ML²/12", factor: 0.083 },
  ];
  for (const shape of shapes) {
    for (let M = 1; M <= 5; M++) {
      for (let R = 1; R <= 4; R++) {
        const I = shape.factor * M * R * R;
        const Istr = I.toFixed(2);
        qs.push(makeQ("Rotational Motion", "11", `Moment of inertia of ${shape.name} (M=${M} kg, R=${R} m):`, `${Istr} kg·m²`, `${(I * 2).toFixed(2)} kg·m²`, `${(M * R).toFixed(2)} kg·m²`, `${(I / 2).toFixed(2)} kg·m²`, `I = ${shape.formula} = ${shape.factor}×${M}×${R}² = ${Istr} kg·m².`));
      }
    }
  }

  for (let M = 1; M <= 5; M++) {
    for (let R = 1; R <= 5; R++) {
      const I = 0.4 * M * R * R;
      for (let omega = 2; omega <= 6; omega += 2) {
        const KE = 0.5 * I * omega * omega;
        qs.push(makeQ("Rotational Motion", "11", `Rotational KE of solid sphere (M=${M}, R=${R}, ω=${omega}):`, `${KE.toFixed(2)} J`, `${(KE * 2).toFixed(2)} J`, `${(KE / 2).toFixed(2)} J`, `${(M * omega).toFixed(2)} J`, `KE = ½Iω² = ½×(2/5×${M}×${R}²)×${omega}² = ${KE.toFixed(2)} J.`));
      }
    }
  }

  for (let tau = 5; tau <= 50; tau += 5) {
    for (let I = 1; I <= 5; I++) {
      const alpha = tau / I;
      qs.push(makeQ("Rotational Motion", "11", `Torque ${tau} N·m on body with I=${I} kg·m². Angular acceleration:`, `${alpha} rad/s²`, `${alpha / 2} rad/s²`, `${tau} rad/s²`, `${I} rad/s²`, `τ = Iα. α = τ/I = ${tau}/${I} = ${alpha} rad/s².`));
    }
  }

  for (let q = 1; q <= 10; q++) {
    for (let r = 1; r <= 5; r++) {
      const E = (9 * q) / (r * r);
      const Estr = E.toFixed(1);
      qs.push(makeQ("Electrostatics", "12", `Electric field at ${r} cm from charge ${q} μC (k=9×10⁹):`, `${Estr}×10⁵ N/C`, `${(E / 2).toFixed(1)}×10⁵ N/C`, `${(E * 2).toFixed(1)}×10⁵ N/C`, `${q} N/C`, `E = kq/r² = 9×10⁹×${q}×10⁻⁶/(${r}×10⁻²)² = ${Estr}×10⁵ N/C.`));
    }
  }

  for (let q = 1; q <= 10; q++) {
    for (let r = 1; r <= 5; r++) {
      const V = (9 * q) / r;
      const Vstr = V.toFixed(1);
      qs.push(makeQ("Electrostatics", "12", `Electric potential at ${r} cm from charge ${q} μC:`, `${Vstr}×10⁵ V`, `${(V / 2).toFixed(1)}×10⁵ V`, `${(V * 2).toFixed(1)}×10⁵ V`, `${q} V`, `V = kq/r = 9×10⁹×${q}×10⁻⁶/${r}×10⁻² = ${Vstr}×10⁵ V.`));
    }
  }

  for (let V = 5; V <= 50; V += 5) {
    for (let d = 1; d <= 5; d++) {
      const E = V / d;
      qs.push(makeQ("Electrostatics", "12", `Electric field between plates: V=${V} V, d=${d} mm:`, `${E} kV/m`, `${E / 2} kV/m`, `${E * 2} kV/m`, `${V} kV/m`, `E = V/d = ${V}/${d}×10⁻³ = ${E}×10³ V/m = ${E} kV/m.`));
    }
  }

  for (let n = 100; n <= 500; n += 100) {
    for (let A = 1; A <= 5; A++) {
      for (let B = 1; B <= 3; B++) {
        const phi = n * B * A;
        qs.push(makeQ("Magnetism", "12", `Magnetic flux through ${n}-turn coil, A=${A} cm², B=${B} T:`, `${phi}×10⁻⁴ Wb`, `${(phi / 2)}×10⁻⁴ Wb`, `${n} Wb`, `${B} Wb`, `Φ = NBA = ${n}×${B}×${A}×10⁻⁴ = ${phi}×10⁻⁴ Wb.`));
      }
    }
  }

  for (let n = 100; n <= 1000; n += 100) {
    for (let I = 1; I <= 5; I++) {
      const l = 0.5;
      const B = (4 * Math.PI * 1e-7 * n / l * I * 1e4).toFixed(2);
      qs.push(makeQ("Magnetism", "12", `Solenoid: ${n} turns, length 0.5 m, I=${I} A. B inside:`, `${B}×10⁻⁴ T`, `${(Number(B) * 2).toFixed(2)}×10⁻⁴ T`, `${(Number(B) / 2).toFixed(2)}×10⁻⁴ T`, `${I} T`, `B = μ₀nI/l = 4π×10⁻⁷×${n}/0.5×${I} = ${B}×10⁻⁴ T.`));
    }
  }

  for (let m = 1; m <= 5; m++) {
    for (let q = 1; q <= 5; q++) {
      for (let B = 1; B <= 3; B++) {
        const r = m / (q * B);
        const rStr = r.toFixed(2);
        qs.push(makeQ("Magnetism", "12", `Charged particle (m=${m}×10⁻²⁷, q=${q}×10⁻¹⁹, v=1) in B=${B} T. Radius:`, `${rStr}×10⁻⁸ m`, `${(r * 2).toFixed(2)}×10⁻⁸ m`, `${(r / 2).toFixed(2)}×10⁻⁸ m`, `${m} m`, `r = mv/(qB) = ${m}×10⁻²⁷/(${q}×10⁻¹⁹×${B}) = ${rStr}×10⁻⁸ m.`));
      }
    }
  }

  for (let V0 = 100; V0 <= 300; V0 += 50) {
    const Vrms = (V0 / Math.sqrt(2)).toFixed(1);
    qs.push(makeQ("Current Electricity", "12", `Peak voltage ${V0} V AC. RMS voltage:`, `${Vrms} V`, `${V0} V`, `${(V0 / 2)} V`, `${(V0 * Math.sqrt(2)).toFixed(1)} V`, `Vrms = V₀/√2 = ${V0}/1.414 = ${Vrms} V.`));
  }

  for (let R = 10; R <= 100; R += 10) {
    for (let L = 1; L <= 5; L++) {
      const tau = (L / R * 1000).toFixed(1);
      qs.push(makeQ("Electromagnetic Induction", "12", `LR circuit: L=${L} H, R=${R} Ω. Time constant:`, `${tau} ms`, `${(Number(tau) * 2).toFixed(1)} ms`, `${R} ms`, `${L} ms`, `τ = L/R = ${L}/${R} = ${Number(tau) / 1000} s = ${tau} ms.`));
    }
  }

  for (let R = 10; R <= 100; R += 10) {
    for (let C = 1; C <= 10; C++) {
      const tau = R * C;
      qs.push(makeQ("Current Electricity", "12", `RC circuit: R=${R} Ω, C=${C} μF. Time constant:`, `${tau} μs`, `${tau / 2} μs`, `${tau * 2} μs`, `${R + C} μs`, `τ = RC = ${R}×${C}×10⁻⁶ = ${tau}×10⁻⁶ s = ${tau} μs.`));
    }
  }

  for (let f = 50; f <= 500; f += 50) {
    for (let C = 1; C <= 10; C++) {
      const Xc = (1 / (2 * Math.PI * f * C * 1e-6)).toFixed(0);
      qs.push(makeQ("Current Electricity", "12", `Capacitive reactance: f=${f} Hz, C=${C} μF:`, `${Xc} Ω`, `${(Number(Xc) / 2).toFixed(0)} Ω`, `${f} Ω`, `${C} Ω`, `Xc = 1/(2πfC) = 1/(2π×${f}×${C}×10⁻⁶) ≈ ${Xc} Ω.`));
    }
  }

  for (let f = 50; f <= 500; f += 50) {
    for (let L = 1; L <= 5; L++) {
      const XL = (2 * Math.PI * f * L * 0.01).toFixed(1);
      qs.push(makeQ("Current Electricity", "12", `Inductive reactance: f=${f} Hz, L=${L*10} mH:`, `${XL} Ω`, `${(Number(XL) / 2).toFixed(1)} Ω`, `${f} Ω`, `${L} Ω`, `XL = 2πfL = 2π×${f}×${L * 0.01} ≈ ${XL} Ω.`));
    }
  }

  for (let E = 1; E <= 5; E++) {
    for (let lam = 200; lam <= 600; lam += 50) {
      const phi = (12400 / lam);
      if (phi >= E) continue;
      const KEmax = E - phi;
      if (KEmax <= 0) continue;
      qs.push(makeQ("Modern Physics", "12", `Photon energy ${E} eV hits metal (φ=${phi.toFixed(1)} eV). Max KE of electron:`, `${KEmax.toFixed(1)} eV`, `${E} eV`, `${phi.toFixed(1)} eV`, `${(KEmax * 2).toFixed(1)} eV`, `KEmax = E - φ = ${E} - ${phi.toFixed(1)} = ${KEmax.toFixed(1)} eV.`));
    }
  }

  for (let lam = 100; lam <= 700; lam += 50) {
    const E = (12400 / lam).toFixed(2);
    qs.push(makeQ("Modern Physics", "12", `Energy of photon with wavelength ${lam} nm (hc=12400 eV·Å):`, `${E} eV`, `${(Number(E) * 2).toFixed(2)} eV`, `${(Number(E) / 2).toFixed(2)} eV`, `${lam} eV`, `E = hc/λ = 12400/${lam * 10} ≈ ${(12400 / (lam * 10)).toFixed(2)} eV. Actually E=12400/(${lam}×10) = ${E} eV.`));
  }

  for (let Z = 1; Z <= 4; Z++) {
    for (let n1 = 1; n1 <= 3; n1++) {
      for (let n2 = n1 + 1; n2 <= n1 + 3 && n2 <= 6; n2++) {
        const E = 13.6 * Z * Z * (1 / (n1 * n1) - 1 / (n2 * n2));
        qs.push(makeQ("Modern Physics", "12", `Energy of photon emitted in transition n=${n2}→${n1} for Z=${Z}:`, `${E.toFixed(2)} eV`, `${(E / 2).toFixed(2)} eV`, `${(13.6 / (n1 * n1)).toFixed(2)} eV`, `${(E * 2).toFixed(2)} eV`, `E = 13.6Z²(1/n₁² - 1/n₂²) = 13.6×${Z}²(1/${n1}² - 1/${n2}²) = ${E.toFixed(2)} eV.`));
      }
    }
  }

  for (let A = 200; A <= 240; A += 4) {
    const bindingE = (A * 8.5).toFixed(0);
    qs.push(makeQ("Nuclear Physics", "12", `Binding energy of nucleus with A=${A} (avg BE/nucleon=8.5 MeV):`, `${bindingE} MeV`, `${(A * 7).toFixed(0)} MeV`, `${(A * 10).toFixed(0)} MeV`, `${A} MeV`, `BE = A × 8.5 = ${A}×8.5 = ${bindingE} MeV.`));
  }

  for (let V = 10; V <= 100; V += 10) {
    const lam = (12.27 / Math.sqrt(V)).toFixed(2);
    qs.push(makeQ("Modern Physics", "12", `de Broglie wavelength of electron at ${V} V (λ=12.27/√V Å):`, `${lam} Å`, `${(Number(lam) * 2).toFixed(2)} Å`, `${(Number(lam) / 2).toFixed(2)} Å`, `${V} Å`, `λ = 12.27/√${V} = ${lam} Å.`));
  }

  for (let P = 1; P <= 5; P++) {
    for (let V1 = 1; V1 <= 5; V1++) {
      for (let V2 = V1 + 1; V2 <= V1 + 3; V2++) {
        const W = P * (V2 - V1) * 101.325;
        const Wstr = W.toFixed(1);
        qs.push(makeQ("Thermodynamics", "11", `Work done by gas expanding isobarically from ${V1}L to ${V2}L at ${P} atm:`, `${Wstr} J`, `${(W / 2).toFixed(1)} J`, `${(W * 2).toFixed(1)} J`, `${P * V1} J`, `W = PΔV = ${P}×101325×${V2 - V1}×10⁻³ = ${Wstr} J.`));
      }
    }
  }

  for (let gamma = 1.3; gamma <= 1.7; gamma += 0.1) {
    const Cv = (8.314 / (gamma - 1)).toFixed(1);
    const Cp = (gamma * Number(Cv)).toFixed(1);
    qs.push(makeQ("Thermodynamics", "11", `Gas with γ=${gamma.toFixed(1)}. Cv =:`, `${Cv} J/mol·K`, `${Cp} J/mol·K`, `${(Number(Cv) / 2).toFixed(1)} J/mol·K`, `8.314 J/mol·K`, `Cv = R/(γ-1) = 8.314/${(gamma - 1).toFixed(1)} = ${Cv} J/mol·K.`));
  }

  for (let rho = 800; rho <= 1200; rho += 100) {
    for (let A = 1; A <= 5; A++) {
      const Fbuoy = rho * 10 * A * 0.001;
      qs.push(makeQ("Fluid Mechanics", "11", `Buoyant force on ${A}×10⁻³ m³ submerged in fluid (ρ=${rho}):`, `${Fbuoy.toFixed(1)} N`, `${(Fbuoy / 2).toFixed(1)} N`, `${rho} N`, `${(Fbuoy * 2).toFixed(1)} N`, `F = ρVg = ${rho}×${A}×10⁻³×10 = ${Fbuoy.toFixed(1)} N.`));
    }
  }

  for (let h = 1; h <= 10; h++) {
    const v = Math.sqrt(2 * 10 * h);
    const vStr = v.toFixed(2);
    qs.push(makeQ("Fluid Mechanics", "11", `Efflux velocity from hole at depth ${h} m (Torricelli, g=10):`, `${vStr} m/s`, `${(v / 2).toFixed(2)} m/s`, `${(v * 2).toFixed(2)} m/s`, `${h} m/s`, `v = √(2gh) = √(2×10×${h}) = ${vStr} m/s.`));
  }

  for (let eta = 1; eta <= 5; eta++) {
    for (let r = 1; r <= 5; r++) {
      for (let v = 1; v <= 3; v++) {
        const F = 6 * Math.PI * eta * r * v;
        const Fstr = F.toFixed(1);
        qs.push(makeQ("Fluid Mechanics", "11", `Stokes force: η=${eta}×10⁻³, r=${r}×10⁻³ m, v=${v} m/s:`, `${Fstr}π×10⁻⁶ N`, `${(F / 2).toFixed(1)}π×10⁻⁶ N`, `${eta * r} N`, `${(F * 2).toFixed(1)}π×10⁻⁶ N`, `F = 6πηrv = 6π×${eta}×10⁻³×${r}×10⁻³×${v} = ${Fstr}π×10⁻⁶ N.`));
      }
    }
  }

  for (let Y = 1; Y <= 5; Y++) {
    for (let stress = 10; stress <= 50; stress += 10) {
      const strain = stress / (Y * 100);
      qs.push(makeQ("Elasticity", "11", `Stress=${stress} MPa, Y=${Y}×10¹¹ Pa. Strain:`, `${strain.toFixed(5)}`, `${(strain * 2).toFixed(5)}`, `${(stress)}`, `${(strain / 2).toFixed(5)}`, `Strain = Stress/Y = ${stress}×10⁶/${Y}×10¹¹ = ${strain.toFixed(5)}.`));
    }
  }

  return qs;
}
