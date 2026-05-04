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
  const tmp = opts[0]; opts[0] = opts[idx]; opts[idx] = tmp;
  const correctKey = opts.find((o) => o.val === correct)!.key;
  return {
    subject: "Chemistry",
    topic, classGrade, year: pickYear(), difficulty: pickDifficulty(), questionType: "mcq",
    questionText,
    options: { A: opts[0].val, B: opts[1].val, C: opts[2].val, D: opts[3].val },
    correctAnswer: correctKey, solution, marks: 4,
  };
}

export function generateChemistryQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];

  for (let n = 1; n <= 7; n++) {
    const maxE = 2 * n * n;
    qs.push(makeQ("Atomic Structure", "11", `Max electrons in shell n=${n}:`, `${maxE}`, `${maxE / 2}`, `${n * n}`, `${maxE + 2}`, `Max electrons = 2n² = 2×${n}² = ${maxE}.`));
  }

  const orbitals = [
    { name: "s", l: 0, shape: "spherical", maxE: 2 },
    { name: "p", l: 1, shape: "dumbbell", maxE: 6 },
    { name: "d", l: 2, shape: "cloverleaf", maxE: 10 },
    { name: "f", l: 3, shape: "complex", maxE: 14 },
  ];
  for (const orb of orbitals) {
    qs.push(makeQ("Atomic Structure", "11", `The ${orb.name} orbital has azimuthal quantum number l=:`, `${orb.l}`, `${orb.l + 1}`, `${orb.l + 2}`, `${Math.max(0, orb.l - 1)}`, `For ${orb.name} orbital, l = ${orb.l}.`));
    qs.push(makeQ("Atomic Structure", "11", `Max electrons in ${orb.name} subshell:`, `${orb.maxE}`, `${orb.maxE + 2}`, `${orb.maxE - 2}`, `${orb.l}`, `Max electrons = 2(2l+1) = 2(2×${orb.l}+1) = ${orb.maxE}.`));
    qs.push(makeQ("Atomic Structure", "11", `Shape of ${orb.name} orbital is:`, orb.shape, orbitals[(orbitals.indexOf(orb) + 1) % 4].shape, orbitals[(orbitals.indexOf(orb) + 2) % 4].shape, orbitals[(orbitals.indexOf(orb) + 3) % 4].shape, `${orb.name} orbital has ${orb.shape} shape.`));
  }

  for (let n = 2; n <= 5; n++) {
    for (let l = 0; l < n && l <= 3; l++) {
      const radialNodes = n - l - 1;
      const orbName = ["s", "p", "d", "f"][l];
      qs.push(makeQ("Atomic Structure", "11", `Number of radial nodes in ${n}${orbName} orbital:`, `${radialNodes}`, `${radialNodes + 1}`, `${n}`, `${l}`, `Radial nodes = n - l - 1 = ${n} - ${l} - 1 = ${radialNodes}.`));
    }
  }

  const elements = [
    { name: "Na", Z: 11, config: "1s²2s²2p⁶3s¹", group: 1, block: "s" },
    { name: "Cl", Z: 17, config: "1s²2s²2p⁶3s²3p⁵", group: 17, block: "p" },
    { name: "Fe", Z: 26, config: "[Ar]3d⁶4s²", group: 8, block: "d" },
    { name: "Ca", Z: 20, config: "[Ar]4s²", group: 2, block: "s" },
    { name: "Cu", Z: 29, config: "[Ar]3d¹⁰4s¹", group: 11, block: "d" },
    { name: "Cr", Z: 24, config: "[Ar]3d⁵4s¹", group: 6, block: "d" },
    { name: "N", Z: 7, config: "1s²2s²2p³", group: 15, block: "p" },
    { name: "O", Z: 8, config: "1s²2s²2p⁴", group: 16, block: "p" },
    { name: "Ne", Z: 10, config: "1s²2s²2p⁶", group: 18, block: "p" },
    { name: "K", Z: 19, config: "[Ar]4s¹", group: 1, block: "s" },
  ];
  for (const el of elements) {
    qs.push(makeQ("Atomic Structure", "11", `Electronic configuration of ${el.name} (Z=${el.Z}):`, el.config, elements[(elements.indexOf(el) + 1) % elements.length].config, elements[(elements.indexOf(el) + 2) % elements.length].config, `[Ar]3d⁰4s²`, `${el.name} (Z=${el.Z}): ${el.config}.`));
    qs.push(makeQ("Periodic Table", "11", `${el.name} belongs to block:`, el.block, el.block === "s" ? "p" : "s", el.block === "d" ? "f" : "d", el.block === "p" ? "d" : "p", `${el.name} is in ${el.block}-block of the periodic table.`));
  }

  const bondAngles: [string, string, string][] = [
    ["H₂O", "104.5°", "sp³ (2 lone pairs compress angle)"],
    ["NH₃", "107°", "sp³ (1 lone pair compresses angle)"],
    ["CH₄", "109.5°", "sp³ (no lone pairs, perfect tetrahedral)"],
    ["BF₃", "120°", "sp² (trigonal planar)"],
    ["BeCl₂", "180°", "sp (linear)"],
    ["SF₆", "90°", "sp³d² (octahedral)"],
    ["PCl₅", "120°/90°", "sp³d (trigonal bipyramidal)"],
  ];
  for (let _i0 = 0; _i0 < bondAngles.length; _i0++) {
    const [mol, angle, expl] = bondAngles[_i0];
    qs.push(makeQ("Chemical Bonding", "11", `Bond angle in ${mol}:`, angle, bondAngles[(_i0 + 1) % bondAngles.length]?.[1] ?? "90°", "180°", "60°", `${mol}: ${expl}, bond angle ≈ ${angle}.`));
  }

  const hybridizations: [string, string][] = [
    ["CH₄", "sp³"], ["C₂H₄", "sp²"], ["C₂H₂", "sp"], ["BF₃", "sp²"], ["NH₃", "sp³"],
    ["H₂O", "sp³"], ["BeCl₂", "sp"], ["PCl₅", "sp³d"], ["SF₆", "sp³d²"], ["CO₂", "sp"],
  ];
  for (const [mol, hyb] of hybridizations) {
    qs.push(makeQ("Chemical Bonding", "11", `Hybridisation of central atom in ${mol}:`, hyb, hyb === "sp³" ? "sp²" : "sp³", hyb === "sp" ? "sp²" : "sp", hyb === "sp²" ? "sp³d" : "sp²", `Central atom in ${mol} is ${hyb} hybridised.`));
  }

  const periodicTrends = [
    { prop: "Ionisation energy", trend: "increases across a period, decreases down a group" },
    { prop: "Electronegativity", trend: "increases across a period, decreases down a group" },
    { prop: "Atomic radius", trend: "decreases across a period, increases down a group" },
    { prop: "Electron affinity", trend: "generally increases across a period (with exceptions)" },
    { prop: "Metallic character", trend: "decreases across a period, increases down a group" },
  ];
  for (const t of periodicTrends) {
    qs.push(makeQ("Periodic Table", "11", `${t.prop} in the periodic table:`, t.trend, periodicTrends[(periodicTrends.indexOf(t) + 1) % periodicTrends.length].trend, periodicTrends[(periodicTrends.indexOf(t) + 2) % periodicTrends.length].trend, "remains constant", `${t.prop} ${t.trend}.`));
  }

  for (let P = 1; P <= 5; P++) {
    for (let V = 1; V <= 10; V++) {
      const n = (P * V) / (0.0821 * 300);
      const nStr = n.toFixed(3);
      qs.push(makeQ("States of Matter", "11", `PV=nRT: ${P} atm, ${V} L at 300 K. Moles (R=0.0821):`, nStr, `${(n * 2).toFixed(3)}`, `${(n / 2).toFixed(3)}`, `${(P * V).toFixed(3)}`, `n = PV/RT = ${P}×${V}/(0.0821×300) = ${nStr} mol.`));
    }
  }

  for (let T1 = 200; T1 <= 400; T1 += 50) {
    for (let T2 = T1 + 50; T2 <= 500; T2 += 50) {
      const V1 = 10;
      const V2 = (V1 * T2) / T1;
      const V2str = V2.toFixed(1);
      qs.push(makeQ("States of Matter", "11", `Charles's law: gas at ${V1} L, ${T1} K heated to ${T2} K. New volume:`, `${V2str} L`, `${(V2 / 2).toFixed(1)} L`, `${V1} L`, `${(V2 * 2).toFixed(1)} L`, `V₁/T₁ = V₂/T₂. V₂ = ${V1}×${T2}/${T1} = ${V2str} L.`));
    }
  }

  const thermoConcepts: [string, string, string][] = [
    ["ΔG < 0", "spontaneous at constant T and P", "ΔG = ΔH - TΔS; negative means spontaneous"],
    ["ΔH < 0", "exothermic reaction", "Negative enthalpy change means heat is released"],
    ["ΔS > 0", "entropy increases", "Positive entropy change means disorder increases"],
    ["ΔH > 0", "endothermic reaction", "Positive enthalpy change means heat is absorbed"],
  ];
  for (let _i1 = 0; _i1 < thermoConcepts.length; _i1++) {
    const [cond, meaning, expl] = thermoConcepts[_i1];
    qs.push(makeQ("Thermodynamics", "11", `For a process with ${cond}, the process is:`, meaning, thermoConcepts[(_i1 + 1) % thermoConcepts.length]?.[1] ?? "non-spontaneous", "at equilibrium", "impossible to determine", expl));
  }

  for (let q = 100; q <= 1000; q += 100) {
    for (let w = 0; w <= q; w += 100) {
      if (w === q) continue;
      const dU = q - w;
      qs.push(makeQ("Thermodynamics", "11", `System absorbs ${q} J heat and does ${w} J work. Change in internal energy:`, `${dU} J`, `${q + w} J`, `${w} J`, `${q} J`, `ΔU = q - w = ${q} - ${w} = ${dU} J (First law).`));
    }
  }

  const buffers: [string, string][] = [
    ["CH₃COOH + CH₃COONa", "acidic buffer"],
    ["NH₄OH + NH₄Cl", "basic buffer"],
    ["H₂CO₃ + NaHCO₃", "acidic buffer"],
    ["NH₃ + (NH₄)₂SO₄", "basic buffer"],
  ];
  for (const [components, type] of buffers) {
    qs.push(makeQ("Equilibrium", "11", `${components} forms a:`, type, type === "acidic buffer" ? "basic buffer" : "acidic buffer", "neutral solution", "non-buffer", `${components} is a ${type} system.`));
  }

  for (let pH = 1; pH <= 13; pH++) {
    const pOH = 14 - pH;
    const nature = pH < 7 ? "acidic" : pH > 7 ? "basic" : "neutral";
    qs.push(makeQ("Equilibrium", "11", `Solution with pH = ${pH} is:`, nature, nature === "acidic" ? "basic" : "acidic", "neutral", "amphoteric", `pH ${pH}: ${nature}. pOH = 14 - ${pH} = ${pOH}.`));
  }

  for (let pH = 1; pH <= 6; pH++) {
    const H = Math.pow(10, -pH);
    qs.push(makeQ("Equilibrium", "11", `[H⁺] when pH = ${pH}:`, `10⁻${pH} M`, `10⁻${pH + 1} M`, `${pH} M`, `10${pH} M`, `[H⁺] = 10⁻ᵖᴴ = 10⁻${pH} M.`));
  }

  for (let Ecell = 0.5; Ecell <= 2.0; Ecell += 0.25) {
    for (let n = 1; n <= 3; n++) {
      const dG = -n * 96485 * Ecell;
      const dGkJ = (dG / 1000).toFixed(1);
      qs.push(makeQ("Electrochemistry", "12", `E°cell = ${Ecell.toFixed(2)} V, n = ${n}. ΔG° (F=96485):`, `${dGkJ} kJ`, `${(-dG / 1000).toFixed(1)} kJ`, `${(n * Ecell).toFixed(1)} kJ`, `${Ecell.toFixed(2)} kJ`, `ΔG° = -nFE° = -${n}×96485×${Ecell.toFixed(2)} = ${dGkJ} kJ.`));
    }
  }

  const electrodes: [string, string, string][] = [
    ["Zn²⁺/Zn", "-0.76 V", "anode in Daniell cell"],
    ["Cu²⁺/Cu", "+0.34 V", "cathode in Daniell cell"],
    ["Ag⁺/Ag", "+0.80 V", "noble metal electrode"],
    ["H⁺/H₂", "0.00 V", "standard hydrogen electrode (SHE)"],
    ["Fe²⁺/Fe", "-0.44 V", "iron electrode"],
    ["Al³⁺/Al", "-1.66 V", "strong reducing agent"],
  ];
  for (let _i2 = 0; _i2 < electrodes.length; _i2++) {
    const [electrode, potential, note] = electrodes[_i2];
    qs.push(makeQ("Electrochemistry", "12", `Standard reduction potential of ${electrode}:`, potential, electrodes[(_i2 + 1) % electrodes.length]?.[1] ?? "0.00 V", "+1.00 V", "-2.00 V", `E°(${electrode}) = ${potential} (${note}).`));
  }

  for (let k = 1; k <= 5; k++) {
    const orders = [0, 1, 2];
    for (const order of orders) {
      const unit = order === 0 ? "mol L⁻¹ s⁻¹" : order === 1 ? "s⁻¹" : "L mol⁻¹ s⁻¹";
      qs.push(makeQ("Chemical Kinetics", "12", `Unit of rate constant for ${order}${order === 1 ? "st" : order === 2 ? "nd" : "th"} order reaction:`, unit, order === 0 ? "s⁻¹" : "mol L⁻¹ s⁻¹", "L² mol⁻² s⁻¹", "mol s⁻¹", `For order ${order}: k has units ${unit}.`));
    }
  }

  for (let t12 = 10; t12 <= 100; t12 += 10) {
    const k = (0.693 / t12).toFixed(4);
    qs.push(makeQ("Chemical Kinetics", "12", `First-order reaction with t½ = ${t12} min. Rate constant:`, `${k} min⁻¹`, `${(1 / t12).toFixed(4)} min⁻¹`, `${(0.693 * t12).toFixed(1)} min⁻¹`, `${t12} min⁻¹`, `k = 0.693/t½ = 0.693/${t12} = ${k} min⁻¹.`));
  }

  const funcGroups: [string, string, string][] = [
    ["Alcohol", "-OH", "hydroxyl group"],
    ["Aldehyde", "-CHO", "formyl/aldehyde group"],
    ["Ketone", "-CO-", "carbonyl group flanked by carbons"],
    ["Carboxylic acid", "-COOH", "carboxyl group"],
    ["Amine", "-NH₂", "amino group"],
    ["Ester", "-COO-", "ester linkage"],
    ["Ether", "-O-", "ether linkage"],
    ["Amide", "-CONH₂", "amide group"],
    ["Nitro", "-NO₂", "nitro group"],
    ["Nitrile", "-CN", "cyano group"],
  ];
  for (let _i3 = 0; _i3 < funcGroups.length; _i3++) {
    const [name, group, desc] = funcGroups[_i3];
    qs.push(makeQ("Organic Chemistry", "11", `The functional group ${group} corresponds to:`, name, funcGroups[(_i3 + 1) % funcGroups.length]?.[0] ?? "Alcohol", funcGroups[(_i3 + 2) % funcGroups.length]?.[0] ?? "Ketone", funcGroups[(_i3 + 3) % funcGroups.length]?.[0] ?? "Ester", `${group} is the ${desc}, characteristic of ${name}s.`));
  }

  const isomers: [string, number][] = [
    ["C₃H₈", 1], ["C₄H₁₀", 2], ["C₅H₁₂", 3], ["C₆H₁₄", 5], ["C₇H₁₆", 9],
  ];
  for (const [formula, count] of isomers) {
    qs.push(makeQ("Organic Chemistry", "11", `Number of structural isomers of ${formula}:`, `${count}`, `${count + 1}`, `${count - 1 > 0 ? count - 1 : count + 2}`, `${count * 2}`, `${formula} has ${count} structural isomer(s).`));
  }

  const namedReactions: [string, string, string][] = [
    ["Wurtz reaction", "2RX + 2Na → R-R + 2NaX", "coupling of alkyl halides with Na"],
    ["Friedel-Crafts alkylation", "ArH + RCl → ArR + HCl (AlCl₃ catalyst)", "electrophilic substitution on benzene"],
    ["Cannizzaro reaction", "2HCHO + NaOH → HCOONa + CH₃OH", "disproportionation of non-enolizable aldehyde"],
    ["Aldol condensation", "2CH₃CHO → CH₃CH(OH)CH₂CHO", "β-hydroxy aldehyde formation"],
    ["Kolbe's reaction", "C₆H₅ONa + CO₂ → C₆H₄(OH)COONa", "carboxylation of sodium phenoxide"],
    ["Williamson synthesis", "R-ONa + R'-X → R-O-R' + NaX", "ether synthesis from alkoxide and alkyl halide"],
    ["Sandmeyer reaction", "ArN₂⁺Cl⁻ + CuX → ArX + N₂", "replacement of diazonium group by halide"],
    ["Reimer-Tiemann reaction", "C₆H₅OH + CHCl₃ + NaOH → C₆H₃(OH)CHO", "formylation of phenol"],
    ["Hofmann bromamide", "RCONH₂ + Br₂ + NaOH → RNH₂", "amine with one fewer carbon from amide"],
    ["Clemmensen reduction", "RCOR' + Zn-Hg/HCl → RCH₂R'", "carbonyl reduced to methylene"],
  ];
  for (let _i4 = 0; _i4 < namedReactions.length; _i4++) {
    const [name, eq, desc] = namedReactions[_i4];
    qs.push(makeQ("Organic Chemistry", "12", `${name} involves:`, desc, namedReactions[(_i4 + 1) % namedReactions.length]?.[2] ?? "oxidation", namedReactions[(_i4 + 2) % namedReactions.length]?.[2] ?? "reduction", "polymerization", `${name}: ${eq}. It is ${desc}.`));
    qs.push(makeQ("Organic Chemistry", "12", `The equation for ${name} is:`, eq, namedReactions[(_i4 + 1) % namedReactions.length]?.[1] ?? "N/A", namedReactions[(_i4 + 2) % namedReactions.length]?.[1] ?? "N/A", "Not applicable", `${name}: ${eq}.`));
  }

  const coordCompounds: [string, string, string, number][] = [
    ["[Co(NH₃)₆]³⁺", "hexaamminecobalt(III)", "octahedral", 6],
    ["[Ni(CN)₄]²⁻", "tetracyanonickelate(II)", "square planar", 4],
    ["[Fe(CN)₆]⁴⁻", "hexacyanoferrate(II)", "octahedral", 6],
    ["[Cu(NH₃)₄]²⁺", "tetraamminecopper(II)", "square planar", 4],
    ["[Zn(OH)₄]²⁻", "tetrahydroxozincate(II)", "tetrahedral", 4],
    ["[Ag(NH₃)₂]⁺", "diamminesilver(I)", "linear", 2],
    ["[PtCl₄]²⁻", "tetrachloroplatinate(II)", "square planar", 4],
    ["[CoCl₂(en)₂]⁺", "dichloridobis(ethylenediamine)cobalt(III)", "octahedral", 6],
  ];
  for (let _i5 = 0; _i5 < coordCompounds.length; _i5++) {
    const [formula, iupac, geometry, cn] = coordCompounds[_i5];
    qs.push(makeQ("Coordination Compounds", "12", `IUPAC name of ${formula}:`, iupac, coordCompounds[(_i5 + 1) % coordCompounds.length]?.[1] ?? "unnamed", coordCompounds[(_i5 + 2) % coordCompounds.length]?.[1] ?? "unnamed", "hexachloroplatinate(IV)", `${formula} → ${iupac}.`));
    qs.push(makeQ("Coordination Compounds", "12", `Geometry of ${formula}:`, geometry, geometry === "octahedral" ? "tetrahedral" : "octahedral", "linear", geometry === "square planar" ? "tetrahedral" : "square planar", `${formula} has coordination number ${cn} and ${geometry} geometry.`));
  }

  for (let m = 1; m <= 10; m++) {
    for (let M = 40; M <= 200; M += 40) {
      const n = m / M;
      const nStr = n.toFixed(4);
      qs.push(makeQ("Solutions", "12", `Moles in ${m} g of substance (M = ${M} g/mol):`, nStr, `${(n * 2).toFixed(4)}`, `${M}`, `${(m * M).toFixed(1)}`, `n = m/M = ${m}/${M} = ${nStr} mol.`));
    }
  }

  for (let dTb = 0.1; dTb <= 1.0; dTb += 0.1) {
    const Kb = 0.52;
    const m = dTb / Kb;
    const mStr = m.toFixed(3);
    qs.push(makeQ("Solutions", "12", `ΔTb = ${dTb.toFixed(1)}°C in water (Kb = 0.52). Molality:`, `${mStr} m`, `${(m * 2).toFixed(3)} m`, `${dTb.toFixed(1)} m`, `0.52 m`, `m = ΔTb/Kb = ${dTb.toFixed(1)}/0.52 = ${mStr} m.`));
  }

  const crystalSystems: [string, number, string][] = [
    ["Simple cubic (SC)", 1, "52.4%"],
    ["Body-centred cubic (BCC)", 2, "68%"],
    ["Face-centred cubic (FCC)", 4, "74%"],
    ["Hexagonal close-packed (HCP)", 6, "74%"],
  ];
  for (let _i6 = 0; _i6 < crystalSystems.length; _i6++) {
    const [name, atoms, eff] = crystalSystems[_i6];
    qs.push(makeQ("Solid State", "12", `Atoms per unit cell in ${name}:`, `${atoms}`, `${atoms + 1}`, `${atoms * 2}`, `${atoms === 1 ? 4 : 1}`, `${name} has ${atoms} atom(s) per unit cell.`));
    qs.push(makeQ("Solid State", "12", `Packing efficiency of ${name}:`, eff, crystalSystems[(_i6 + 1) % crystalSystems.length]?.[2] ?? "52.4%", "100%", "50%", `${name} packing efficiency = ${eff}.`));
  }

  const pBlockElements: [string, string, string][] = [
    ["F₂", "pale yellow gas, most electronegative element", "Halogens"],
    ["Cl₂", "greenish-yellow gas, used as disinfectant", "Halogens"],
    ["Br₂", "reddish-brown liquid at room temperature", "Halogens"],
    ["I₂", "purple/violet vapour, used as antiseptic", "Halogens"],
    ["O₃", "triatomic allotrope of oxygen, shields UV", "Oxygen Family"],
    ["SO₂", "colourless gas with pungent smell, causes acid rain", "Oxygen Family"],
    ["N₂", "inert diatomic gas, triple bond (bond order 3)", "Nitrogen Family"],
    ["NH₃", "pungent gas, Haber process product", "Nitrogen Family"],
    ["HNO₃", "strong oxidising acid, aqua regia component", "Nitrogen Family"],
    ["P₄", "white phosphorus, tetraatomic, pyrophoric", "Nitrogen Family"],
    ["CO₂", "greenhouse gas, linear molecule", "Carbon Family"],
    ["SiO₂", "quartz, network covalent solid", "Carbon Family"],
    ["He", "lightest noble gas, used in balloons", "Noble Gases"],
    ["Ne", "used in neon signs, red-orange glow", "Noble Gases"],
    ["Ar", "most abundant noble gas in atmosphere", "Noble Gases"],
    ["Xe", "can form compounds like XeF₂, XeF₄", "Noble Gases"],
  ];
  for (let _i7 = 0; _i7 < pBlockElements.length; _i7++) {
    const [formula, property, family] = pBlockElements[_i7];
    qs.push(makeQ("p-Block Elements", "12", `${formula}: its key property is:`, property, pBlockElements[(_i7 + 1) % pBlockElements.length]?.[1] ?? "unknown", pBlockElements[(_i7 + 2) % pBlockElements.length]?.[1] ?? "unknown", "none of these", `${formula} (${family}): ${property}.`));
  }

  const dBlockProps: [string, string, string][] = [
    ["Variable oxidation states", "d-block elements", "Due to involvement of both ns and (n-1)d electrons in bonding"],
    ["Coloured compounds", "transition metals", "Due to d-d electronic transitions"],
    ["Paramagnetism", "transition metal compounds", "Due to unpaired d electrons"],
    ["Catalytic activity", "transition metals", "Due to variable oxidation states and ability to form intermediates"],
    ["Complex formation", "transition metals", "Due to availability of vacant d orbitals to accept lone pairs"],
    ["High melting points", "transition metals", "Due to strong metallic bonding from d electron participation"],
    ["Alloy formation", "transition metals", "Due to similar atomic sizes allowing substitution"],
  ];
  for (let _i8 = 0; _i8 < dBlockProps.length; _i8++) {
    const [prop, applies, reason] = dBlockProps[_i8];
    qs.push(makeQ("d-Block Elements", "12", `${prop} is characteristic of:`, applies, "s-block elements", "noble gases", "halogens", `${prop} of ${applies}: ${reason}.`));
    qs.push(makeQ("d-Block Elements", "12", `Reason for ${prop.toLowerCase()} in transition metals:`, reason, dBlockProps[(_i8 + 1) % dBlockProps.length]?.[2] ?? "unknown", "Due to large atomic size only", "Not applicable", `${prop}: ${reason}.`));
  }

  const biomolecules: [string, string, string][] = [
    ["Glucose", "C₆H₁₂O₆", "aldohexose monosaccharide"],
    ["Fructose", "C₆H₁₂O₆", "ketohexose monosaccharide"],
    ["Sucrose", "C₁₂H₂₂O₁₁", "glucose + fructose disaccharide"],
    ["Maltose", "C₁₂H₂₂O₁₁", "glucose + glucose disaccharide"],
    ["Lactose", "C₁₂H₂₂O₁₁", "glucose + galactose disaccharide"],
    ["Starch", "(C₆H₁₀O₅)ₙ", "amylose + amylopectin polysaccharide"],
    ["Cellulose", "(C₆H₁₀O₅)ₙ", "β-glucose polymer, structural"],
    ["Glycogen", "(C₆H₁₀O₅)ₙ", "animal storage polysaccharide"],
  ];
  for (let _i9 = 0; _i9 < biomolecules.length; _i9++) {
    const [name, formula, desc] = biomolecules[_i9];
    qs.push(makeQ("Biomolecules", "12", `${name} is a:`, desc, biomolecules[(_i9 + 1) % biomolecules.length]?.[2] ?? "lipid", biomolecules[(_i9 + 2) % biomolecules.length]?.[2] ?? "protein", "nucleic acid", `${name} (${formula}): ${desc}.`));
  }

  const aminoAcids: [string, string][] = [
    ["Glycine", "simplest amino acid, R = H"],
    ["Alanine", "R = CH₃, non-polar"],
    ["Valine", "R = isopropyl, essential"],
    ["Leucine", "R = isobutyl, essential"],
    ["Serine", "R = CH₂OH, polar"],
    ["Cysteine", "R = CH₂SH, forms disulphide bonds"],
    ["Lysine", "R = (CH₂)₄NH₂, basic"],
    ["Glutamic acid", "R = (CH₂)₂COOH, acidic"],
  ];
  for (let _i10 = 0; _i10 < aminoAcids.length; _i10++) {
    const [name, desc] = aminoAcids[_i10];
    qs.push(makeQ("Biomolecules", "12", `${name}: property is:`, desc, aminoAcids[(_i10 + 1) % aminoAcids.length]?.[1] ?? "unknown", aminoAcids[(_i10 + 2) % aminoAcids.length]?.[1] ?? "unknown", "aromatic amino acid", `${name}: ${desc}.`));
  }

  const polymers: [string, string, string][] = [
    ["Polyethylene", "addition", "nCH₂=CH₂ → (-CH₂-CH₂-)ₙ"],
    ["PVC", "addition", "nCH₂=CHCl → (-CH₂-CHCl-)ₙ"],
    ["Polystyrene", "addition", "nC₆H₅CH=CH₂ → polymer"],
    ["Teflon", "addition", "nCF₂=CF₂ → (-CF₂-CF₂-)ₙ"],
    ["Nylon-6,6", "condensation", "hexamethylenediamine + adipic acid"],
    ["Bakelite", "condensation", "phenol + formaldehyde"],
    ["Terylene (PET)", "condensation", "ethylene glycol + terephthalic acid"],
    ["Natural rubber", "addition", "isoprene polymer, cis-1,4-polyisoprene"],
  ];
  for (let _i11 = 0; _i11 < polymers.length; _i11++) {
    const [name, type, monomer] = polymers[_i11];
    qs.push(makeQ("Polymers", "12", `${name} is formed by ${type} polymerisation of:`, monomer, polymers[(_i11 + 1) % polymers.length]?.[2] ?? "ethylene", polymers[(_i11 + 2) % polymers.length]?.[2] ?? "propylene", "butadiene", `${name}: ${type} polymer. ${monomer}.`));
  }

  const envChem: [string, string, string][] = [
    ["CFC", "ozone depletion", "Release Cl atoms that catalytically destroy O₃"],
    ["CO₂", "global warming", "Greenhouse gas that traps IR radiation"],
    ["SO₂", "acid rain", "Forms H₂SO₄ in atmosphere"],
    ["NO₂", "photochemical smog", "Brown gas, forms in car exhaust"],
    ["CO", "carbon monoxide poisoning", "Binds haemoglobin 200× more than O₂"],
    ["CH₄", "greenhouse effect", "21× more potent greenhouse gas than CO₂"],
    ["Pb", "lead poisoning", "Neurological damage, banned in petrol"],
    ["DDT", "bioaccumulation", "Non-biodegradable pesticide, biomagnification"],
  ];
  for (let _i12 = 0; _i12 < envChem.length; _i12++) {
    const [pollutant, effect, mechanism] = envChem[_i12];
    qs.push(makeQ("Environmental Chemistry", "11", `${pollutant} is primarily associated with:`, effect, envChem[(_i12 + 1) % envChem.length]?.[1] ?? "water pollution", envChem[(_i12 + 2) % envChem.length]?.[1] ?? "noise pollution", "thermal pollution", `${pollutant}: ${effect}. ${mechanism}.`));
  }

  const surfaceChem: [string, string][] = [
    ["Physisorption", "weak van der Waals forces, reversible, low heat"],
    ["Chemisorption", "chemical bond formation, irreversible, high activation energy"],
    ["Lyophilic colloid", "solvent-loving, reversible, self-stabilised"],
    ["Lyophobic colloid", "solvent-hating, irreversible, needs stabiliser"],
    ["Tyndall effect", "scattering of light by colloidal particles"],
    ["Brownian motion", "random zigzag motion of colloidal particles"],
    ["Electrophoresis", "movement of colloidal particles under electric field"],
    ["Coagulation", "aggregation of colloidal particles by electrolyte"],
  ];
  for (let _i13 = 0; _i13 < surfaceChem.length; _i13++) {
    const [term, def] = surfaceChem[_i13];
    qs.push(makeQ("Surface Chemistry", "12", `${term} is characterised by:`, def, surfaceChem[(_i13 + 1) % surfaceChem.length]?.[1] ?? "unknown", surfaceChem[(_i13 + 2) % surfaceChem.length]?.[1] ?? "unknown", "none of these", `${term}: ${def}.`));
  }

  const ores: [string, string, string][] = [
    ["Iron", "Haematite", "Fe₂O₃"],
    ["Aluminium", "Bauxite", "Al₂O₃·2H₂O"],
    ["Copper", "Chalcopyrite", "CuFeS₂"],
    ["Zinc", "Calamine", "ZnCO₃"],
    ["Lead", "Galena", "PbS"],
    ["Tin", "Cassiterite", "SnO₂"],
    ["Mercury", "Cinnabar", "HgS"],
    ["Silver", "Argentite", "Ag₂S"],
  ];
  for (let _i14 = 0; _i14 < ores.length; _i14++) {
    const [metal, ore, formula] = ores[_i14];
    qs.push(makeQ("p-Block Elements", "12", `The principal ore of ${metal} is:`, `${ore} (${formula})`, ores[(_i14 + 1) % ores.length]?.[1] ?? "Bauxite", ores[(_i14 + 2) % ores.length]?.[1] ?? "Galena", ores[(_i14 + 3) % ores.length]?.[1] ?? "Cinnabar", `${metal}: ore is ${ore} (${formula}).`));
  }

  for (let mf = 1; mf <= 5; mf++) {
    for (let Kf = 1.5; Kf <= 5; Kf += 0.5) {
      const dTf = Kf * mf;
      const dTfStr = dTf.toFixed(1);
      qs.push(makeQ("Solutions", "12", `Depression in freezing point: Kf=${Kf.toFixed(1)}, m=${mf}. ΔTf:`, `${dTfStr}°C`, `${(dTf / 2).toFixed(1)}°C`, `${(dTf * 2).toFixed(1)}°C`, `${Kf.toFixed(1)}°C`, `ΔTf = Kf×m = ${Kf.toFixed(1)}×${mf} = ${dTfStr}°C.`));
    }
  }

  const oxidationStates: [string, string, number][] = [
    ["MnO₄⁻", "Mn", 7], ["Cr₂O₇²⁻", "Cr", 6], ["SO₄²⁻", "S", 6],
    ["NO₃⁻", "N", 5], ["ClO₃⁻", "Cl", 5], ["PO₄³⁻", "P", 5],
    ["H₂SO₃", "S", 4], ["CO₂", "C", 4], ["HNO₂", "N", 3],
    ["Fe₂O₃", "Fe", 3], ["CuO", "Cu", 2], ["NaCl", "Na", 1],
  ];
  for (const [compound, element, oxState] of oxidationStates) {
    qs.push(makeQ("Electrochemistry", "12", `Oxidation state of ${element} in ${compound}:`, `+${oxState}`, `+${oxState + 1}`, `+${oxState - 1 > 0 ? oxState - 1 : oxState + 2}`, `0`, `In ${compound}, ${element} has oxidation state +${oxState}.`));
  }

  const molarMasses: [string, number][] = [
    ["H₂O", 18], ["NaCl", 58.5], ["H₂SO₄", 98], ["NaOH", 40], ["CaCO₃", 100],
    ["HCl", 36.5], ["KMnO₄", 158], ["FeSO₄", 152], ["CuSO₄", 159.5], ["AgNO₃", 170],
    ["Na₂CO₃", 106], ["K₂Cr₂O₇", 294], ["MgSO₄", 120], ["AlCl₃", 133.5], ["BaCl₂", 208],
    ["ZnSO₄", 161], ["NH₄Cl", 53.5], ["Ca(OH)₂", 74], ["Fe₂(SO₄)₃", 400], ["KNO₃", 101],
  ];
  for (const [name, M] of molarMasses) {
    for (let g = 10; g <= 100; g += 10) {
      const mol = (g / M).toFixed(4);
      qs.push(makeQ("Mole Concept", "11", `Moles in ${g} g of ${name} (M=${M}):`, `${mol} mol`, `${(g * M / 1000).toFixed(4)} mol`, `${(Number(mol) * 2).toFixed(4)} mol`, `${M} mol`, `n = m/M = ${g}/${M} = ${mol} mol.`));
    }
    const molecules = (6.022).toFixed(3);
    qs.push(makeQ("Mole Concept", "11", `Number of molecules in 1 mole of ${name}:`, `6.022×10²³`, `3.011×10²³`, `${M}×10²³`, `1.204×10²⁴`, `1 mole = Avogadro's number = 6.022×10²³ molecules.`));
  }

  for (let g = 5; g <= 50; g += 5) {
    for (let V = 100; V <= 1000; V += 100) {
      for (const [name, M] of [["NaOH", 40], ["HCl", 36.5], ["H₂SO₄", 98], ["NaCl", 58.5], ["KOH", 56]] as [string, number][]) {
        const mol = g / M;
        const molarity = (mol / (V / 1000)).toFixed(4);
        qs.push(makeQ("Solutions", "12", `Molarity: ${g} g ${name} (M=${M}) in ${V} mL:`, `${molarity} M`, `${(Number(molarity) / 2).toFixed(4)} M`, `${(Number(molarity) * 2).toFixed(4)} M`, `${g} M`, `M = (g/Mw)/(V_L) = (${g}/${M})/(${V}/1000) = ${molarity} M.`));
      }
    }
  }

  for (let M1 = 0.1; M1 <= 1.0; M1 += 0.1) {
    for (let V1 = 10; V1 <= 50; V1 += 10) {
      for (let V2 = 100; V2 <= 500; V2 += 100) {
        const M2 = (M1 * V1) / V2;
        qs.push(makeQ("Solutions", "12", `Dilution: ${M1.toFixed(1)} M × ${V1} mL diluted to ${V2} mL. New M:`, `${M2.toFixed(4)} M`, `${(M2 * 2).toFixed(4)} M`, `${M1.toFixed(1)} M`, `${(M2 / 2).toFixed(4)} M`, `M₁V₁ = M₂V₂. M₂ = ${M1.toFixed(1)}×${V1}/${V2} = ${M2.toFixed(4)} M.`));
      }
    }
  }

  for (let C = 0.01; C <= 0.1; C += 0.01) {
    const pH = -Math.log10(C);
    qs.push(makeQ("Equilibrium", "11", `pH of ${C.toFixed(2)} M HCl (strong acid):`, `${pH.toFixed(2)}`, `${(14 - pH).toFixed(2)}`, `${(pH + 1).toFixed(2)}`, `7`, `pH = -log[H⁺] = -log(${C.toFixed(2)}) = ${pH.toFixed(2)}.`));
    qs.push(makeQ("Equilibrium", "11", `pH of ${C.toFixed(2)} M NaOH (strong base):`, `${(14 - pH).toFixed(2)}`, `${pH.toFixed(2)}`, `7`, `${(14 + pH).toFixed(2)}`, `pOH = -log(${C.toFixed(2)}) = ${pH.toFixed(2)}. pH = 14 - ${pH.toFixed(2)} = ${(14 - pH).toFixed(2)}.`));
  }

  for (let Ka = -3; Ka >= -6; Ka--) {
    for (let C = 0.01; C <= 0.1; C += 0.01) {
      const H = Math.sqrt(C * Math.pow(10, Ka));
      const pH = -Math.log10(H);
      qs.push(makeQ("Equilibrium", "11", `Weak acid: Ka=10^${Ka}, C=${C.toFixed(2)} M. Approximate pH:`, `${pH.toFixed(2)}`, `${(pH + 1).toFixed(2)}`, `${(pH - 1).toFixed(2)}`, `7`, `[H⁺] = √(Ka×C) = √(10^${Ka}×${C.toFixed(2)}). pH ≈ ${pH.toFixed(2)}.`));
    }
  }

  for (let P1 = 1; P1 <= 5; P1++) {
    for (let V1 = 1; V1 <= 5; V1++) {
      for (let V2 = V1 + 1; V2 <= V1 + 4; V2++) {
        const P2 = (P1 * V1) / V2;
        qs.push(makeQ("States of Matter", "11", `Boyle's law: P₁=${P1} atm, V₁=${V1} L → V₂=${V2} L. P₂:`, `${P2.toFixed(3)} atm`, `${(P2 * 2).toFixed(3)} atm`, `${P1} atm`, `${V2} atm`, `P₁V₁=P₂V₂. P₂=${P1}×${V1}/${V2}=${P2.toFixed(3)} atm.`));
      }
    }
  }

  for (let P1 = 1; P1 <= 3; P1++) {
    for (let V1 = 2; V1 <= 10; V1 += 2) {
      for (let T1 = 200; T1 <= 400; T1 += 100) {
        for (let T2 = T1 + 100; T2 <= 600; T2 += 100) {
          const P2 = 1;
          const V2 = (P1 * V1 * T2) / (P2 * T1);
          qs.push(makeQ("States of Matter", "11", `Gas: P₁=${P1}atm V₁=${V1}L T₁=${T1}K → P₂=${P2}atm T₂=${T2}K. V₂:`, `${V2.toFixed(1)} L`, `${(V2 / 2).toFixed(1)} L`, `${V1} L`, `${(V2 * 2).toFixed(1)} L`, `P₁V₁/T₁=P₂V₂/T₂. V₂=${P1}×${V1}×${T2}/(${P2}×${T1})=${V2.toFixed(1)} L.`));
        }
      }
    }
  }

  for (let H = -100; H <= 100; H += 25) {
    for (let S = -50; S <= 50; S += 25) {
      if (H === 0 && S === 0) continue;
      for (let T = 200; T <= 600; T += 200) {
        const G = H - T * S / 1000;
        const spon = G < 0 ? "spontaneous" : G > 0 ? "non-spontaneous" : "at equilibrium";
        qs.push(makeQ("Thermodynamics", "11", `ΔH=${H} kJ, ΔS=${S} J/K at ${T} K. ΔG:`, `${G.toFixed(1)} kJ (${spon})`, `${(-G).toFixed(1)} kJ`, `${H} kJ`, `${(T * S / 1000).toFixed(1)} kJ`, `ΔG = ΔH - TΔS = ${H} - ${T}×${S}/1000 = ${G.toFixed(1)} kJ. Process is ${spon}.`));
      }
    }
  }

  for (let q = 100; q <= 500; q += 50) {
    for (let m = 10; m <= 50; m += 10) {
      for (let dT = 5; dT <= 25; dT += 5) {
        const s = q / (m * dT);
        qs.push(makeQ("Thermodynamics", "11", `Specific heat: ${q} J heats ${m} g by ${dT}°C. s=:`, `${s.toFixed(3)} J/g°C`, `${(s * 2).toFixed(3)} J/g°C`, `${(q / m).toFixed(3)} J/g°C`, `${dT} J/g°C`, `s = q/(mΔT) = ${q}/(${m}×${dT}) = ${s.toFixed(3)} J/g°C.`));
      }
    }
  }

  for (let Ea = 50; Ea <= 200; Ea += 25) {
    for (let T1 = 300; T1 <= 400; T1 += 50) {
      const T2 = T1 + 10;
      const ratio = Math.exp((Ea * 1000 / 8.314) * (1 / T1 - 1 / T2));
      qs.push(makeQ("Chemical Kinetics", "12", `Arrhenius: Ea=${Ea} kJ/mol, T₁=${T1} K, T₂=${T2} K. k₂/k₁ ≈:`, `${ratio.toFixed(2)}`, `${(ratio / 2).toFixed(2)}`, `${(ratio * 2).toFixed(2)}`, `1.00`, `ln(k₂/k₁) = (Ea/R)(1/T₁-1/T₂). k₂/k₁ ≈ ${ratio.toFixed(2)}.`));
    }
  }

  for (let n = 1; n <= 5; n++) {
    for (let dT = 10; dT <= 50; dT += 10) {
      for (const [gas, Cv] of [["monoatomic", "3R/2"], ["diatomic", "5R/2"]] as [string, string][]) {
        const CvVal = gas === "monoatomic" ? 1.5 * 8.314 : 2.5 * 8.314;
        const q = (n * CvVal * dT).toFixed(1);
        qs.push(makeQ("Thermodynamics", "11", `Heat at const V: ${n} mol ${gas} gas, ΔT=${dT} K:`, `${q} J`, `${(Number(q) * 2).toFixed(1)} J`, `${(Number(q) / 2).toFixed(1)} J`, `${(n * dT).toFixed(1)} J`, `q = nCᵥΔT = ${n}×${Cv}×${dT} ≈ ${q} J.`));
      }
    }
  }

  for (let Ksp = -5; Ksp >= -12; Ksp--) {
    const s = Math.pow(10, Ksp / 2);
    qs.push(makeQ("Equilibrium", "11", `For AB salt with Ksp = 10^${Ksp}, solubility s =:`, `10^${(Ksp / 2).toFixed(1)} M`, `10^${Ksp} M`, `10^${(Ksp / 3).toFixed(1)} M`, `10^${(Ksp + 1)} M`, `AB → A⁺ + B⁻. Ksp = s². s = √(Ksp) = √(10^${Ksp}) = 10^${(Ksp / 2).toFixed(1)} M.`));
  }

  for (let n = 1; n <= 3; n++) {
    for (let Ecell = 0.5; Ecell <= 2.0; Ecell += 0.25) {
      const logK = (n * Ecell / 0.0592).toFixed(2);
      qs.push(makeQ("Electrochemistry", "12", `E°cell = ${Ecell.toFixed(2)} V, n=${n}. log K =:`, logK, `${(Number(logK) / 2).toFixed(2)}`, `${n}`, `${Ecell.toFixed(2)}`, `log K = nE°/0.0592 = ${n}×${Ecell.toFixed(2)}/0.0592 = ${logK}.`));
    }
  }

  const stoichiometry: [string, string, number, string, number, string][] = [
    ["2H₂ + O₂ → 2H₂O", "H₂", 2, "H₂O", 2, "1:1 mole ratio"],
    ["N₂ + 3H₂ → 2NH₃", "H₂", 3, "NH₃", 2, "3:2 mole ratio"],
    ["CaCO₃ → CaO + CO₂", "CaCO₃", 100, "CaO", 56, "100 g gives 56 g"],
    ["2KClO₃ → 2KCl + 3O₂", "KClO₃", 245, "O₂", 96, "245 g gives 96 g"],
    ["CH₄ + 2O₂ → CO₂ + 2H₂O", "CH₄", 16, "CO₂", 44, "16 g gives 44 g"],
    ["Fe₂O₃ + 3CO → 2Fe + 3CO₂", "Fe₂O₃", 160, "Fe", 112, "160 g gives 112 g"],
    ["Zn + H₂SO₄ → ZnSO₄ + H₂", "Zn", 65, "H₂", 2, "65 g gives 2 g"],
    ["2Al + 6HCl → 2AlCl₃ + 3H₂", "Al", 54, "H₂", 6, "54 g gives 6 g"],
  ];
  for (const [rxn, reactant, rMass, product, pMass, note] of stoichiometry) {
    for (let mult = 1; mult <= 5; mult++) {
      const reactG = rMass * mult;
      const prodG = pMass * mult;
      qs.push(makeQ("Mole Concept", "11", `${rxn}: ${reactG} g ${reactant} produces how much ${product}?`, `${prodG} g`, `${prodG / 2} g`, `${prodG * 2} g`, `${reactG} g`, `${note}. ${reactG} g → ${prodG} g.`));
    }
  }

  for (let C1 = 1; C1 <= 5; C1++) {
    for (let C2 = 1; C2 <= 5; C2++) {
      const Kc = C1 * C2;
      qs.push(makeQ("Equilibrium", "11", `A ⇌ B. At equilibrium [A]=${(1 / C1).toFixed(2)} M, [B]=${C2} M. Kc:`, `${(C2 * C1).toFixed(2)}`, `${(C2 / C1).toFixed(2)}`, `${C1}`, `${C2}`, `Kc = [B]/[A] = ${C2}/${(1 / C1).toFixed(2)} = ${(C2 * C1).toFixed(2)}.`));
    }
  }

  const iupacNames: [string, string][] = [
    ["CH₃CH₂CH₂CH₃", "Butane"],
    ["CH₃CH(CH₃)CH₃", "2-Methylpropane"],
    ["CH₃CH₂CH₂CH₂CH₃", "Pentane"],
    ["CH₃CH₂CH(CH₃)CH₃", "2-Methylbutane"],
    ["CH₃C(CH₃)₂CH₃", "2,2-Dimethylpropane"],
    ["CH₃CH₂CH₂CH₂CH₂CH₃", "Hexane"],
    ["CH₃CH₂CH₂OH", "Propan-1-ol"],
    ["CH₃CH(OH)CH₃", "Propan-2-ol"],
    ["CH₃CHO", "Ethanal"],
    ["CH₃COCH₃", "Propanone"],
    ["CH₃COOH", "Ethanoic acid"],
    ["HCOOH", "Methanoic acid"],
    ["CH₃CH₂NH₂", "Ethanamine"],
    ["CH₃OCH₃", "Methoxymethane"],
    ["CH₃CH=CH₂", "Propene"],
    ["CH≡CH", "Ethyne"],
    ["CH₂=CH₂", "Ethene"],
    ["CH₃CH₂Cl", "Chloroethane"],
    ["CH₃CH₂Br", "Bromoethane"],
    ["C₆H₅OH", "Phenol"],
  ];
  for (let _i15 = 0; _i15 < iupacNames.length; _i15++) {
    const [structure, name] = iupacNames[_i15];
    qs.push(makeQ("Organic Chemistry", "11", `IUPAC name of ${structure}:`, name, iupacNames[(_i15 + 1) % iupacNames.length][1], iupacNames[(_i15 + 2) % iupacNames.length][1], iupacNames[(_i15 + 3) % iupacNames.length][1], `${structure} → IUPAC: ${name}.`));
    qs.push(makeQ("Organic Chemistry", "11", `Structure of ${name}:`, structure, iupacNames[(_i15 + 1) % iupacNames.length][0], iupacNames[(_i15 + 2) % iupacNames.length][0], iupacNames[(_i15 + 3) % iupacNames.length][0], `${name} has structure ${structure}.`));
  }

  const reagentTests: [string, string, string][] = [
    ["Tollens' test (silver mirror)", "Aldehyde", "Ag⁺ reduced to Ag (silver mirror)"],
    ["Fehling's test (red ppt)", "Aldehyde", "Cu²⁺ reduced to Cu₂O (red)"],
    ["Iodoform test", "Methyl ketone or CH₃CH(OH)- alcohol", "Yellow CHI₃ precipitate"],
    ["Lucas test (turbidity)", "Alcohols (3°>2°>1°)", "ZnCl₂/HCl, 3° reacts fastest"],
    ["Carbylamine test (isocyanide)", "Primary amine", "Foul-smelling isocyanide"],
    ["Hinsberg test", "Distinguish 1°, 2°, 3° amines", "Benzenesulfonyl chloride reagent"],
    ["Bromine water decolourisation", "Unsaturated compound or phenol", "Addition across double bond"],
    ["FeCl₃ test (violet colour)", "Phenol", "Forms coloured complex with Fe³⁺"],
    ["2,4-DNP test (orange ppt)", "Aldehyde or ketone (C=O)", "2,4-dinitrophenylhydrazine"],
    ["Biuret test (violet)", "Protein (≥2 peptide bonds)", "Cu²⁺ complex with peptide bonds"],
    ["Ninhydrin test (purple)", "Amino acid", "Purple/blue colour with amino acids"],
    ["Benedict's test (red ppt)", "Reducing sugar", "Cu²⁺ → Cu₂O"],
  ];
  for (let _i16 = 0; _i16 < reagentTests.length; _i16++) {
    const [test, detects, mechanism] = reagentTests[_i16];
    qs.push(makeQ("Organic Chemistry", "12", `${test} is used to detect:`, detects, reagentTests[(_i16 + 1) % reagentTests.length][1], reagentTests[(_i16 + 2) % reagentTests.length][1], "noble gases", `${test}: detects ${detects}. ${mechanism}.`));
  }

  const acidBase: [string, string, string][] = [
    ["HCl", "strong acid", "completely dissociates"],
    ["H₂SO₄", "strong acid", "diprotic, completely dissociates"],
    ["HNO₃", "strong acid", "completely dissociates, oxidising"],
    ["CH₃COOH", "weak acid", "partially dissociates, Ka ≈ 1.8×10⁻⁵"],
    ["H₂CO₃", "weak acid", "carbonic acid, from CO₂ + H₂O"],
    ["HF", "weak acid", "despite being halogen acid"],
    ["NaOH", "strong base", "completely dissociates"],
    ["KOH", "strong base", "completely dissociates"],
    ["Ca(OH)₂", "strong base", "sparingly soluble, lime water"],
    ["NH₃", "weak base", "Kb ≈ 1.8×10⁻⁵"],
    ["Al(OH)₃", "amphoteric hydroxide", "acts as acid and base"],
    ["Zn(OH)₂", "amphoteric hydroxide", "dissolves in both acid and base"],
  ];
  for (let _i17 = 0; _i17 < acidBase.length; _i17++) {
    const [compound, type, detail] = acidBase[_i17];
    qs.push(makeQ("Equilibrium", "11", `${compound} is classified as:`, type, acidBase[(_i17 + 1) % acidBase.length][1], "neutral salt", "buffer", `${compound}: ${type}. ${detail}.`));
  }

  const organicMechanisms: [string, string, string][] = [
    ["SN1", "Unimolecular nucleophilic substitution, carbocation intermediate", "3° > 2° > 1° reactivity"],
    ["SN2", "Bimolecular nucleophilic substitution, backside attack", "1° > 2° > 3° reactivity, Walden inversion"],
    ["E1", "Unimolecular elimination, carbocation intermediate", "3° > 2° > 1° reactivity"],
    ["E2", "Bimolecular elimination, anti-periplanar geometry", "Strong base, high temperature"],
    ["Electrophilic addition", "Addition to C=C, Markovnikov's rule", "HBr, H₂O/H⁺, Br₂ addition"],
    ["Electrophilic aromatic substitution", "Attack on benzene ring", "Halogenation, nitration, sulfonation, Friedel-Crafts"],
    ["Free radical substitution", "Initiation-propagation-termination", "Halogenation of alkanes (UV light)"],
    ["Nucleophilic addition", "Attack on C=O of aldehyde/ketone", "HCN, NaBH₄, Grignard additions"],
  ];
  for (let _i18 = 0; _i18 < organicMechanisms.length; _i18++) {
    const [mech, description, details] = organicMechanisms[_i18];
    qs.push(makeQ("Organic Chemistry", "12", `${mech} mechanism involves:`, description, organicMechanisms[(_i18 + 1) % organicMechanisms.length][1], organicMechanisms[(_i18 + 2) % organicMechanisms.length][1], "radical chain polymerization", `${mech}: ${description}. ${details}.`));
    qs.push(makeQ("Organic Chemistry", "12", `${mech} is favoured by:`, details, organicMechanisms[(_i18 + 1) % organicMechanisms.length][2], "both acid and base catalysis equally", "vacuum conditions only", `${mech}: ${details}.`));
  }

  for (let i = 1; i <= 3; i++) {
    for (let V = 10; V <= 50; V += 10) {
      const massI = i * 127;
      const eq = massI / V;
      qs.push(makeQ("Electrochemistry", "12", `Faraday: ${i} mol electrons deposits from I⁻. Mass of I₂ (M=254):`, `${(i * 127)} g`, `${(i * 254)} g`, `${(i * 63.5)} g`, `${i} g`, `I⁻ → ½I₂ + e⁻. ${i} mol e⁻ → ${i/2} mol I₂ = ${i * 127} g.`));
    }
  }

  for (let F = 1; F <= 5; F++) {
    for (const [metal, M, n] of [["Cu", 63.5, 2], ["Ag", 108, 1], ["Al", 27, 3], ["Zn", 65, 2], ["Fe", 56, 2]] as [string, number, number][]) {
      const mass = (F * M / n).toFixed(1);
      qs.push(makeQ("Electrochemistry", "12", `Mass of ${metal} deposited by ${F} Faraday (M=${M}, n=${n}):`, `${mass} g`, `${(Number(mass) * 2).toFixed(1)} g`, `${M} g`, `${(Number(mass) / 2).toFixed(1)} g`, `m = F×M/n = ${F}×${M}/${n} = ${mass} g.`));
    }
  }

  for (let wt = 1; wt <= 10; wt++) {
    for (let vol = 50; vol <= 500; vol += 50) {
      const ppm = (wt * 1e6) / (vol * 1000);
      qs.push(makeQ("Solutions", "12", `${wt} mg solute in ${vol} mL water. Concentration in ppm:`, `${ppm.toFixed(1)} ppm`, `${(ppm / 2).toFixed(1)} ppm`, `${wt} ppm`, `${(ppm * 2).toFixed(1)} ppm`, `ppm = (mass solute/mass solution)×10⁶ ≈ ${wt}×10⁻³/(${vol}) ×10⁶ = ${ppm.toFixed(1)} ppm.`));
    }
  }

  for (let pi = 0.5; pi <= 5.0; pi += 0.5) {
    const MRT = pi / (0.0821 * 300);
    qs.push(makeQ("Solutions", "12", `Osmotic pressure ${pi.toFixed(1)} atm at 300 K. Molarity (R=0.0821):`, `${MRT.toFixed(4)} M`, `${(MRT * 2).toFixed(4)} M`, `${pi.toFixed(1)} M`, `${(MRT / 2).toFixed(4)} M`, `π = MRT. M = π/RT = ${pi.toFixed(1)}/(0.0821×300) = ${MRT.toFixed(4)} M.`));
  }

  return qs;
}
