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
    subject: "Biology",
    topic, classGrade, year: pickYear(), difficulty: pickDifficulty(), questionType: "mcq",
    questionText,
    options: { A: opts[0].val, B: opts[1].val, C: opts[2].val, D: opts[3].val },
    correctAnswer: correctKey, solution, marks: 4,
  };
}

export function generateBiologyQuestions(): SeedQuestion[] {
  const qs: SeedQuestion[] = [];

  const organelles: [string, string, string][] = [
    ["Nucleus", "Contains DNA, controls cell activities", "double membrane, nucleolus"],
    ["Mitochondria", "Powerhouse of cell, produces ATP via oxidative phosphorylation", "double membrane, cristae"],
    ["Chloroplast", "Site of photosynthesis in plant cells", "double membrane, thylakoids, stroma"],
    ["Endoplasmic Reticulum (Rough)", "Protein synthesis and transport, has ribosomes", "membrane-bound, continuous with nuclear envelope"],
    ["Endoplasmic Reticulum (Smooth)", "Lipid synthesis and detoxification", "no ribosomes, tubular"],
    ["Golgi apparatus", "Packaging and modification of proteins", "cisternae, cis and trans face"],
    ["Lysosome", "Intracellular digestion, contains hydrolytic enzymes", "single membrane, suicidal bags"],
    ["Ribosome", "Site of protein synthesis (translation)", "not membrane-bound, 70S or 80S"],
    ["Centrosome", "Organises spindle fibres during cell division", "contains centrioles"],
    ["Peroxisome", "Oxidative reactions, breaks down H₂O₂", "single membrane, contains catalase"],
    ["Vacuole", "Storage, turgor pressure in plant cells", "tonoplast membrane"],
    ["Cell wall", "Rigid outer covering of plant cells (cellulose)", "provides shape and protection"],
  ];
  for (let _i0 = 0; _i0 < organelles.length; _i0++) {
    const [name, func, details] = organelles[_i0];
    qs.push(makeQ("Cell Biology", "11", `Function of ${name}:`, func, organelles[(_i0 + 1) % organelles.length][1], organelles[(_i0 + 2) % organelles.length][1], organelles[(_i0 + 3) % organelles.length][1], `${name}: ${func}. ${details}.`));
    qs.push(makeQ("Cell Biology", "11", `${name} is characterised by:`, details, organelles[(_i0 + 1) % organelles.length][2], organelles[(_i0 + 2) % organelles.length][2], "single-stranded DNA", `${name}: ${details}.`));
  }

  const cellDivision: [string, string, string][] = [
    ["Prophase", "Chromosomes condense, spindle forms", "chromatin → chromosomes visible"],
    ["Metaphase", "Chromosomes align at metaphase plate", "spindle fibres attach to kinetochores"],
    ["Anaphase", "Sister chromatids separate and move to poles", "shortest phase of mitosis"],
    ["Telophase", "Nuclear envelope reforms, chromosomes decondense", "cytokinesis usually begins"],
    ["Interphase", "Cell grows, DNA replicates (G1, S, G2)", "longest phase of cell cycle"],
    ["Cytokinesis", "Cytoplasm divides to form two daughter cells", "cell plate in plants, cleavage furrow in animals"],
  ];
  for (let _i1 = 0; _i1 < cellDivision.length; _i1++) {
    const [phase, event, detail] = cellDivision[_i1];
    qs.push(makeQ("Cell Biology", "11", `During ${phase} of mitosis:`, event, cellDivision[(_i1 + 1) % cellDivision.length][1], cellDivision[(_i1 + 2) % cellDivision.length][1], "DNA replication occurs", `${phase}: ${event}. ${detail}.`));
  }

  const meiosisPhases: [string, string][] = [
    ["Leptotene", "Chromosomes begin to condense as thin threads"],
    ["Zygotene", "Homologous chromosomes pair up (synapsis)"],
    ["Pachytene", "Crossing over occurs between non-sister chromatids"],
    ["Diplotene", "Chiasmata become visible, bivalents begin to separate"],
    ["Diakinesis", "Terminalization of chiasmata, nuclear membrane breaks"],
    ["Metaphase I", "Bivalents align at metaphase plate"],
    ["Anaphase I", "Homologous chromosomes separate (reductional division)"],
    ["Metaphase II", "Individual chromosomes align at metaphase plate"],
    ["Anaphase II", "Sister chromatids separate (equational division)"],
  ];
  for (let _i2 = 0; _i2 < meiosisPhases.length; _i2++) {
    const [phase, event] = meiosisPhases[_i2];
    qs.push(makeQ("Cell Biology", "11", `In meiosis, ${phase} is characterised by:`, event, meiosisPhases[(_i2 + 1) % meiosisPhases.length][1], meiosisPhases[(_i2 + 2) % meiosisPhases.length][1], "mitotic spindle disassembly", `${phase}: ${event}.`));
  }

  const biomolecules: [string, string, string][] = [
    ["Glucose", "Primary energy source, aldohexose", "C₆H₁₂O₆"],
    ["Sucrose", "Table sugar, non-reducing sugar", "glucose + fructose"],
    ["Starch", "Plant storage polysaccharide", "amylose + amylopectin"],
    ["Glycogen", "Animal storage polysaccharide", "highly branched glucose polymer"],
    ["Cellulose", "Structural polysaccharide of plant cell walls", "β-1,4 glycosidic bonds"],
    ["DNA", "Stores genetic information", "deoxyribose + phosphate + bases (A,T,G,C)"],
    ["RNA", "Protein synthesis intermediary", "ribose + phosphate + bases (A,U,G,C)"],
    ["ATP", "Energy currency of the cell", "adenine + ribose + 3 phosphate groups"],
    ["Cholesterol", "Cell membrane component, precursor of steroid hormones", "lipid, 4-ring steroid structure"],
    ["Haemoglobin", "Oxygen transport protein in RBCs", "4 subunits, each with heme group"],
  ];
  for (let _i3 = 0; _i3 < biomolecules.length; _i3++) {
    const [mol, func, structure] = biomolecules[_i3];
    qs.push(makeQ("Biomolecules", "11", `${mol}: function is:`, func, biomolecules[(_i3 + 1) % biomolecules.length][1], biomolecules[(_i3 + 2) % biomolecules.length][1], "structural support", `${mol}: ${func}. Structure: ${structure}.`));
  }

  const enzymes: [string, string, string][] = [
    ["Amylase", "Starch → Maltose", "saliva and pancreas"],
    ["Pepsin", "Proteins → Peptides", "stomach (pH 1.5-2.5)"],
    ["Trypsin", "Proteins → Peptides", "pancreas (alkaline pH)"],
    ["Lipase", "Fats → Fatty acids + Glycerol", "pancreas"],
    ["Lactase", "Lactose → Glucose + Galactose", "small intestine"],
    ["Sucrase", "Sucrose → Glucose + Fructose", "small intestine"],
    ["DNA polymerase", "DNA replication", "nucleus"],
    ["RNA polymerase", "Transcription (DNA → mRNA)", "nucleus"],
    ["Helicase", "Unwinds DNA double helix", "replication fork"],
    ["Ligase", "Joins DNA fragments (Okazaki fragments)", "lagging strand"],
    ["Catalase", "2H₂O₂ → 2H₂O + O₂", "peroxisomes"],
    ["ATP synthase", "ADP + Pi → ATP", "mitochondria inner membrane"],
  ];
  for (let _i4 = 0; _i4 < enzymes.length; _i4++) {
    const [enzyme, reaction, location] = enzymes[_i4];
    qs.push(makeQ("Biomolecules", "11", `${enzyme} catalyses:`, reaction, enzymes[(_i4 + 1) % enzymes.length][1], enzymes[(_i4 + 2) % enzymes.length][1], "photosynthesis", `${enzyme}: ${reaction}. Found in ${location}.`));
    qs.push(makeQ("Biomolecules", "11", `${enzyme} is found in:`, location, enzymes[(_i4 + 1) % enzymes.length][2], enzymes[(_i4 + 2) % enzymes.length][2], "chloroplast", `${enzyme}: found in ${location}.`));
  }

  const tissues: [string, string, string][] = [
    ["Parenchyma", "Storage, photosynthesis, thin-walled", "found throughout the plant"],
    ["Collenchyma", "Flexible support, thickened corners", "below epidermis in stems"],
    ["Sclerenchyma", "Rigid support, dead at maturity, lignified", "fibres and sclereids"],
    ["Xylem", "Water transport (upward), tracheids and vessels", "dead cells except parenchyma"],
    ["Phloem", "Food transport (bidirectional), sieve tubes", "living cells except fibres"],
    ["Meristem", "Active cell division, growth", "apical, lateral, intercalary"],
    ["Epidermis", "Protection, single cell layer", "cuticle-covered, stomata present"],
    ["Cork (phellem)", "Bark formation, waterproof", "dead cells, suberin deposition"],
  ];
  for (let _i5 = 0; _i5 < tissues.length; _i5++) {
    const [tissue, function_, details] = tissues[_i5];
    qs.push(makeQ("Plant Anatomy", "11", `${tissue} tissue: function is:`, function_, tissues[(_i5 + 1) % tissues.length][1], tissues[(_i5 + 2) % tissues.length][1], "reproduction", `${tissue}: ${function_}. ${details}.`));
  }

  const animalTissues: [string, string, string][] = [
    ["Squamous epithelium", "Flat cells, filtration and diffusion", "alveoli, blood vessels"],
    ["Cuboidal epithelium", "Cube-shaped cells, secretion and absorption", "kidney tubules, glands"],
    ["Columnar epithelium", "Column-shaped, absorption and secretion", "intestinal lining"],
    ["Ciliated epithelium", "Has cilia, moves substances", "trachea, oviduct"],
    ["Areolar connective", "Loose packing, fills spaces", "under skin, around organs"],
    ["Adipose tissue", "Fat storage, insulation", "under skin, around kidneys"],
    ["Bone (osseous)", "Hard support, calcium matrix", "skeletal system"],
    ["Cartilage", "Flexible support, chondrocytes", "nose, ear, joints"],
    ["Blood", "Transport of O₂, nutrients, hormones", "liquid connective tissue"],
    ["Skeletal muscle", "Voluntary, striated, multinucleated", "attached to bones"],
    ["Smooth muscle", "Involuntary, non-striated", "visceral organs, blood vessels"],
    ["Cardiac muscle", "Involuntary, striated, intercalated discs", "heart only"],
    ["Neuron", "Nerve impulse transmission", "brain, spinal cord, nerves"],
  ];
  for (let _i6 = 0; _i6 < animalTissues.length; _i6++) {
    const [tissue, property, location] = animalTissues[_i6];
    qs.push(makeQ("Animal Tissues", "11", `${tissue}: characteristic is:`, property, animalTissues[(_i6 + 1) % animalTissues.length][1], animalTissues[(_i6 + 2) % animalTissues.length][1], "photosynthesis", `${tissue}: ${property}. Found in ${location}.`));
    qs.push(makeQ("Animal Tissues", "11", `${tissue} is found in:`, location, animalTissues[(_i6 + 1) % animalTissues.length][2], animalTissues[(_i6 + 2) % animalTissues.length][2], "chloroplasts", `${tissue}: located in ${location}.`));
  }

  const photoSteps: [string, string, string][] = [
    ["Light reactions", "Thylakoid membrane", "Water splitting, ATP + NADPH production"],
    ["Calvin cycle", "Stroma", "CO₂ fixation, G3P synthesis using ATP + NADPH"],
    ["Photolysis", "Thylakoid lumen", "H₂O → 2H⁺ + ½O₂ + 2e⁻"],
    ["PS II", "Thylakoid membrane", "P680 reaction centre, water oxidation"],
    ["PS I", "Thylakoid membrane", "P700 reaction centre, NADP⁺ reduction"],
    ["Chemiosmosis", "Across thylakoid membrane", "H⁺ gradient drives ATP synthase"],
    ["RuBisCO", "Stroma", "Most abundant enzyme, fixes CO₂ with RuBP"],
    ["C4 pathway", "Mesophyll + bundle sheath", "CO₂ fixed first as OAA (4C), avoids photorespiration"],
    ["CAM pathway", "Night: CO₂ fixation, Day: Calvin cycle", "Succulents, stomata open at night"],
  ];
  for (let _i7 = 0; _i7 < photoSteps.length; _i7++) {
    const [step, location, detail] = photoSteps[_i7];
    qs.push(makeQ("Plant Physiology", "11", `${step} occurs in:`, location, photoSteps[(_i7 + 1) % photoSteps.length][1], photoSteps[(_i7 + 2) % photoSteps.length][1], "cytoplasm", `${step}: ${location}. ${detail}.`));
    qs.push(makeQ("Plant Physiology", "11", `${step}: what happens:`, detail, photoSteps[(_i7 + 1) % photoSteps.length][2], photoSteps[(_i7 + 2) % photoSteps.length][2], "protein synthesis", `${step}: ${detail}.`));
  }

  const plantHormones: [string, string, string][] = [
    ["Auxin (IAA)", "Cell elongation, phototropism, apical dominance", "Produced in shoot tips"],
    ["Gibberellin", "Stem elongation, seed germination, flowering", "Produced in young tissues"],
    ["Cytokinin", "Cell division, delays senescence", "Produced in root tips"],
    ["Abscisic acid (ABA)", "Stomatal closure, dormancy, stress response", "Inhibitor hormone"],
    ["Ethylene", "Fruit ripening, leaf abscission, senescence", "Gaseous hormone"],
  ];
  for (let _i8 = 0; _i8 < plantHormones.length; _i8++) {
    const [hormone, function_, note] = plantHormones[_i8];
    qs.push(makeQ("Plant Physiology", "11", `${hormone}: function is:`, function_, plantHormones[(_i8 + 1) % plantHormones.length][1], plantHormones[(_i8 + 2) % plantHormones.length][1], "photosynthesis", `${hormone}: ${function_}. ${note}.`));
  }

  const digestiveOrgans: [string, string, string][] = [
    ["Mouth", "Mechanical digestion, salivary amylase starts starch digestion", "pH ~7"],
    ["Oesophagus", "Peristalsis moves food bolus to stomach", "no digestion"],
    ["Stomach", "HCl + pepsin digest proteins, churning", "pH 1.5-2.5"],
    ["Duodenum", "Bile emulsifies fats, pancreatic enzymes act", "pH ~8"],
    ["Jejunum", "Major site of nutrient absorption", "villi increase surface area"],
    ["Ileum", "Absorption of bile salts and vitamin B₁₂", "Peyer's patches present"],
    ["Large intestine", "Water absorption, bacterial fermentation", "faeces formation"],
    ["Liver", "Produces bile, detoxification, glycogen storage", "largest internal organ"],
    ["Pancreas", "Secretes trypsin, lipase, amylase, and insulin", "both exocrine and endocrine"],
  ];
  for (let _i9 = 0; _i9 < digestiveOrgans.length; _i9++) {
    const [organ, function_, detail] = digestiveOrgans[_i9];
    qs.push(makeQ("Human Physiology - Digestion", "11", `${organ}: function is:`, function_, digestiveOrgans[(_i9 + 1) % digestiveOrgans.length][1], digestiveOrgans[(_i9 + 2) % digestiveOrgans.length][1], "gas exchange", `${organ}: ${function_}. ${detail}.`));
  }

  const respiratoryFacts: [string, string][] = [
    ["Tidal volume", "~500 mL air per normal breath"],
    ["Vital capacity", "Maximum air exhaled after maximum inhalation (~4800 mL)"],
    ["Residual volume", "Air remaining in lungs after forced expiration (~1200 mL)"],
    ["Total lung capacity", "~6000 mL (vital capacity + residual volume)"],
    ["Inspiratory reserve volume", "Extra air that can be inhaled after normal inspiration (~2500 mL)"],
    ["Expiratory reserve volume", "Extra air that can be exhaled after normal expiration (~1000 mL)"],
    ["Alveoli", "Site of gas exchange, ~300 million in both lungs"],
    ["Diaphragm", "Main muscle of respiration, contracts during inspiration"],
    ["Haemoglobin", "Each molecule carries up to 4 O₂ molecules"],
    ["Carbonic anhydrase", "Enzyme converting CO₂ + H₂O → H₂CO₃ in RBCs"],
  ];
  for (let _i10 = 0; _i10 < respiratoryFacts.length; _i10++) {
    const [term, def] = respiratoryFacts[_i10];
    qs.push(makeQ("Human Physiology - Breathing", "11", `${term}:`, def, respiratoryFacts[(_i10 + 1) % respiratoryFacts.length][1], respiratoryFacts[(_i10 + 2) % respiratoryFacts.length][1], "movement of blood", `${term}: ${def}.`));
  }

  const circulatoryFacts: [string, string][] = [
    ["SA node", "Pacemaker of the heart, generates impulses at ~72 bpm"],
    ["AV node", "Delays impulse briefly before passing to ventricles"],
    ["Bundle of His", "Conducts impulses from AV node to ventricles"],
    ["Purkinje fibres", "Distribute impulses through ventricular walls"],
    ["Blood group A", "Has A antigens on RBCs, anti-B antibodies in plasma"],
    ["Blood group B", "Has B antigens on RBCs, anti-A antibodies in plasma"],
    ["Blood group AB", "Universal recipient, both A and B antigens, no antibodies"],
    ["Blood group O", "Universal donor, no antigens, both anti-A and anti-B antibodies"],
    ["Systole", "Contraction phase of cardiac cycle"],
    ["Diastole", "Relaxation phase of cardiac cycle"],
    ["Cardiac output", "Volume of blood pumped per minute (~5 L at rest)"],
    ["Aorta", "Largest artery, carries oxygenated blood from left ventricle"],
    ["Pulmonary artery", "Carries deoxygenated blood from right ventricle to lungs"],
    ["Pulmonary vein", "Carries oxygenated blood from lungs to left atrium"],
    ["Vena cava", "Largest veins, return deoxygenated blood to right atrium"],
  ];
  for (let _i11 = 0; _i11 < circulatoryFacts.length; _i11++) {
    const [term, def] = circulatoryFacts[_i11];
    qs.push(makeQ("Human Physiology - Circulation", "11", `${term}:`, def, circulatoryFacts[(_i11 + 1) % circulatoryFacts.length][1], circulatoryFacts[(_i11 + 2) % circulatoryFacts.length][1], "hormone secretion", `${term}: ${def}.`));
  }

  const excretoryFacts: [string, string][] = [
    ["Bowman's capsule", "Cup-shaped structure surrounding glomerulus, collects filtrate"],
    ["Proximal convoluted tubule", "Reabsorbs ~65% of filtrate (glucose, amino acids, Na⁺)"],
    ["Loop of Henle", "Creates concentration gradient in medulla (countercurrent)"],
    ["Distal convoluted tubule", "Fine-tuning of reabsorption, regulated by aldosterone"],
    ["Collecting duct", "Final water reabsorption under ADH control"],
    ["Glomerulus", "Tuft of capillaries, site of ultrafiltration"],
    ["Juxtaglomerular apparatus", "Regulates blood pressure via renin secretion"],
    ["ADH (vasopressin)", "Increases water reabsorption in collecting duct"],
    ["Aldosterone", "Increases Na⁺ reabsorption in DCT"],
    ["GFR", "Glomerular filtration rate, ~125 mL/min in humans"],
  ];
  for (let _i12 = 0; _i12 < excretoryFacts.length; _i12++) {
    const [term, def] = excretoryFacts[_i12];
    qs.push(makeQ("Human Physiology - Excretion", "11", `${term}:`, def, excretoryFacts[(_i12 + 1) % excretoryFacts.length][1], excretoryFacts[(_i12 + 2) % excretoryFacts.length][1], "bile production", `${term}: ${def}.`));
  }

  const nervesFacts: [string, string][] = [
    ["Cerebrum", "Largest brain part, controls thinking, memory, voluntary actions"],
    ["Cerebellum", "Coordinates movement, balance, posture"],
    ["Medulla oblongata", "Controls involuntary functions (breathing, heart rate, BP)"],
    ["Hypothalamus", "Thermoregulation, hunger, thirst, links nervous and endocrine systems"],
    ["Spinal cord", "Relays signals between brain and body, reflex actions"],
    ["Sensory neuron", "Carries impulse from receptor to CNS (afferent)"],
    ["Motor neuron", "Carries impulse from CNS to effector (efferent)"],
    ["Synapse", "Gap between two neurons, neurotransmitter crosses"],
    ["Myelin sheath", "Insulating layer around axon, increases conduction speed"],
    ["Resting potential", "~-70 mV, maintained by Na⁺/K⁺ pump"],
    ["Action potential", "Rapid depolarization due to Na⁺ influx"],
    ["Reflex arc", "Receptor → sensory neuron → CNS → motor neuron → effector"],
  ];
  for (let _i13 = 0; _i13 < nervesFacts.length; _i13++) {
    const [term, def] = nervesFacts[_i13];
    qs.push(makeQ("Human Physiology - Nervous System", "11", `${term}:`, def, nervesFacts[(_i13 + 1) % nervesFacts.length][1], nervesFacts[(_i13 + 2) % nervesFacts.length][1], "digestion of food", `${term}: ${def}.`));
  }

  const hormones: [string, string, string][] = [
    ["Insulin", "Beta cells of pancreas", "Lowers blood glucose, promotes glycogenesis"],
    ["Glucagon", "Alpha cells of pancreas", "Raises blood glucose, promotes glycogenolysis"],
    ["Thyroxine (T₄)", "Thyroid gland", "Increases BMR, regulates growth"],
    ["Growth hormone", "Anterior pituitary", "Stimulates growth, protein synthesis"],
    ["ADH", "Posterior pituitary", "Water retention by kidneys"],
    ["Oxytocin", "Posterior pituitary", "Uterine contraction, milk ejection"],
    ["TSH", "Anterior pituitary", "Stimulates thyroid to produce T₃/T₄"],
    ["ACTH", "Anterior pituitary", "Stimulates adrenal cortex"],
    ["FSH", "Anterior pituitary", "Follicle development (ovary) / spermatogenesis"],
    ["LH", "Anterior pituitary", "Ovulation trigger / testosterone production"],
    ["Testosterone", "Testes (Leydig cells)", "Male secondary sexual characters, spermatogenesis"],
    ["Oestrogen", "Ovary (Graafian follicle)", "Female secondary sexual characters, uterine lining"],
    ["Progesterone", "Corpus luteum", "Maintains pregnancy, endometrium development"],
    ["Cortisol", "Adrenal cortex", "Stress response, anti-inflammatory, glucose regulation"],
    ["Adrenaline", "Adrenal medulla", "Fight-or-flight response, increases heart rate"],
    ["Melatonin", "Pineal gland", "Regulates sleep-wake cycle (circadian rhythm)"],
    ["Parathyroid hormone", "Parathyroid glands", "Increases blood Ca²⁺ levels"],
    ["Calcitonin", "Thyroid (parafollicular cells)", "Decreases blood Ca²⁺ levels"],
  ];
  for (let _i14 = 0; _i14 < hormones.length; _i14++) {
    const [hormone, source, function_] = hormones[_i14];
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `${hormone} is secreted by:`, source, hormones[(_i14 + 1) % hormones.length][1], hormones[(_i14 + 2) % hormones.length][1], "salivary glands", `${hormone}: secreted by ${source}.`));
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `Function of ${hormone}:`, function_, hormones[(_i14 + 1) % hormones.length][2], hormones[(_i14 + 2) % hormones.length][2], "photosynthesis", `${hormone}: ${function_}.`));
  }

  const geneticsConcepts: [string, string][] = [
    ["Mendel's Law of Segregation", "Two alleles of a gene separate during gamete formation"],
    ["Mendel's Law of Independent Assortment", "Genes on different chromosomes assort independently"],
    ["Dominance", "One allele masks the expression of the other"],
    ["Incomplete dominance", "Heterozygote shows intermediate phenotype (e.g., pink flowers)"],
    ["Codominance", "Both alleles expressed equally (e.g., AB blood group)"],
    ["Test cross", "Cross with homozygous recessive to determine genotype"],
    ["Monohybrid ratio", "3:1 in F₂ generation (one gene, two alleles)"],
    ["Dihybrid ratio", "9:3:3:1 in F₂ generation (two genes)"],
    ["Sex-linked inheritance", "Genes on X chromosome show criss-cross inheritance"],
    ["Epistasis", "One gene masks expression of another gene"],
    ["Pleiotropy", "One gene affects multiple phenotypic traits"],
    ["Polygenic inheritance", "Multiple genes control one trait (e.g., skin colour)"],
  ];
  for (let _i15 = 0; _i15 < geneticsConcepts.length; _i15++) {
    const [concept, def] = geneticsConcepts[_i15];
    qs.push(makeQ("Genetics & Heredity", "12", `${concept}:`, def, geneticsConcepts[(_i15 + 1) % geneticsConcepts.length][1], geneticsConcepts[(_i15 + 2) % geneticsConcepts.length][1], "RNA splicing mechanism", `${concept}: ${def}.`));
  }

  const disorders: [string, string, string][] = [
    ["Colour blindness", "X-linked recessive", "Cannot distinguish red-green colours"],
    ["Haemophilia", "X-linked recessive", "Blood clotting deficiency"],
    ["Sickle cell anaemia", "Autosomal recessive", "HbS, Glu→Val at position 6 of β-globin"],
    ["Down syndrome", "Trisomy 21", "47 chromosomes, intellectual disability"],
    ["Turner syndrome", "45,X (monosomy X)", "Short female, infertile, webbed neck"],
    ["Klinefelter syndrome", "47,XXY", "Tall male, gynecomastia, infertile"],
    ["Phenylketonuria (PKU)", "Autosomal recessive", "Cannot metabolize phenylalanine"],
    ["Thalassemia", "Autosomal recessive", "Reduced globin chain synthesis"],
    ["Huntington's disease", "Autosomal dominant", "Progressive neurodegeneration, CAG repeats"],
    ["Cystic fibrosis", "Autosomal recessive", "Thick mucus, CFTR gene mutation"],
  ];
  for (let _i16 = 0; _i16 < disorders.length; _i16++) {
    const [disease, inheritance, description] = disorders[_i16];
    qs.push(makeQ("Genetics & Heredity", "12", `${disease} inheritance pattern:`, inheritance, disorders[(_i16 + 1) % disorders.length][1], disorders[(_i16 + 2) % disorders.length][1], "mitochondrial", `${disease}: ${inheritance}. ${description}.`));
    qs.push(makeQ("Genetics & Heredity", "12", `${disease} is characterised by:`, description, disorders[(_i16 + 1) % disorders.length][2], disorders[(_i16 + 2) % disorders.length][2], "excessive growth", `${disease}: ${description}.`));
  }

  const molBio: [string, string][] = [
    ["Central dogma", "DNA → RNA → Protein (information flow)"],
    ["DNA replication", "Semi-conservative, bidirectional, uses DNA polymerase III"],
    ["Transcription", "DNA → mRNA, uses RNA polymerase"],
    ["Translation", "mRNA → Protein at ribosomes"],
    ["Start codon", "AUG (methionine), initiates translation"],
    ["Stop codons", "UAA, UAG, UGA — terminate translation"],
    ["Okazaki fragments", "Short DNA segments on lagging strand"],
    ["Introns", "Non-coding sequences removed by splicing"],
    ["Exons", "Coding sequences retained in mature mRNA"],
    ["Operon model", "Lac operon: structural genes + operator + promoter + regulator"],
    ["Genetic code", "Triplet, degenerate, universal, non-overlapping, comma-less"],
    ["Wobble hypothesis", "Third base of codon can pair with non-standard bases"],
    ["Post-translational modification", "Protein folding, glycosylation, phosphorylation after translation"],
    ["tRNA", "Adaptor molecule, carries amino acids, has anticodon loop"],
    ["rRNA", "Structural and catalytic component of ribosomes"],
  ];
  for (let _i17 = 0; _i17 < molBio.length; _i17++) {
    const [concept, def] = molBio[_i17];
    qs.push(makeQ("Molecular Biology", "12", `${concept}:`, def, molBio[(_i17 + 1) % molBio.length][1], molBio[(_i17 + 2) % molBio.length][1], "lipid synthesis", `${concept}: ${def}.`));
  }

  const evolution: [string, string][] = [
    ["Natural selection", "Survival and reproduction of the fittest phenotypes"],
    ["Genetic drift", "Random change in allele frequency in small populations"],
    ["Gene flow", "Transfer of alleles between populations via migration"],
    ["Founder effect", "Small group establishes new population with reduced genetic diversity"],
    ["Bottleneck effect", "Drastic reduction in population size reduces genetic variation"],
    ["Speciation", "Formation of new species through reproductive isolation"],
    ["Adaptive radiation", "Single ancestor diversifies into multiple species (e.g., Darwin's finches)"],
    ["Convergent evolution", "Unrelated species develop similar traits (analogous organs)"],
    ["Divergent evolution", "Related species develop different traits (homologous organs)"],
    ["Hardy-Weinberg equilibrium", "p² + 2pq + q² = 1; allele frequencies stable without evolution"],
    ["Homologous organs", "Same origin, different function (e.g., bat wing, human arm)"],
    ["Analogous organs", "Different origin, same function (e.g., bird wing, insect wing)"],
    ["Vestigial organs", "Reduced, non-functional remnants (e.g., appendix, wisdom teeth)"],
    ["Miller-Urey experiment", "Demonstrated abiotic synthesis of amino acids from primitive atmosphere"],
  ];
  for (let _i18 = 0; _i18 < evolution.length; _i18++) {
    const [concept, def] = evolution[_i18];
    qs.push(makeQ("Evolution", "12", `${concept}:`, def, evolution[(_i18 + 1) % evolution.length][1], evolution[(_i18 + 2) % evolution.length][1], "enzyme catalysis", `${concept}: ${def}.`));
  }

  const ecology: [string, string][] = [
    ["Food chain", "Linear sequence of organisms through which energy flows"],
    ["Food web", "Interconnected food chains in an ecosystem"],
    ["Ecological pyramid", "Graphical representation of trophic levels (energy/biomass/numbers)"],
    ["Primary succession", "Colonisation of bare/lifeless area (e.g., volcanic rock)"],
    ["Secondary succession", "Regrowth in disturbed area where soil remains"],
    ["Biodiversity hotspot", "Region with ≥1500 endemic plant species and ≥70% habitat loss"],
    ["Nitrogen fixation", "N₂ → NH₃ by Rhizobium, Azotobacter, or lightning"],
    ["Carbon cycle", "CO₂ ↔ organic carbon through photosynthesis and respiration"],
    ["Phosphorus cycle", "Sedimentary cycle, no gaseous phase"],
    ["10% law", "Only ~10% of energy transfers to next trophic level"],
    ["Biomagnification", "Increase in toxin concentration at higher trophic levels"],
    ["Eutrophication", "Nutrient enrichment of water body → algal bloom → O₂ depletion"],
    ["Ex situ conservation", "Preservation outside natural habitat (zoos, seed banks)"],
    ["In situ conservation", "Protection in natural habitat (national parks, sanctuaries)"],
    ["Keystone species", "Species with disproportionately large effect on ecosystem"],
  ];
  for (let _i19 = 0; _i19 < ecology.length; _i19++) {
    const [concept, def] = ecology[_i19];
    qs.push(makeQ("Ecology", "12", `${concept}:`, def, ecology[(_i19 + 1) % ecology.length][1], ecology[(_i19 + 2) % ecology.length][1], "blood clotting mechanism", `${concept}: ${def}.`));
  }

  const diseases: [string, string, string][] = [
    ["Malaria", "Plasmodium (protozoan), transmitted by Anopheles mosquito", "Fever, chills, anaemia"],
    ["Dengue", "Dengue virus, transmitted by Aedes mosquito", "High fever, joint pain, rash"],
    ["Typhoid", "Salmonella typhi (bacteria), faecal-oral route", "Sustained fever, rose spots"],
    ["Tuberculosis", "Mycobacterium tuberculosis, airborne", "Chronic cough, weight loss, night sweats"],
    ["AIDS", "HIV (retrovirus), attacks CD4+ T cells", "Immunodeficiency, opportunistic infections"],
    ["Cholera", "Vibrio cholerae (bacteria), contaminated water", "Severe diarrhoea, dehydration"],
    ["Pneumonia", "Streptococcus pneumoniae or viruses", "Lung infection, fluid in alveoli"],
    ["Common cold", "Rhinovirus, airborne droplets", "Nasal congestion, sneezing"],
    ["Amoebiasis", "Entamoeba histolytica (protozoan)", "Dysentery, liver abscess"],
    ["Ringworm", "Dermatophyte fungi, contact", "Circular skin lesions, itching"],
    ["Filariasis", "Wuchereria bancrofti (nematode), mosquito-borne", "Elephantiasis, lymphatic blockage"],
    ["Ascariasis", "Ascaris lumbricoides (roundworm), faecal-oral", "Intestinal blockage, malnutrition"],
  ];
  for (let _i20 = 0; _i20 < diseases.length; _i20++) {
    const [disease, cause, symptoms] = diseases[_i20];
    qs.push(makeQ("Human Health & Disease", "12", `${disease} is caused by:`, cause, diseases[(_i20 + 1) % diseases.length][1], diseases[(_i20 + 2) % diseases.length][1], "genetic mutation", `${disease}: ${cause}.`));
    qs.push(makeQ("Human Health & Disease", "12", `Symptoms of ${disease}:`, symptoms, diseases[(_i20 + 1) % diseases.length][2], diseases[(_i20 + 2) % diseases.length][2], "joint pain only", `${disease}: ${symptoms}.`));
  }

  const biotech: [string, string][] = [
    ["Restriction enzymes", "Molecular scissors that cut DNA at specific sequences"],
    ["DNA ligase", "Joins DNA fragments (vector + insert)"],
    ["Plasmid", "Small circular DNA in bacteria, used as cloning vector"],
    ["PCR (Polymerase Chain Reaction)", "Amplifies specific DNA sequence using Taq polymerase"],
    ["Gel electrophoresis", "Separates DNA fragments by size using electric field"],
    ["Recombinant DNA", "DNA from two different sources joined together"],
    ["Gene cloning", "Making identical copies of a gene using vectors"],
    ["Transformation", "Introduction of foreign DNA into bacterial cells"],
    ["Bt cotton", "Transgenic cotton expressing Cry protein from Bacillus thuringiensis"],
    ["Golden rice", "GM rice enriched with β-carotene (vitamin A precursor)"],
    ["Gene therapy", "Correction of genetic defect by inserting functional gene"],
    ["ELISA", "Enzyme-linked immunosorbent assay for protein/antibody detection"],
    ["DNA fingerprinting", "Identification based on VNTR/STR patterns, unique to individual"],
    ["Southern blotting", "Detection of specific DNA sequence using probe"],
    ["Northern blotting", "Detection of specific RNA using probe"],
    ["Western blotting", "Detection of specific protein using antibody"],
  ];
  for (let _i21 = 0; _i21 < biotech.length; _i21++) {
    const [technique, def] = biotech[_i21];
    qs.push(makeQ("Biotechnology", "12", `${technique}:`, def, biotech[(_i21 + 1) % biotech.length][1], biotech[(_i21 + 2) % biotech.length][1], "photosynthesis process", `${technique}: ${def}.`));
  }

  const reproduction: [string, string][] = [
    ["Pollination", "Transfer of pollen from anther to stigma"],
    ["Double fertilisation", "One sperm + egg = zygote; one sperm + polar nuclei = endosperm (unique to angiosperms)"],
    ["Spermatogenesis", "Formation of sperm in seminiferous tubules of testes"],
    ["Oogenesis", "Formation of ovum in ovary"],
    ["Menstrual cycle", "~28 day cycle: menstrual → follicular → ovulatory → luteal phases"],
    ["Implantation", "Blastocyst embeds in uterine endometrium (~7 days after fertilisation)"],
    ["Placenta", "Organ connecting fetus to mother, nutrient/gas exchange"],
    ["IVF (In vitro fertilisation)", "Fertilisation outside body, embryo transferred to uterus"],
    ["Contraception - IUD", "Intrauterine device prevents implantation"],
    ["Contraception - OCP", "Oral contraceptive pills prevent ovulation"],
    ["Parthenocarpy", "Fruit development without fertilisation (seedless fruits)"],
    ["Apomixis", "Seed formation without fertilisation"],
    ["Vegetative propagation", "Asexual reproduction from vegetative parts (stem, root, leaf)"],
  ];
  for (let _i22 = 0; _i22 < reproduction.length; _i22++) {
    const [concept, def] = reproduction[_i22];
    qs.push(makeQ("Reproduction", "12", `${concept}:`, def, reproduction[(_i22 + 1) % reproduction.length][1], reproduction[(_i22 + 2) % reproduction.length][1], "genetic recombination", `${concept}: ${def}.`));
  }

  const microbes: [string, string, string][] = [
    ["Lactobacillus", "Milk → Curd/Yoghurt", "Lactic acid fermentation"],
    ["Saccharomyces cerevisiae", "Bread rising, beer/wine", "Ethanol fermentation (yeast)"],
    ["Penicillium", "Penicillin antibiotic", "First antibiotic discovered by Fleming"],
    ["Streptomyces", "Streptomycin and other antibiotics", "Actinomycete bacteria"],
    ["Rhizobium", "Nitrogen fixation in legume root nodules", "Symbiotic relationship"],
    ["Azotobacter", "Free-living nitrogen fixer", "Found in soil"],
    ["Acetobacter", "Alcohol → Acetic acid (vinegar)", "Acetic acid bacteria"],
    ["Clostridium", "Butyric acid production", "Anaerobic, endospore-forming"],
    ["Methanobacterium", "Biogas (methane) production", "Archaebacteria, anaerobic"],
    ["Trichoderma", "Biological control agent", "Antagonist of plant pathogens"],
    ["Nucleopolyhedrovirus (NPV)", "Biocontrol of insect pests", "Baculovirus, species-specific"],
    ["Mycorrhiza", "Phosphorus absorption in plants", "Fungus-root symbiosis"],
  ];
  for (let _i23 = 0; _i23 < microbes.length; _i23++) {
    const [organism, application, detail] = microbes[_i23];
    qs.push(makeQ("Microorganisms", "12", `${organism}: application is:`, application, microbes[(_i23 + 1) % microbes.length][1], microbes[(_i23 + 2) % microbes.length][1], "blood pressure regulation", `${organism}: ${application}. ${detail}.`));
  }

  const kingdoms: [string, string, string][] = [
    ["Monera", "Prokaryotic, no membrane-bound organelles", "Bacteria, cyanobacteria"],
    ["Protista", "Eukaryotic, unicellular/colonial", "Amoeba, Paramecium, algae"],
    ["Fungi", "Eukaryotic, heterotrophic, cell wall of chitin", "Mushrooms, yeasts, moulds"],
    ["Plantae", "Eukaryotic, autotrophic, cell wall of cellulose", "Mosses to angiosperms"],
    ["Animalia", "Eukaryotic, heterotrophic, no cell wall", "Invertebrates to mammals"],
  ];
  for (let _i24 = 0; _i24 < kingdoms.length; _i24++) {
    const [kingdom, chars, examples] = kingdoms[_i24];
    qs.push(makeQ("Microorganisms", "12", `Kingdom ${kingdom}: characteristics:`, chars, kingdoms[(_i24 + 1) % kingdoms.length][1], kingdoms[(_i24 + 2) % kingdoms.length][1], "photosynthetic prokaryotes", `Kingdom ${kingdom}: ${chars}. Examples: ${examples}.`));
  }

  const phyla: [string, string, string][] = [
    ["Porifera", "Pore-bearing, canal system, spicules", "Sponges (Sycon, Spongilla)"],
    ["Cnidaria", "Cnidocytes (stinging cells), radial symmetry", "Hydra, Jellyfish, Corals"],
    ["Platyhelminthes", "Flatworms, acoelomate, bilateral symmetry", "Planaria, Taenia, Fasciola"],
    ["Nematoda", "Roundworms, pseudocoelomate", "Ascaris, Wuchereria, Ancylostoma"],
    ["Annelida", "Segmented worms, true coelom, closed circulation", "Earthworm, Leech, Nereis"],
    ["Arthropoda", "Jointed appendages, exoskeleton of chitin", "Insects, Crabs, Spiders"],
    ["Mollusca", "Soft body, mantle, shell", "Snail, Octopus, Pearl oyster"],
    ["Echinodermata", "Spiny skin, water vascular system, radial symmetry", "Starfish, Sea urchin"],
    ["Chordata", "Notochord, dorsal nerve cord, pharyngeal gill slits", "Fish, Amphibians, Mammals"],
  ];
  for (let _i25 = 0; _i25 < phyla.length; _i25++) {
    const [phylum, chars, examples] = phyla[_i25];
    qs.push(makeQ("Animal Kingdom", "11", `Phylum ${phylum}: characteristics:`, chars, phyla[(_i25 + 1) % phyla.length][1], phyla[(_i25 + 2) % phyla.length][1], "none of the above", `${phylum}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Animal Kingdom", "11", `Examples of phylum ${phylum}:`, examples, phyla[(_i25 + 1) % phyla.length][2], phyla[(_i25 + 2) % phyla.length][2], "Amoeba, Paramecium", `${phylum}: ${examples}.`));
  }

  const immunity: [string, string][] = [
    ["Innate immunity", "Non-specific, present from birth (skin, mucus, phagocytes)"],
    ["Adaptive immunity", "Specific, develops after exposure (B and T lymphocytes)"],
    ["Active immunity", "Body produces own antibodies (natural infection or vaccine)"],
    ["Passive immunity", "Pre-formed antibodies given (mother's milk, antiserum)"],
    ["B lymphocytes", "Produce antibodies (humoral immunity), mature in bone marrow"],
    ["T lymphocytes", "Cell-mediated immunity, mature in thymus"],
    ["Cytotoxic T cells", "Kill virus-infected cells directly (CD8+)"],
    ["Helper T cells", "Activate B cells and other immune cells (CD4+)"],
    ["Memory cells", "Long-lived cells that provide rapid secondary response"],
    ["Antibody (IgG)", "Most abundant, crosses placenta, neutralises pathogens"],
    ["Vaccination", "Introducing weakened/killed pathogen to stimulate immunity"],
    ["Autoimmunity", "Immune system attacks own tissues (e.g., rheumatoid arthritis)"],
    ["Allergy", "Exaggerated immune response to harmless substance (allergen)"],
    ["Interferon", "Protein released by virus-infected cells, protects neighbouring cells"],
  ];
  for (let _i26 = 0; _i26 < immunity.length; _i26++) {
    const [concept, def] = immunity[_i26];
    qs.push(makeQ("Human Health & Disease", "12", `${concept}:`, def, immunity[(_i26 + 1) % immunity.length][1], immunity[(_i26 + 2) % immunity.length][1], "enzyme catalysis mechanism", `${concept}: ${def}.`));
  }

  const vitamins: [string, string, string][] = [
    ["Vitamin A", "Night blindness (xerophthalmia)", "Retinol, found in carrots, liver"],
    ["Vitamin B₁", "Beriberi", "Thiamine, found in whole grains"],
    ["Vitamin B₂", "Cheilosis (cracked lips)", "Riboflavin, found in milk, eggs"],
    ["Vitamin B₃", "Pellagra (3 Ds: dermatitis, diarrhoea, dementia)", "Niacin"],
    ["Vitamin B₆", "Anaemia, convulsions", "Pyridoxine"],
    ["Vitamin B₁₂", "Pernicious anaemia", "Cobalamin, found in meat, dairy"],
    ["Vitamin C", "Scurvy (bleeding gums)", "Ascorbic acid, found in citrus fruits"],
    ["Vitamin D", "Rickets (children), osteomalacia (adults)", "Calciferol, sunlight exposure"],
    ["Vitamin E", "Reproductive disorders, muscle weakness", "Tocopherol, antioxidant"],
    ["Vitamin K", "Delayed blood clotting", "Phylloquinone, made by gut bacteria"],
  ];
  for (let _i27 = 0; _i27 < vitamins.length; _i27++) {
    const [vitamin, deficiency, details] = vitamins[_i27];
    qs.push(makeQ("Human Health & Disease", "12", `Deficiency of ${vitamin} causes:`, deficiency, vitamins[(_i27 + 1) % vitamins.length][1], vitamins[(_i27 + 2) % vitamins.length][1], "diabetes", `${vitamin} deficiency: ${deficiency}. ${details}.`));
  }

  const respirationSteps: [string, string, string][] = [
    ["Glycolysis", "Cytoplasm", "Glucose → 2 Pyruvate + 2 ATP + 2 NADH"],
    ["Pyruvate oxidation", "Mitochondrial matrix", "Pyruvate → Acetyl-CoA + CO₂ + NADH"],
    ["Krebs cycle", "Mitochondrial matrix", "Acetyl-CoA → 2CO₂ + 3NADH + FADH₂ + GTP per cycle"],
    ["ETC", "Inner mitochondrial membrane", "NADH/FADH₂ → O₂ → H₂O + 34 ATP"],
    ["Anaerobic (lactic acid)", "Cytoplasm", "Pyruvate → Lactate (in muscles, 2 ATP only)"],
    ["Anaerobic (alcohol)", "Cytoplasm", "Pyruvate → Ethanol + CO₂ (in yeast)"],
  ];
  for (let _i28 = 0; _i28 < respirationSteps.length; _i28++) {
    const [step, location, detail] = respirationSteps[_i28];
    qs.push(makeQ("Plant Physiology", "11", `${step} occurs in:`, location, respirationSteps[(_i28 + 1) % respirationSteps.length][1], respirationSteps[(_i28 + 2) % respirationSteps.length][1], "nucleus", `${step}: ${location}. ${detail}.`));
    qs.push(makeQ("Plant Physiology", "11", `${step} produces:`, detail, respirationSteps[(_i28 + 1) % respirationSteps.length][2], respirationSteps[(_i28 + 2) % respirationSteps.length][2], "proteins and lipids", `${step}: ${detail}.`));
  }

  const crosses: { cross: string; ratio: string; type: string; detail: string }[] = [];
  const parentPairs = [
    { p1: "Tt", p2: "Tt", ratio: "3:1 (Tall:Dwarf)", type: "Monohybrid", detail: "TT:Tt:tt = 1:2:1 genotypic" },
    { p1: "Tt", p2: "tt", ratio: "1:1 (Tall:Dwarf)", type: "Test cross", detail: "Tt:tt = 1:1" },
    { p1: "TT", p2: "tt", ratio: "All Tall", type: "Monohybrid F1", detail: "All Tt heterozygous" },
    { p1: "TT", p2: "Tt", ratio: "All Tall", type: "Monohybrid", detail: "TT:Tt = 1:1, all tall" },
    { p1: "tt", p2: "tt", ratio: "All Dwarf", type: "Monohybrid", detail: "All tt homozygous recessive" },
  ];
  for (const { p1, p2, ratio, type, detail } of parentPairs) {
    for (const trait of ["plant height (T=tall, t=dwarf)", "seed shape (R=round, r=wrinkled)", "flower colour (P=purple, p=white)", "seed colour (Y=yellow, y=green)", "pod shape (I=inflated, i=constricted)"]) {
      const t1 = trait.split(" ")[0];
      qs.push(makeQ("Genetics & Heredity", "12", `Cross ${p1} × ${p2} for ${trait}. Phenotypic ratio:`, ratio, "1:2:1", "9:3:3:1", "1:1:1:1", `${type} cross for ${t1}: ${p1} × ${p2} → ${ratio}. ${detail}.`));
    }
  }

  qs.push(makeQ("Genetics & Heredity", "12", "Dihybrid cross F₂ phenotypic ratio (Mendel):", "9:3:3:1", "3:1", "1:2:1", "1:1:1:1", "Dihybrid F₂ ratio is 9:3:3:1 for two independent genes."));
  qs.push(makeQ("Genetics & Heredity", "12", "Epistatic ratio 9:3:4 represents:", "Recessive epistasis", "Dominant epistasis", "Complementary genes", "Duplicate genes", "9:3:4 is recessive epistasis where homozygous recessive at one locus masks the other."));
  qs.push(makeQ("Genetics & Heredity", "12", "Complementary gene interaction gives F₂ ratio:", "9:7", "9:3:4", "15:1", "13:3", "Complementary genes: both dominant alleles needed for phenotype → 9:7."));
  qs.push(makeQ("Genetics & Heredity", "12", "Duplicate dominant epistasis gives F₂ ratio:", "15:1", "9:7", "9:3:4", "12:3:1", "Duplicate dominant: either dominant allele produces phenotype → 15:1."));
  qs.push(makeQ("Genetics & Heredity", "12", "Dominant epistasis gives F₂ ratio:", "12:3:1", "9:3:4", "15:1", "9:7", "Dominant epistasis: dominant allele at one locus masks the other → 12:3:1."));

  for (let A = 10; A <= 40; A += 5) {
    const T = A;
    const GC = 50 - A;
    const G = GC;
    const C = GC;
    qs.push(makeQ("Molecular Biology", "12", `DNA has ${A}% adenine. Percentage of guanine:`, `${G}%`, `${A}%`, `${50}%`, `${100 - A}%`, `Chargaff's rule: A=T=${A}%, G=C=(50-${A})%=${G}%.`));
    qs.push(makeQ("Molecular Biology", "12", `DNA has ${A}% adenine. Percentage of thymine:`, `${T}%`, `${G}%`, `${100 - A}%`, `${A / 2}%`, `Chargaff's rule: A=T=${A}%.`));
  }

  for (let bp = 100; bp <= 1000; bp += 100) {
    const turns = bp / 10;
    const length = bp * 0.34;
    qs.push(makeQ("Molecular Biology", "12", `DNA with ${bp} base pairs. Number of complete turns:`, `${turns}`, `${turns * 2}`, `${bp}`, `${turns / 2}`, `B-DNA has 10 bp/turn. ${bp}/10 = ${turns} turns.`));
    qs.push(makeQ("Molecular Biology", "12", `DNA with ${bp} base pairs. Length in nm:`, `${length} nm`, `${length / 2} nm`, `${bp} nm`, `${length * 2} nm`, `Rise per bp = 0.34 nm. Length = ${bp} × 0.34 = ${length} nm.`));
  }

  for (let n = 1; n <= 10; n++) {
    const molecules = Math.pow(2, n);
    qs.push(makeQ("Molecular Biology", "12", `After ${n} round(s) of DNA replication, number of DNA molecules:`, `${molecules}`, `${molecules / 2}`, `${n * 2}`, `${molecules * 2}`, `DNA replication is semi-conservative. After ${n} rounds: 2^${n} = ${molecules} molecules.`));
  }

  const codons: [string, string][] = [
    ["AUG", "Methionine (start codon)"],
    ["UAA", "Stop (ochre)"],
    ["UAG", "Stop (amber)"],
    ["UGA", "Stop (opal)"],
    ["UUU", "Phenylalanine"],
    ["UUC", "Phenylalanine"],
    ["GCU", "Alanine"],
    ["GGG", "Glycine"],
    ["AAA", "Lysine"],
    ["GAG", "Glutamic acid"],
    ["CAG", "Glutamine"],
    ["UAU", "Tyrosine"],
    ["UGG", "Tryptophan (only one codon)"],
    ["CGU", "Arginine"],
    ["AGC", "Serine"],
  ];
  for (let _i29 = 0; _i29 < codons.length; _i29++) {
    const [codon, aa] = codons[_i29];
    qs.push(makeQ("Molecular Biology", "12", `mRNA codon ${codon} codes for:`, aa, codons[(_i29 + 1) % codons.length][1], codons[(_i29 + 2) % codons.length][1], "no amino acid", `Codon ${codon} → ${aa}.`));
  }

  const plantDiseases: [string, string, string][] = [
    ["Citrus canker", "Xanthomonas citri (bacteria)", "Lesions on leaves, fruits"],
    ["Tobacco mosaic", "TMV (virus)", "Mosaic pattern on leaves"],
    ["Wheat rust", "Puccinia graminis (fungus)", "Rust-coloured pustules on leaves"],
    ["Late blight of potato", "Phytophthora infestans (oomycete)", "Dark lesions, Irish famine"],
    ["Black rot of crucifers", "Xanthomonas campestris", "V-shaped necrotic lesions"],
    ["Brown spot of rice", "Helminthosporium oryzae", "Bengal famine 1943"],
    ["Ergot of rye", "Claviceps purpurea", "Sclerotia replace grains"],
    ["Smut of wheat", "Ustilago tritici", "Black powdery mass replaces grains"],
    ["Wilt of cotton", "Fusarium oxysporum", "Vascular wilt, wilting and death"],
    ["Root knot", "Meloidogyne (nematode)", "Galls on roots"],
  ];
  for (let _i30 = 0; _i30 < plantDiseases.length; _i30++) {
    const [disease, pathogen, symptom] = plantDiseases[_i30];
    qs.push(makeQ("Plant Physiology", "12", `${disease} is caused by:`, pathogen, plantDiseases[(_i30 + 1) % plantDiseases.length][1], plantDiseases[(_i30 + 2) % plantDiseases.length][1], "deficiency of nitrogen", `${disease}: ${pathogen}. ${symptom}.`));
  }

  const ecologicalConcepts: [string, string, string][] = [
    ["Mutualism", "Both organisms benefit", "Mycorrhiza, Rhizobium-legume, lichen"],
    ["Parasitism", "One benefits at expense of other", "Cuscuta, tapeworm, malarial parasite"],
    ["Commensalism", "One benefits, other unaffected", "Orchid on mango tree, barnacle on whale"],
    ["Competition", "Both organisms harmed", "Same resource use, competitive exclusion"],
    ["Predation", "One kills and eats other", "Lion-deer, snake-frog, ladybird-aphid"],
    ["Amensalism", "One harmed, other unaffected", "Penicillium inhibiting bacteria"],
  ];
  for (let _i31 = 0; _i31 < ecologicalConcepts.length; _i31++) {
    const [interaction, definition, examples] = ecologicalConcepts[_i31];
    qs.push(makeQ("Ecology", "12", `${interaction} is defined as:`, definition, ecologicalConcepts[(_i31 + 1) % ecologicalConcepts.length][1], ecologicalConcepts[(_i31 + 2) % ecologicalConcepts.length][1], "no interaction between species", `${interaction}: ${definition}. Examples: ${examples}.`));
    qs.push(makeQ("Ecology", "12", `Example of ${interaction}:`, examples, ecologicalConcepts[(_i31 + 1) % ecologicalConcepts.length][2], ecologicalConcepts[(_i31 + 2) % ecologicalConcepts.length][2], "none of these", `${interaction}: ${examples}.`));
  }

  const biomes: [string, string, string][] = [
    ["Tropical rainforest", "High temp, high rainfall, greatest biodiversity", "Amazon, Congo, SE Asia"],
    ["Desert", "Very low rainfall (<25 cm/yr), extreme temps", "Sahara, Thar, Atacama"],
    ["Tundra", "Permafrost, very cold, low vegetation", "Arctic regions, Siberia"],
    ["Taiga (Boreal forest)", "Coniferous trees, cold winters", "Canada, Russia, Scandinavia"],
    ["Temperate grassland", "Moderate rainfall, grasses dominate", "Prairies, Steppes, Pampas"],
    ["Savanna", "Tropical grassland with scattered trees", "African savanna, Cerrado"],
    ["Temperate deciduous forest", "Deciduous trees, distinct seasons", "Eastern USA, Western Europe"],
    ["Coral reef", "Warm shallow marine, high biodiversity", "Great Barrier Reef, Lakshadweep"],
    ["Mangrove", "Coastal, salt-tolerant trees, tidal zones", "Sundarbans, Florida Everglades"],
  ];
  for (let _i32 = 0; _i32 < biomes.length; _i32++) {
    const [biome, chars, locations] = biomes[_i32];
    qs.push(makeQ("Ecology", "12", `${biome}: characteristics:`, chars, biomes[(_i32 + 1) % biomes.length][1], biomes[(_i32 + 2) % biomes.length][1], "moderate in all parameters", `${biome}: ${chars}. Found in ${locations}.`));
    qs.push(makeQ("Ecology", "12", `Examples of ${biome}:`, locations, biomes[(_i32 + 1) % biomes.length][2], biomes[(_i32 + 2) % biomes.length][2], "Antarctica", `${biome} is found in ${locations}.`));
  }

  const protectedAreas: [string, string, string][] = [
    ["Jim Corbett", "Uttarakhand", "First national park of India (1936), Bengal tiger"],
    ["Kaziranga", "Assam", "One-horned rhinoceros, UNESCO site"],
    ["Gir", "Gujarat", "Only habitat of Asiatic lion"],
    ["Ranthambore", "Rajasthan", "Bengal tiger, historical fort"],
    ["Sundarbans", "West Bengal", "Mangrove delta, Royal Bengal tiger"],
    ["Periyar", "Kerala", "Elephants, artificial lake"],
    ["Bharatpur (Keoladeo)", "Rajasthan", "Migratory birds, UNESCO site"],
    ["Valley of Flowers", "Uttarakhand", "Alpine flowers, UNESCO site"],
    ["Bandipur", "Karnataka", "Tiger reserve, part of Nilgiri biosphere"],
    ["Silent Valley", "Kerala", "Tropical evergreen, lion-tailed macaque"],
  ];
  for (let _i33 = 0; _i33 < protectedAreas.length; _i33++) {
    const [park, state, significance] = protectedAreas[_i33];
    qs.push(makeQ("Biodiversity", "12", `${park} National Park is in:`, state, protectedAreas[(_i33 + 1) % protectedAreas.length][1], protectedAreas[(_i33 + 2) % protectedAreas.length][1], "Maharashtra", `${park}: ${state}. ${significance}.`));
    qs.push(makeQ("Biodiversity", "12", `${park} is known for:`, significance, protectedAreas[(_i33 + 1) % protectedAreas.length][2], protectedAreas[(_i33 + 2) % protectedAreas.length][2], "coral reefs", `${park}: ${significance}.`));
  }

  const endangeredSpecies: [string, string, string][] = [
    ["Bengal tiger", "Panthera tigris tigris", "IUCN Endangered"],
    ["Asian elephant", "Elephas maximus", "IUCN Endangered"],
    ["One-horned rhinoceros", "Rhinoceros unicornis", "IUCN Vulnerable"],
    ["Snow leopard", "Panthera uncia", "IUCN Vulnerable"],
    ["Red panda", "Ailurus fulgens", "IUCN Endangered"],
    ["Gangetic dolphin", "Platanista gangetica", "IUCN Endangered"],
    ["Great Indian bustard", "Ardeotis nigriceps", "IUCN Critically Endangered"],
    ["Lion-tailed macaque", "Macaca silenus", "IUCN Endangered"],
    ["Nilgiri tahr", "Nilgiritragus hylocrius", "IUCN Endangered"],
    ["Olive ridley turtle", "Lepidochelys olivacea", "IUCN Vulnerable"],
  ];
  for (let _i34 = 0; _i34 < endangeredSpecies.length; _i34++) {
    const [common, scientific, status] = endangeredSpecies[_i34];
    qs.push(makeQ("Biodiversity", "12", `Scientific name of ${common}:`, scientific, endangeredSpecies[(_i34 + 1) % endangeredSpecies.length][1], endangeredSpecies[(_i34 + 2) % endangeredSpecies.length][1], "Homo sapiens", `${common}: ${scientific}. Status: ${status}.`));
    qs.push(makeQ("Biodiversity", "12", `IUCN status of ${common}:`, status, endangeredSpecies[(_i34 + 1) % endangeredSpecies.length][2], "Least Concern", "Extinct", `${common}: ${status}.`));
  }

  const dnaTools: [string, string, string][] = [
    ["EcoRI", "GAATTC", "E. coli restriction enzyme, first discovered"],
    ["BamHI", "GGATCC", "Bacillus amyloliquefaciens"],
    ["HindIII", "AAGCTT", "Haemophilus influenzae"],
    ["PstI", "CTGCAG", "Providencia stuartii"],
    ["SalI", "GTCGAC", "Streptomyces albus"],
    ["NotI", "GCGGCCGC", "8-base cutter, rare sites"],
    ["XhoI", "CTCGAG", "Xanthomonas holcicola"],
    ["SmaI", "CCCGGG", "Serratia marcescens, blunt end"],
  ];
  for (let _i35 = 0; _i35 < dnaTools.length; _i35++) {
    const [enzyme, site, source] = dnaTools[_i35];
    qs.push(makeQ("Biotechnology", "12", `Restriction enzyme ${enzyme} recognises:`, site, dnaTools[(_i35 + 1) % dnaTools.length][1], dnaTools[(_i35 + 2) % dnaTools.length][1], "any random sequence", `${enzyme}: cuts at ${site}. Source: ${source}.`));
  }

  const musculoskeletal: [string, string][] = [
    ["Humerus", "Upper arm bone, articulates with scapula and radius/ulna"],
    ["Femur", "Longest and strongest bone in human body (thigh)"],
    ["Tibia", "Shinbone, main weight-bearing bone of lower leg"],
    ["Fibula", "Lateral lower leg bone, non-weight-bearing"],
    ["Patella", "Kneecap, largest sesamoid bone"],
    ["Scapula", "Shoulder blade, triangular flat bone"],
    ["Clavicle", "Collarbone, connects arm to trunk"],
    ["Sternum", "Breastbone, ribs attach anteriorly"],
    ["Vertebral column", "33 vertebrae: 7C + 12T + 5L + 5S(fused) + 4Co(fused)"],
    ["Pelvic girdle", "Hip bone (ilium + ischium + pubis), supports body weight"],
    ["Carpals", "8 small bones of the wrist"],
    ["Tarsals", "7 bones of the ankle"],
    ["Cranium", "8 bones forming the brain case"],
    ["Ribs", "12 pairs: 7 true + 3 false + 2 floating"],
    ["Hyoid", "Only bone not articulating with another bone, in neck"],
  ];
  for (let _i36 = 0; _i36 < musculoskeletal.length; _i36++) {
    const [bone, description] = musculoskeletal[_i36];
    qs.push(makeQ("Human Physiology - Locomotion", "11", `${bone}:`, description, musculoskeletal[(_i36 + 1) % musculoskeletal.length][1], musculoskeletal[(_i36 + 2) % musculoskeletal.length][1], "smallest bone in the body", `${bone}: ${description}.`));
  }

  const joints: [string, string, string][] = [
    ["Ball and socket", "Multi-axial movement", "Shoulder, hip"],
    ["Hinge", "Uniaxial movement (flexion/extension)", "Elbow, knee"],
    ["Pivot", "Rotation around axis", "Atlas-axis (neck rotation)"],
    ["Gliding", "Sliding movement", "Wrist (intercarpal), ankle"],
    ["Saddle", "Biaxial movement", "Thumb (carpometacarpal)"],
    ["Condyloid", "Biaxial, oval-shaped surfaces", "Wrist (radiocarpal)"],
    ["Suture", "Immovable fibrous joint", "Skull bones"],
    ["Cartilaginous", "Slightly movable", "Intervertebral discs, pubic symphysis"],
  ];
  for (let _i37 = 0; _i37 < joints.length; _i37++) {
    const [joint, movement, example] = joints[_i37];
    qs.push(makeQ("Human Physiology - Locomotion", "11", `${joint} joint allows:`, movement, joints[(_i37 + 1) % joints.length][1], joints[(_i37 + 2) % joints.length][1], "no movement at all", `${joint}: ${movement}. Example: ${example}.`));
    qs.push(makeQ("Human Physiology - Locomotion", "11", `Example of ${joint} joint:`, example, joints[(_i37 + 1) % joints.length][2], joints[(_i37 + 2) % joints.length][2], "vertebral column", `${joint} joint: ${example}.`));
  }

  const muscles: [string, string, string][] = [
    ["Biceps brachii", "Flexion of forearm at elbow", "Antagonist: triceps"],
    ["Triceps brachii", "Extension of forearm at elbow", "Antagonist: biceps"],
    ["Quadriceps", "Extension of leg at knee", "Front of thigh"],
    ["Hamstrings", "Flexion of leg at knee", "Back of thigh"],
    ["Gastrocnemius", "Plantar flexion of foot (calf muscle)", "Walking, running"],
    ["Deltoid", "Abduction of arm at shoulder", "Shoulder cap"],
    ["Pectoralis major", "Adduction, flexion of arm", "Chest muscle"],
    ["Latissimus dorsi", "Extension, adduction of arm", "Broadest back muscle"],
    ["Diaphragm", "Main muscle of respiration", "Separates thorax from abdomen"],
    ["Intercostals", "Expand/contract ribcage during breathing", "Between ribs"],
  ];
  for (let _i38 = 0; _i38 < muscles.length; _i38++) {
    const [muscle, function_, note] = muscles[_i38];
    qs.push(makeQ("Human Physiology - Locomotion", "11", `${muscle}: function is:`, function_, muscles[(_i38 + 1) % muscles.length][1], muscles[(_i38 + 2) % muscles.length][1], "blood circulation", `${muscle}: ${function_}. ${note}.`));
  }

  const senseOrgans: [string, string][] = [
    ["Cornea", "Transparent front of eye, refracts light (major bending)"],
    ["Iris", "Coloured part, controls pupil size/light entry"],
    ["Lens", "Fine-focuses light onto retina, accommodation"],
    ["Retina", "Contains rods (dim light) and cones (colour/bright light)"],
    ["Fovea", "Centre of retina, highest cone density, sharpest vision"],
    ["Blind spot", "Where optic nerve exits, no photoreceptors"],
    ["Vitreous humor", "Gel-like substance filling posterior chamber"],
    ["Aqueous humor", "Clear fluid in anterior chamber, maintains pressure"],
    ["Cochlea", "Spiral organ in inner ear, sound transduction"],
    ["Semicircular canals", "Three canals for balance and angular acceleration"],
    ["Organ of Corti", "Actual hearing receptor on basilar membrane"],
    ["Eustachian tube", "Connects middle ear to pharynx, equalizes pressure"],
    ["Tympanic membrane", "Eardrum, vibrates in response to sound waves"],
    ["Ossicles", "Malleus, incus, stapes — amplify sound 20× in middle ear"],
    ["Olfactory epithelium", "Nasal cavity, contains smell receptors"],
    ["Taste buds", "On tongue papillae, detect sweet/sour/salty/bitter/umami"],
  ];
  for (let _i39 = 0; _i39 < senseOrgans.length; _i39++) {
    const [structure, function_] = senseOrgans[_i39];
    qs.push(makeQ("Human Physiology - Sense Organs", "11", `${structure}:`, function_, senseOrgans[(_i39 + 1) % senseOrgans.length][1], senseOrgans[(_i39 + 2) % senseOrgans.length][1], "digestion of proteins", `${structure}: ${function_}.`));
  }

  const eyeDefects: [string, string, string][] = [
    ["Myopia (near-sightedness)", "Image forms in front of retina", "Corrected by concave lens"],
    ["Hypermetropia (far-sightedness)", "Image forms behind retina", "Corrected by convex lens"],
    ["Astigmatism", "Uneven curvature of cornea/lens", "Corrected by cylindrical lens"],
    ["Presbyopia", "Age-related loss of accommodation", "Corrected by bifocal lens"],
    ["Cataract", "Clouding of lens", "Treated by surgical lens replacement"],
    ["Glaucoma", "Increased intraocular pressure", "Damages optic nerve"],
    ["Colour blindness", "Cannot distinguish certain colours", "X-linked recessive trait"],
    ["Night blindness", "Cannot see in dim light", "Vitamin A deficiency"],
  ];
  for (let _i40 = 0; _i40 < eyeDefects.length; _i40++) {
    const [defect, cause, correction] = eyeDefects[_i40];
    qs.push(makeQ("Human Physiology - Sense Organs", "11", `${defect}: cause is:`, cause, eyeDefects[(_i40 + 1) % eyeDefects.length][1], eyeDefects[(_i40 + 2) % eyeDefects.length][1], "excess vitamin A", `${defect}: ${cause}. ${correction}.`));
    qs.push(makeQ("Human Physiology - Sense Organs", "11", `${defect}: correction is:`, correction, eyeDefects[(_i40 + 1) % eyeDefects.length][2], eyeDefects[(_i40 + 2) % eyeDefects.length][2], "no treatment available", `${defect}: ${correction}.`));
  }

  const plantMorphology: [string, string, string][] = [
    ["Tap root", "Primary root with branches, dicots", "Mustard, mango, neem"],
    ["Fibrous root", "Cluster of thin roots, monocots", "Wheat, rice, grass"],
    ["Prop roots", "Adventitious aerial roots for support", "Banyan tree"],
    ["Pneumatophores", "Breathing roots in waterlogged soil", "Rhizophora (mangrove)"],
    ["Simple leaf", "Single undivided blade", "Mango, guava, hibiscus"],
    ["Compound leaf", "Blade divided into leaflets", "Neem (pinnate), silk cotton (palmate)"],
    ["Racemose inflorescence", "Flowers acropetally arranged", "Mustard, radish"],
    ["Cymose inflorescence", "Main axis terminates in flower", "Jasmine, cotton"],
    ["Drupe", "Fleshy fruit with stony endocarp", "Mango, coconut, peach"],
    ["Berry", "Fleshy fruit, many seeds", "Tomato, grape, banana"],
    ["Capsule", "Dry dehiscent fruit, many seeds", "Cotton, poppy, lady's finger"],
    ["Legume/Pod", "Dry fruit, single carpel, dehiscent", "Pea, bean, gram"],
    ["Nut", "Dry indehiscent, hard pericarp", "Cashew, walnut, chestnut"],
    ["Caryopsis", "Dry indehiscent, fused pericarp-seed coat", "Wheat, rice, maize"],
  ];
  for (let _i41 = 0; _i41 < plantMorphology.length; _i41++) {
    const [structure, description, example] = plantMorphology[_i41];
    qs.push(makeQ("Plant Anatomy", "11", `${structure}: description is:`, description, plantMorphology[(_i41 + 1) % plantMorphology.length][1], plantMorphology[(_i41 + 2) % plantMorphology.length][1], "none of these", `${structure}: ${description}. Example: ${example}.`));
    qs.push(makeQ("Plant Anatomy", "11", `Example of ${structure}:`, example, plantMorphology[(_i41 + 1) % plantMorphology.length][2], plantMorphology[(_i41 + 2) % plantMorphology.length][2], "pine tree", `${structure}: ${example}.`));
  }

  const minerals: [string, string, string][] = [
    ["Calcium", "Bones, teeth, muscle contraction, clotting", "Milk, cheese, green vegetables"],
    ["Iron", "Haemoglobin formation, O₂ transport", "Liver, spinach, red meat"],
    ["Iodine", "Thyroid hormones (T₃, T₄)", "Iodised salt, seafood"],
    ["Sodium", "Nerve impulses, osmotic balance, blood pressure", "Table salt, processed food"],
    ["Potassium", "Nerve-muscle function, heart rhythm", "Banana, potato, orange"],
    ["Phosphorus", "Bones, DNA/RNA, ATP", "Dairy, meat, nuts"],
    ["Zinc", "Enzyme cofactor, immunity, wound healing", "Meat, shellfish, legumes"],
    ["Magnesium", "Enzyme cofactor, chlorophyll component", "Green leafy vegetables, nuts"],
    ["Fluoride", "Tooth enamel strengthening", "Fluoridated water, toothpaste"],
    ["Selenium", "Antioxidant (glutathione peroxidase)", "Brazil nuts, seafood"],
  ];
  for (let _i42 = 0; _i42 < minerals.length; _i42++) {
    const [mineral, function_, source] = minerals[_i42];
    qs.push(makeQ("Human Health & Disease", "12", `${mineral}: function in body:`, function_, minerals[(_i42 + 1) % minerals.length][1], minerals[(_i42 + 2) % minerals.length][1], "no known function", `${mineral}: ${function_}. Sources: ${source}.`));
    qs.push(makeQ("Human Health & Disease", "12", `Dietary source of ${mineral}:`, source, minerals[(_i42 + 1) % minerals.length][2], minerals[(_i42 + 2) % minerals.length][2], "only supplements", `${mineral}: found in ${source}.`));
  }

  const flowersAndParts: [string, string, string][] = [
    ["Calyx (sepals)", "Outermost whorl, protects bud", "Usually green"],
    ["Corolla (petals)", "Attracts pollinators, coloured", "May have nectaries"],
    ["Androecium (stamens)", "Male reproductive: anther + filament", "Produces pollen"],
    ["Gynoecium (carpels)", "Female reproductive: stigma + style + ovary", "Contains ovules"],
    ["Anther", "Part of stamen, produces pollen grains", "Bilobed, 4 pollen sacs"],
    ["Stigma", "Receives pollen, sticky surface", "Top of gynoecium"],
    ["Ovary", "Contains ovules, develops into fruit", "May be superior or inferior"],
    ["Ovule", "Contains embryo sac, develops into seed", "Megasporangium"],
    ["Pollen grain", "Male gametophyte, 2 or 3 cells", "Exine + intine layers"],
    ["Embryo sac", "Female gametophyte, 7 cells, 8 nuclei", "Contains egg + synergids + antipodals + central cell"],
    ["Endosperm", "Nutritive tissue for embryo, 3n", "Result of triple fusion"],
    ["Zygote", "Fertilised egg, develops into embryo", "Diploid (2n)"],
  ];
  for (let _i43 = 0; _i43 < flowersAndParts.length; _i43++) {
    const [part, function_, detail] = flowersAndParts[_i43];
    qs.push(makeQ("Reproduction", "12", `${part}: function is:`, function_, flowersAndParts[(_i43 + 1) % flowersAndParts.length][1], flowersAndParts[(_i43 + 2) % flowersAndParts.length][1], "photosynthesis", `${part}: ${function_}. ${detail}.`));
  }

  const populationEcology: [string, string][] = [
    ["Natality", "Number of births per unit time per unit population"],
    ["Mortality", "Number of deaths per unit time per unit population"],
    ["Immigration", "Number of individuals entering a population"],
    ["Emigration", "Number of individuals leaving a population"],
    ["Population density", "Number of individuals per unit area or volume"],
    ["Carrying capacity (K)", "Maximum population size environment can sustain"],
    ["Exponential growth", "dN/dt = rN, J-shaped curve, unlimited resources"],
    ["Logistic growth", "dN/dt = rN(K-N)/K, S-shaped curve, limited resources"],
    ["r-selected species", "High reproduction rate, small size, short lifespan", ],
    ["K-selected species", "Low reproduction, large size, long lifespan, parental care"],
    ["Age pyramid - expanding", "Broad base, high birth rate, growing population"],
    ["Age pyramid - stable", "Uniform width, birth = death rate"],
    ["Age pyramid - declining", "Narrow base, low birth rate, ageing population"],
    ["Survivorship curve Type I", "High survival early, mortality late (humans, elephants)"],
    ["Survivorship curve Type III", "High mortality early, few survive (oysters, fish)"],
  ];
  for (let _i44 = 0; _i44 < populationEcology.length; _i44++) {
    const [concept, def] = populationEcology[_i44];
    qs.push(makeQ("Ecology", "12", `${concept}:`, def, populationEcology[(_i44 + 1) % populationEcology.length][1], populationEcology[(_i44 + 2) % populationEcology.length][1], "genetic recombination in meiosis", `${concept}: ${def}.`));
  }

  const scientistsAndContributions: [string, string][] = [
    ["Gregor Mendel", "Father of genetics, laws of inheritance using pea plants"],
    ["Charles Darwin", "Theory of natural selection, On the Origin of Species"],
    ["Watson & Crick", "Double helix model of DNA (1953)"],
    ["Har Gobind Khorana", "Interpreted genetic code, synthesised gene"],
    ["Robert Koch", "Koch's postulates, TB bacillus discovery"],
    ["Louis Pasteur", "Germ theory, rabies vaccine, pasteurisation"],
    ["Alexander Fleming", "Discovery of penicillin (1928)"],
    ["Edward Jenner", "Smallpox vaccination (1796)"],
    ["Barbara McClintock", "Transposable genetic elements (jumping genes)"],
    ["Stanley Miller", "Abiotic synthesis of organic molecules (1953)"],
    ["Oparin & Haldane", "Chemical evolution hypothesis for origin of life"],
    ["Hugo de Vries", "Mutation theory of evolution"],
    ["Carl Linnaeus", "Binomial nomenclature system of classification"],
    ["Robert Hooke", "Coined the term 'cell' (1665, cork observation)"],
    ["Anton van Leeuwenhoek", "First to observe bacteria and protozoa"],
    ["Camillo Golgi", "Discovered Golgi apparatus"],
    ["Frederick Sanger", "Insulin amino acid sequence, DNA sequencing"],
    ["Karl Landsteiner", "Discovered ABO blood groups"],
  ];
  for (let _i45 = 0; _i45 < scientistsAndContributions.length; _i45++) {
    const [scientist, contribution] = scientistsAndContributions[_i45];
    qs.push(makeQ("General Biology", "11", `${scientist} is known for:`, contribution, scientistsAndContributions[(_i45 + 1) % scientistsAndContributions.length][1], scientistsAndContributions[(_i45 + 2) % scientistsAndContributions.length][1], "discovery of X-rays", `${scientist}: ${contribution}.`));
  }

  const transpiration: [string, string][] = [
    ["Stomatal transpiration", "Through stomata, accounts for ~90% of water loss"],
    ["Cuticular transpiration", "Through cuticle of epidermis, ~5-10% of water loss"],
    ["Lenticular transpiration", "Through lenticels in bark, very small amount"],
    ["Guard cells", "Bean-shaped cells that open/close stomata"],
    ["Potometer", "Instrument to measure rate of transpiration"],
    ["Cobalt chloride paper", "Blue → pink when exposed to moisture, detects transpiration"],
    ["Root pressure", "Positive pressure in xylem due to mineral absorption in roots"],
    ["Guttation", "Loss of water as liquid droplets from leaf margins"],
    ["Cohesion-tension theory", "Water pulled up by transpiration pull, cohesion of water molecules"],
    ["Wilting", "Loss of turgor pressure due to excess transpiration"],
  ];
  for (let _i46 = 0; _i46 < transpiration.length; _i46++) {
    const [concept, def] = transpiration[_i46];
    qs.push(makeQ("Plant Physiology", "11", `${concept}:`, def, transpiration[(_i46 + 1) % transpiration.length][1], transpiration[(_i46 + 2) % transpiration.length][1], "breakdown of glucose", `${concept}: ${def}.`));
  }

  const mineralNutrition: [string, string, string][] = [
    ["Nitrogen (N)", "Proteins, nucleic acids, chlorophyll", "Chlorosis of older leaves"],
    ["Phosphorus (P)", "ATP, nucleic acids, phospholipids", "Purple/dark green leaves, stunted growth"],
    ["Potassium (K)", "Enzyme activation, stomatal regulation", "Marginal leaf necrosis"],
    ["Calcium (Ca)", "Cell wall (calcium pectate), cell division", "Distorted new growth"],
    ["Magnesium (Mg)", "Chlorophyll centre, enzyme activator", "Interveinal chlorosis"],
    ["Sulphur (S)", "Amino acids (cysteine, methionine)", "General chlorosis"],
    ["Iron (Fe)", "Chlorophyll synthesis, electron transport", "Interveinal chlorosis (young leaves)"],
    ["Manganese (Mn)", "Water-splitting in PS II, enzyme activator", "Interveinal chlorosis, necrotic spots"],
    ["Zinc (Zn)", "Auxin synthesis, enzyme cofactor", "Little leaf disease, stunted growth"],
    ["Boron (B)", "Cell elongation, pollen germination", "Death of shoot tip, hollow stem"],
    ["Molybdenum (Mo)", "Nitrogen fixation, nitrate reductase", "Whiptail disease in cauliflower"],
    ["Copper (Cu)", "Plastocyanin (photosynthesis), cytochrome oxidase", "Die-back of shoot tips"],
  ];
  for (let _i47 = 0; _i47 < mineralNutrition.length; _i47++) {
    const [element, role, deficiency] = mineralNutrition[_i47];
    qs.push(makeQ("Plant Physiology", "11", `Role of ${element} in plants:`, role, mineralNutrition[(_i47 + 1) % mineralNutrition.length][1], mineralNutrition[(_i47 + 2) % mineralNutrition.length][1], "not required by plants", `${element}: ${role}.`));
    qs.push(makeQ("Plant Physiology", "11", `Deficiency symptom of ${element} in plants:`, deficiency, mineralNutrition[(_i47 + 1) % mineralNutrition.length][2], mineralNutrition[(_i47 + 2) % mineralNutrition.length][2], "no visible symptoms", `${element} deficiency: ${deficiency}.`));
  }

  const plantClassification: [string, string, string][] = [
    ["Algae", "Thallophyta, aquatic, chlorophyll-bearing", "Spirogyra, Ulva, Chara"],
    ["Bryophytes", "Amphibians of plant kingdom, no vascular tissue", "Mosses, liverworts, hornworts"],
    ["Pteridophytes", "First vascular plants, spore-bearing", "Ferns, horsetails, club mosses"],
    ["Gymnosperms", "Naked seeds, no flowers/fruits", "Pine, cedar, cycas, Ginkgo"],
    ["Angiosperms - Dicots", "Two cotyledons, reticulate venation, tap root", "Rose, mango, pea, sunflower"],
    ["Angiosperms - Monocots", "One cotyledon, parallel venation, fibrous root", "Rice, wheat, maize, lily"],
  ];
  for (let _i48 = 0; _i48 < plantClassification.length; _i48++) {
    const [group, chars, examples] = plantClassification[_i48];
    qs.push(makeQ("Plant Anatomy", "11", `${group}: characteristics:`, chars, plantClassification[(_i48 + 1) % plantClassification.length][1], plantClassification[(_i48 + 2) % plantClassification.length][1], "parasitic, no chlorophyll", `${group}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Plant Anatomy", "11", `Examples of ${group}:`, examples, plantClassification[(_i48 + 1) % plantClassification.length][2], plantClassification[(_i48 + 2) % plantClassification.length][2], "bacteria and fungi", `${group}: ${examples}.`));
  }

  const humanDevelopment: [string, string][] = [
    ["Zygote", "Single cell formed by fusion of sperm and egg (Day 0)"],
    ["Morula", "16-cell stage, solid ball of cells (Day 3-4)"],
    ["Blastocyst", "Hollow ball with inner cell mass + trophoblast (Day 5-6)"],
    ["Implantation", "Blastocyst embeds in uterine wall (Day 7-8)"],
    ["Gastrulation", "Formation of 3 germ layers: ectoderm, mesoderm, endoderm"],
    ["Ectoderm", "Forms skin, nervous system, sense organs"],
    ["Mesoderm", "Forms muscles, bones, heart, blood, kidneys"],
    ["Endoderm", "Forms gut lining, liver, pancreas, lungs"],
    ["Placenta formation", "Fully formed by 12 weeks, hCG production"],
    ["First trimester", "Organ formation (organogenesis), heartbeat at 6 weeks"],
    ["Second trimester", "Fetal movement felt, gender distinguishable"],
    ["Third trimester", "Rapid weight gain, lung maturation"],
    ["Parturition", "Childbirth, triggered by oxytocin, ~40 weeks"],
    ["Lactation", "Milk production by mammary glands, prolactin + oxytocin"],
  ];
  for (let _i49 = 0; _i49 < humanDevelopment.length; _i49++) {
    const [stage, description] = humanDevelopment[_i49];
    qs.push(makeQ("Reproduction", "12", `${stage} in human development:`, description, humanDevelopment[(_i49 + 1) % humanDevelopment.length][1], humanDevelopment[(_i49 + 2) % humanDevelopment.length][1], "meiotic division of somatic cells", `${stage}: ${description}.`));
  }

  const vertebrateClasses: [string, string, string][] = [
    ["Cyclostomata", "Jawless, circular mouth, ectoparasite", "Lamprey, Hagfish"],
    ["Chondrichthyes", "Cartilaginous skeleton, placoid scales", "Shark, Ray, Skate"],
    ["Osteichthyes", "Bony skeleton, operculum, swim bladder", "Rohu, Catla, Salmon, Seahorse"],
    ["Amphibia", "Dual life (land+water), moist skin, 3-chambered heart", "Frog, Toad, Salamander"],
    ["Reptilia", "Scales, 3-chambered heart (croc: 4), cold-blooded", "Snake, Lizard, Crocodile, Turtle"],
    ["Aves", "Feathers, hollow bones, 4-chambered heart, warm-blooded", "Crow, Parrot, Ostrich, Penguin"],
    ["Mammalia", "Hair, mammary glands, 4-chambered heart, warm-blooded", "Human, Whale, Bat, Platypus"],
  ];
  for (let _i50 = 0; _i50 < vertebrateClasses.length; _i50++) {
    const [cls, chars, examples] = vertebrateClasses[_i50];
    qs.push(makeQ("Animal Kingdom", "11", `Class ${cls}: characteristics:`, chars, vertebrateClasses[(_i50 + 1) % vertebrateClasses.length][1], vertebrateClasses[(_i50 + 2) % vertebrateClasses.length][1], "segmented body with jointed legs", `${cls}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Animal Kingdom", "11", `Examples of class ${cls}:`, examples, vertebrateClasses[(_i50 + 1) % vertebrateClasses.length][2], vertebrateClasses[(_i50 + 2) % vertebrateClasses.length][2], "Amoeba, Euglena", `${cls}: ${examples}.`));
  }

  const bloodValues: [string, string, string][] = [
    ["RBC count (male)", "4.5-5.5 million/μL", "Erythrocytes, biconcave, no nucleus"],
    ["RBC count (female)", "4.0-5.0 million/μL", "Lower due to menstruation"],
    ["WBC count", "4000-11000/μL", "Leucocytes, immune defence"],
    ["Platelet count", "1.5-4 lakh/μL", "Thrombocytes, blood clotting"],
    ["Haemoglobin (male)", "13-17 g/dL", "Oxygen carrier protein"],
    ["Haemoglobin (female)", "12-15 g/dL", "Each Hb carries 4 O₂"],
    ["Blood pH", "7.35-7.45", "Slightly alkaline"],
    ["Blood volume", "~5 litres in adult", "8% of body weight"],
    ["Heart rate (resting)", "72 beats/min", "SA node pacemaker"],
    ["Blood pressure (normal)", "120/80 mmHg", "Systolic/Diastolic"],
    ["Cardiac output", "~5 L/min at rest", "HR × Stroke volume"],
    ["ESR (male)", "0-15 mm/hr", "Erythrocyte sedimentation rate"],
    ["ESR (female)", "0-20 mm/hr", "Higher in pregnancy/infection"],
    ["Serum cholesterol", "<200 mg/dL desirable", "Risk factor for CVD if high"],
    ["Fasting blood glucose", "70-100 mg/dL", "Diabetes if >126 mg/dL"],
  ];
  for (let _i51 = 0; _i51 < bloodValues.length; _i51++) {
    const [parameter, value, note] = bloodValues[_i51];
    qs.push(makeQ("Human Physiology - Circulation", "11", `Normal ${parameter}:`, value, bloodValues[(_i51 + 1) % bloodValues.length][1], bloodValues[(_i51 + 2) % bloodValues.length][1], "0", `${parameter}: ${value}. ${note}.`));
  }

  const wbcTypes: [string, string, string][] = [
    ["Neutrophils", "60-70% of WBCs, phagocytic, first responders", "Multi-lobed nucleus"],
    ["Eosinophils", "2-4% of WBCs, antiparasitic, allergic response", "Bilobed nucleus, red granules"],
    ["Basophils", "0.5-1% of WBCs, release histamine and heparin", "S-shaped/bilobed nucleus"],
    ["Lymphocytes", "20-25% of WBCs, B cells and T cells", "Large round nucleus"],
    ["Monocytes", "3-8% of WBCs, become macrophages in tissues", "Kidney-shaped nucleus, largest WBC"],
  ];
  for (let _i52 = 0; _i52 < wbcTypes.length; _i52++) {
    const [type, function_, detail] = wbcTypes[_i52];
    qs.push(makeQ("Human Physiology - Circulation", "11", `${type}: function and proportion:`, function_, wbcTypes[(_i52 + 1) % wbcTypes.length][1], wbcTypes[(_i52 + 2) % wbcTypes.length][1], "50% of WBCs, structural support", `${type}: ${function_}. ${detail}.`));
  }

  const urineComponents: [string, string][] = [
    ["Normal urine pH", "4.5-8.0, slightly acidic (avg 6.0)"],
    ["Daily urine volume", "1-1.5 L/day in adults"],
    ["Urea", "Main nitrogenous waste, ~2% of urine"],
    ["Uric acid", "End product of purine metabolism"],
    ["Creatinine", "Waste from creatine phosphate in muscles"],
    ["Glucose in urine", "Absent normally; present in diabetes (glycosuria)"],
    ["Protein in urine", "Absent normally; present in kidney disease (proteinuria)"],
    ["Blood in urine", "Absent normally; present in infection/stones (haematuria)"],
    ["Ketone bodies", "Absent normally; present in starvation/diabetes (ketonuria)"],
    ["Ammonia", "Small amount, from amino acid deamination"],
  ];
  for (let _i53 = 0; _i53 < urineComponents.length; _i53++) {
    const [component, detail] = urineComponents[_i53];
    qs.push(makeQ("Human Physiology - Excretion", "11", `${component}:`, detail, urineComponents[(_i53 + 1) % urineComponents.length][1], urineComponents[(_i53 + 2) % urineComponents.length][1], "major component of blood plasma", `${component}: ${detail}.`));
  }

  const arthropodOrders: [string, string, string][] = [
    ["Insecta", "3 body parts, 6 legs, wings, most diverse", "Butterfly, beetle, ant, mosquito"],
    ["Arachnida", "2 body parts, 8 legs, no antennae", "Spider, scorpion, tick, mite"],
    ["Crustacea", "Cephalothorax + abdomen, gills, aquatic", "Crab, lobster, shrimp, barnacle"],
    ["Myriapoda - Chilopoda", "Many segments, one pair legs/segment, carnivore", "Centipede"],
    ["Myriapoda - Diplopoda", "Many segments, two pairs legs/segment, herbivore", "Millipede"],
  ];
  for (let _i54 = 0; _i54 < arthropodOrders.length; _i54++) {
    const [order, chars, examples] = arthropodOrders[_i54];
    qs.push(makeQ("Animal Kingdom", "11", `${order}: characteristics:`, chars, arthropodOrders[(_i54 + 1) % arthropodOrders.length][1], arthropodOrders[(_i54 + 2) % arthropodOrders.length][1], "soft body, mantle, shell", `${order}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Animal Kingdom", "11", `Examples of ${order}:`, examples, arthropodOrders[(_i54 + 1) % arthropodOrders.length][2], arthropodOrders[(_i54 + 2) % arthropodOrders.length][2], "earthworm, leech", `${order}: ${examples}.`));
  }

  const insectOrders: [string, string, string][] = [
    ["Lepidoptera", "Scaly wings, complete metamorphosis", "Butterfly, moth, silkworm"],
    ["Coleoptera", "Hard elytra (wing covers), largest insect order", "Beetles, ladybird, firefly"],
    ["Diptera", "Two wings, halteres, complete metamorphosis", "Housefly, mosquito, fruit fly"],
    ["Hymenoptera", "Social insects, stinger, complete metamorphosis", "Ant, bee, wasp"],
    ["Hemiptera", "Piercing-sucking mouthparts, half wings", "Bug, cicada, aphid"],
    ["Orthoptera", "Jumping legs, incomplete metamorphosis", "Grasshopper, cricket, cockroach"],
    ["Odonata", "Large eyes, two pairs wings, predatory", "Dragonfly, damselfly"],
    ["Isoptera", "Social, wood-eating, caste system", "Termite"],
  ];
  for (let _i55 = 0; _i55 < insectOrders.length; _i55++) {
    const [order, chars, examples] = insectOrders[_i55];
    qs.push(makeQ("Animal Kingdom", "11", `Insect order ${order}:`, chars, insectOrders[(_i55 + 1) % insectOrders.length][1], insectOrders[(_i55 + 2) % insectOrders.length][1], "aquatic, gills, exoskeleton", `${order}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Animal Kingdom", "11", `Examples of order ${order}:`, examples, insectOrders[(_i55 + 1) % insectOrders.length][2], insectOrders[(_i55 + 2) % insectOrders.length][2], "fish, frog", `${order}: ${examples}.`));
  }

  const adaptations: [string, string, string][] = [
    ["Camel", "Desert adaptation", "Fat storage in hump, concentrated urine, thick eyelashes"],
    ["Polar bear", "Arctic adaptation", "Thick fur, fat layer, white camouflage, black skin absorbs heat"],
    ["Cactus", "Desert plant", "Stem photosynthesis, spines (modified leaves), CAM pathway"],
    ["Whale", "Aquatic mammal", "Streamlined body, blubber, blowholes, echolocation"],
    ["Frog", "Amphibious", "Moist skin for gas exchange, webbed feet, vocal sac"],
    ["Eagle", "Aerial predator", "Keen eyesight, curved beak, talons, hollow bones"],
    ["Chameleon", "Arboreal reptile", "Colour change, prehensile tail, 360° vision, long tongue"],
    ["Fish", "Aquatic", "Streamlined body, gills, swim bladder, lateral line system"],
    ["Penguin", "Aquatic bird", "Flipper-like wings, huddling behaviour, counter-current heat exchange"],
    ["Tapeworm", "Endoparasite", "No digestive system, hooks/suckers, high fecundity, thick tegument"],
  ];
  for (let _i56 = 0; _i56 < adaptations.length; _i56++) {
    const [organism, type, features] = adaptations[_i56];
    qs.push(makeQ("Ecology", "12", `${organism} — ${type}:`, features, adaptations[(_i56 + 1) % adaptations.length][2], adaptations[(_i56 + 2) % adaptations.length][2], "no special adaptations", `${organism}: ${type}. ${features}.`));
  }

  const successionalStages: [string, string, string][] = [
    ["Lichen stage (Crustose)", "Pioneer on bare rock, secrete acids", "Primary succession"],
    ["Moss stage", "Grow on lichen debris, form thin soil", "Primary succession"],
    ["Herb stage", "Grasses and herbs colonize", "Both primary and secondary"],
    ["Shrub stage", "Woody shrubs replace herbs", "Both primary and secondary"],
    ["Tree stage (Climax)", "Stable forest community", "Final stage of succession"],
    ["Hydrosere", "Succession in water body", "Phytoplankton → submerged → floating → marsh → forest"],
    ["Xerosere", "Succession on dry/bare surface", "Lichen → moss → herb → shrub → forest"],
    ["Psammosere", "Succession on sand", "Sand-binding grasses → shrubs → forest"],
  ];
  for (let _i57 = 0; _i57 < successionalStages.length; _i57++) {
    const [stage, description, type] = successionalStages[_i57];
    qs.push(makeQ("Ecology", "12", `${stage}:`, description, successionalStages[(_i57 + 1) % successionalStages.length][1], successionalStages[(_i57 + 2) % successionalStages.length][1], "climax community forms immediately", `${stage}: ${description}. Type: ${type}.`));
  }

  const biogeochemicalCycles: [string, string, string][] = [
    ["Carbon fixation", "CO₂ → organic carbon by photosynthesis", "Calvin cycle in chloroplasts"],
    ["Carbon release", "Organic carbon → CO₂ by respiration/combustion", "Respiration, decomposition, fossil fuel burning"],
    ["Nitrogen fixation", "N₂ → NH₃ by bacteria or lightning", "Rhizobium, Azotobacter, Nostoc"],
    ["Nitrification", "NH₃ → NO₂⁻ → NO₃⁻ by bacteria", "Nitrosomonas (NH₃→NO₂⁻), Nitrobacter (NO₂⁻→NO₃⁻)"],
    ["Denitrification", "NO₃⁻ → N₂ by anaerobic bacteria", "Pseudomonas, returns N₂ to atmosphere"],
    ["Ammonification", "Organic N → NH₃ by decomposers", "Decomposition of dead organisms"],
    ["Phosphorus weathering", "Rock phosphate → dissolved phosphate", "No gaseous phase, sedimentary cycle"],
    ["Sulphur cycle", "SO₄²⁻ ↔ H₂S through bacteria", "Desulfovibrio reduces sulphate"],
    ["Water cycle", "Evaporation → condensation → precipitation → runoff", "Solar energy drives the cycle"],
  ];
  for (let _i58 = 0; _i58 < biogeochemicalCycles.length; _i58++) {
    const [process, description, detail] = biogeochemicalCycles[_i58];
    qs.push(makeQ("Ecology", "12", `${process}:`, description, biogeochemicalCycles[(_i58 + 1) % biogeochemicalCycles.length][1], biogeochemicalCycles[(_i58 + 2) % biogeochemicalCycles.length][1], "nuclear fusion in the sun", `${process}: ${description}. ${detail}.`));
    qs.push(makeQ("Ecology", "12", `${process} — detail:`, detail, biogeochemicalCycles[(_i58 + 1) % biogeochemicalCycles.length][2], biogeochemicalCycles[(_i58 + 2) % biogeochemicalCycles.length][2], "no organisms involved", `${process}: ${detail}.`));
  }

  const pollution: [string, string, string][] = [
    ["Air pollution — SO₂", "Acid rain, respiratory problems", "From burning of fossil fuels containing sulphur"],
    ["Air pollution — CO", "Combines with Hb, reduces O₂ carrying capacity", "From incomplete combustion"],
    ["Air pollution — NO₂", "Photochemical smog, respiratory irritant", "From vehicle exhaust"],
    ["Air pollution — PM2.5", "Deep lung penetration, cardiovascular disease", "Fine particulate matter <2.5 μm"],
    ["Water pollution — BOD", "High BOD = more organic pollution", "Biological oxygen demand"],
    ["Water pollution — eutrophication", "Algal bloom → O₂ depletion → fish kill", "Excess nutrients (N, P) in water"],
    ["Water pollution — heavy metals", "Mercury, lead, cadmium — bioaccumulation", "Industrial effluents, Minamata disease"],
    ["Noise pollution", ">80 dB causes hearing damage", "Traffic, industry, firecrackers"],
    ["Soil pollution — pesticides", "DDT, BHC — bioaccumulation, biomagnification", "Non-biodegradable, persist in food chain"],
    ["Radiation pollution", "Mutations, cancer, genetic damage", "Nuclear waste, X-rays, UV radiation"],
    ["Thermal pollution", "Heated water reduces dissolved O₂", "Power plant cooling water discharge"],
    ["Ozone depletion", "CFCs release Cl, catalytic O₃ destruction", "UV-B increase, skin cancer risk"],
    ["Greenhouse effect", "CO₂, CH₄, N₂O trap infrared radiation", "Global warming, sea level rise"],
  ];
  for (let _i59 = 0; _i59 < pollution.length; _i59++) {
    const [type, effect, detail] = pollution[_i59];
    qs.push(makeQ("Ecology", "12", `${type}: effect is:`, effect, pollution[(_i59 + 1) % pollution.length][1], pollution[(_i59 + 2) % pollution.length][1], "beneficial to ecosystem", `${type}: ${effect}. ${detail}.`));
    qs.push(makeQ("Ecology", "12", `${type}: detail:`, detail, pollution[(_i59 + 1) % pollution.length][2], pollution[(_i59 + 2) % pollution.length][2], "no known source", `${type}: ${detail}.`));
  }

  const cellSignaling: [string, string][] = [
    ["Endocrine signaling", "Hormones travel through blood to distant target cells"],
    ["Paracrine signaling", "Signal molecules act on nearby cells"],
    ["Autocrine signaling", "Cell responds to signals it produces itself"],
    ["Synaptic signaling", "Neurotransmitter crosses synapse to next neuron"],
    ["Contact-dependent signaling", "Direct cell-cell contact via surface molecules"],
    ["Receptor tyrosine kinase", "Phosphorylation cascade, growth factor signaling"],
    ["G-protein coupled receptor", "7-transmembrane domain, activates G protein"],
    ["Ion channel receptor", "Opens ion channel on ligand binding"],
    ["Second messenger — cAMP", "Adenylyl cyclase converts ATP to cAMP"],
    ["Second messenger — IP₃", "Releases Ca²⁺ from ER"],
    ["Apoptosis", "Programmed cell death, caspase cascade"],
    ["Necrosis", "Uncontrolled cell death due to injury/infection"],
  ];
  for (let _i60 = 0; _i60 < cellSignaling.length; _i60++) {
    const [concept, def] = cellSignaling[_i60];
    qs.push(makeQ("Cell Biology", "12", `${concept}:`, def, cellSignaling[(_i60 + 1) % cellSignaling.length][1], cellSignaling[(_i60 + 2) % cellSignaling.length][1], "protein synthesis at ribosome", `${concept}: ${def}.`));
  }

  const geneticEngineering: [string, string, string][] = [
    ["Ti plasmid", "Agrobacterium tumefaciens", "Natural genetic engineer of plants, T-DNA insertion"],
    ["pBR322", "First artificial cloning vector", "Contains ampR and tetR markers"],
    ["pUC vectors", "High copy number plasmids", "lacZ gene for blue-white screening"],
    ["Lambda phage", "Bacteriophage vector", "Can carry up to 23 kb insert"],
    ["Cosmid", "Hybrid vector (plasmid + cos sites)", "Can carry 33-45 kb DNA"],
    ["BAC", "Bacterial artificial chromosome", "Carries 100-300 kb, low copy number"],
    ["YAC", "Yeast artificial chromosome", "Carries up to 1000 kb DNA"],
    ["Selectable marker", "Antibiotic resistance gene", "Identifies transformed cells"],
    ["Reporter gene", "GFP, lacZ, luciferase", "Visualizes gene expression"],
    ["Insertional inactivation", "Insert disrupts marker gene", "Identifies recombinant clones"],
    ["cDNA library", "mRNA → cDNA by reverse transcriptase", "Only expressed genes, no introns"],
    ["Genomic library", "All DNA fragments of organism", "Contains introns and non-coding DNA"],
  ];
  for (let _i61 = 0; _i61 < geneticEngineering.length; _i61++) {
    const [tool, description, detail] = geneticEngineering[_i61];
    qs.push(makeQ("Biotechnology", "12", `${tool}:`, description, geneticEngineering[(_i61 + 1) % geneticEngineering.length][1], geneticEngineering[(_i61 + 2) % geneticEngineering.length][1], "photosynthetic pigment", `${tool}: ${description}. ${detail}.`));
    qs.push(makeQ("Biotechnology", "12", `${tool} — detail:`, detail, geneticEngineering[(_i61 + 1) % geneticEngineering.length][2], geneticEngineering[(_i61 + 2) % geneticEngineering.length][2], "no specific function", `${tool}: ${detail}.`));
  }

  const gmApplications: [string, string, string][] = [
    ["Bt cotton", "Cry1Ac and Cry2Ab proteins", "Kills bollworm larvae, reduces pesticide use"],
    ["Golden rice", "β-carotene enriched (vitamin A)", "Addresses vitamin A deficiency"],
    ["Flavr Savr tomato", "Delayed ripening by antisense RNA", "First commercialised GM food (1994)"],
    ["Bt brinjal", "Cry1Ac protein against fruit borer", "Approved in Bangladesh, moratorium in India"],
    ["Herbicide-tolerant soybean", "Roundup Ready, glyphosate resistant", "Allows herbicide spraying without crop damage"],
    ["Insulin production", "Human insulin gene in E. coli", "Humulin, replaced animal insulin"],
    ["Hepatitis B vaccine", "HBsAg produced in yeast", "Recombinant vaccine, safer than blood-derived"],
    ["Gene therapy for ADA deficiency", "Functional ADA gene introduced", "First gene therapy trial (1990)"],
    ["Dolly the sheep", "First mammal cloned (1996)", "Somatic cell nuclear transfer (SCNT)"],
    ["Human Genome Project", "Mapped all human genes (2003)", "3.2 billion base pairs, ~20,500 genes"],
  ];
  for (let _i62 = 0; _i62 < gmApplications.length; _i62++) {
    const [application, mechanism, significance] = gmApplications[_i62];
    qs.push(makeQ("Biotechnology", "12", `${application}:`, mechanism, gmApplications[(_i62 + 1) % gmApplications.length][1], gmApplications[(_i62 + 2) % gmApplications.length][1], "no genetic modification involved", `${application}: ${mechanism}. ${significance}.`));
    qs.push(makeQ("Biotechnology", "12", `Significance of ${application}:`, significance, gmApplications[(_i62 + 1) % gmApplications.length][2], gmApplications[(_i62 + 2) % gmApplications.length][2], "no practical application", `${application}: ${significance}.`));
  }

  const embryology: [string, string][] = [
    ["Spermatogonia", "Diploid stem cells in testis, undergo mitosis to maintain population"],
    ["Primary spermatocyte", "Diploid cell that undergoes meiosis I"],
    ["Secondary spermatocyte", "Haploid cell after meiosis I, undergoes meiosis II"],
    ["Spermatid", "Haploid cell that differentiates into sperm (spermiogenesis)"],
    ["Spermatozoon", "Mature sperm: head (acrosome + nucleus) + middle piece (mitochondria) + tail"],
    ["Oogonia", "Diploid stem cells in ovary, multiply during fetal development"],
    ["Primary oocyte", "Arrested in prophase I until puberty"],
    ["Secondary oocyte", "Arrested in metaphase II, released during ovulation"],
    ["Ovum", "Formed after sperm entry completes meiosis II"],
    ["Polar body", "Small cell with little cytoplasm, degenerates"],
    ["Acrosome reaction", "Sperm releases enzymes to penetrate zona pellucida"],
    ["Cortical reaction", "Prevents polyspermy after first sperm entry"],
    ["Zona pellucida", "Glycoprotein layer around oocyte"],
    ["Corona radiata", "Layer of follicular cells around oocyte"],
    ["Capacitation", "Sperm activation in female reproductive tract"],
  ];
  for (let _i63 = 0; _i63 < embryology.length; _i63++) {
    const [term, def] = embryology[_i63];
    qs.push(makeQ("Reproduction", "12", `${term}:`, def, embryology[(_i63 + 1) % embryology.length][1], embryology[(_i63 + 2) % embryology.length][1], "mitotic division of liver cells", `${term}: ${def}.`));
  }

  const stis: [string, string, string][] = [
    ["Gonorrhoea", "Neisseria gonorrhoeae (bacteria)", "Pus discharge, painful urination"],
    ["Syphilis", "Treponema pallidum (bacteria)", "Chancre, rashes, can affect brain if untreated"],
    ["Chlamydia", "Chlamydia trachomatis (bacteria)", "Often asymptomatic, can cause infertility"],
    ["Genital herpes", "Herpes simplex virus (HSV-2)", "Painful blisters, recurring outbreaks"],
    ["Genital warts", "Human papillomavirus (HPV)", "Can cause cervical cancer, vaccine available"],
    ["Trichomoniasis", "Trichomonas vaginalis (protozoan)", "Vaginal discharge, itching"],
    ["Hepatitis B", "Hepatitis B virus", "Liver inflammation, can become chronic"],
    ["AIDS", "HIV (Human Immunodeficiency Virus)", "Attacks CD4+ T cells, immunodeficiency"],
  ];
  for (let _i64 = 0; _i64 < stis.length; _i64++) {
    const [disease, pathogen, symptoms] = stis[_i64];
    qs.push(makeQ("Reproduction", "12", `STI — ${disease}: caused by:`, pathogen, stis[(_i64 + 1) % stis.length][1], stis[(_i64 + 2) % stis.length][1], "genetic mutation", `${disease}: ${pathogen}. ${symptoms}.`));
    qs.push(makeQ("Reproduction", "12", `Symptoms of ${disease}:`, symptoms, stis[(_i64 + 1) % stis.length][2], stis[(_i64 + 2) % stis.length][2], "no symptoms ever", `${disease}: ${symptoms}.`));
  }

  const contraceptiveMethods: [string, string, string][] = [
    ["Condom (male)", "Barrier method", "Also prevents STIs, 85-98% effective"],
    ["Diaphragm", "Barrier method", "Covers cervix, used with spermicide"],
    ["IUD - Copper T", "Intrauterine device", "Cu ions are spermicidal, 99% effective, 5-10 years"],
    ["IUD - LNG", "Levonorgestrel-releasing IUD", "Thickens cervical mucus, 99% effective"],
    ["OCP (Combined pill)", "Hormonal method", "Oestrogen + progesterone, prevents ovulation"],
    ["Emergency contraception", "Hormonal (levonorgestrel)", "Within 72 hours of unprotected intercourse"],
    ["Vasectomy", "Surgical (male)", "Vas deferens cut and tied, permanent"],
    ["Tubectomy", "Surgical (female)", "Fallopian tubes cut and tied, permanent"],
    ["Natural method - rhythm", "Abstinence during fertile period", "Days 10-17 of 28-day cycle"],
    ["Spermicide", "Chemical method", "Kills or immobilises sperm"],
  ];
  for (let _i65 = 0; _i65 < contraceptiveMethods.length; _i65++) {
    const [method, type, detail] = contraceptiveMethods[_i65];
    qs.push(makeQ("Reproduction", "12", `${method}: type:`, type, contraceptiveMethods[(_i65 + 1) % contraceptiveMethods.length][1], contraceptiveMethods[(_i65 + 2) % contraceptiveMethods.length][1], "genetic method", `${method}: ${type}. ${detail}.`));
    qs.push(makeQ("Reproduction", "12", `${method}: detail:`, detail, contraceptiveMethods[(_i65 + 1) % contraceptiveMethods.length][2], contraceptiveMethods[(_i65 + 2) % contraceptiveMethods.length][2], "100% effective, no side effects", `${method}: ${detail}.`));
  }

  const plantReproduction: [string, string, string][] = [
    ["Microsporogenesis", "Formation of microspores in anther", "Meiosis of microspore mother cell → 4 microspores"],
    ["Megasporogenesis", "Formation of megaspore in ovule", "Meiosis of megaspore mother cell → 4 megaspores (3 degenerate)"],
    ["Male gametophyte", "Pollen grain (2 or 3 cells)", "Generative cell → 2 sperm; vegetative cell → pollen tube"],
    ["Female gametophyte", "Embryo sac (7 cells, 8 nuclei)", "Egg + 2 synergids + 3 antipodals + 2 polar nuclei"],
    ["Syngamy", "Fusion of one sperm with egg → zygote (2n)", "First fertilisation event"],
    ["Triple fusion", "Fusion of sperm with 2 polar nuclei → PEN (3n)", "Gives rise to endosperm"],
    ["Double fertilisation", "Syngamy + triple fusion simultaneously", "Unique to angiosperms"],
    ["Endosperm development", "PEN divides to form nutritive tissue", "Free nuclear → cellular type most common"],
    ["Embryo development", "Zygote → proembryo → globular → heart → torpedo → mature", "Dicot embryo stages"],
    ["Seed coat", "Develops from integuments of ovule", "Testa (outer) + tegmen (inner)"],
    ["Fruit wall (pericarp)", "Develops from ovary wall", "Epicarp + mesocarp + endocarp"],
    ["Seed dispersal", "Wind, water, animals, explosive mechanism", "Aids in spread and colonisation"],
  ];
  for (let _i66 = 0; _i66 < plantReproduction.length; _i66++) {
    const [process, definition, detail] = plantReproduction[_i66];
    qs.push(makeQ("Reproduction", "12", `${process}:`, definition, plantReproduction[(_i66 + 1) % plantReproduction.length][1], plantReproduction[(_i66 + 2) % plantReproduction.length][1], "vegetative propagation by roots", `${process}: ${definition}. ${detail}.`));
    qs.push(makeQ("Reproduction", "12", `${process} — detail:`, detail, plantReproduction[(_i66 + 1) % plantReproduction.length][2], plantReproduction[(_i66 + 2) % plantReproduction.length][2], "no cells involved", `${process}: ${detail}.`));
  }

  const humanEvoTimeline: [string, string, string][] = [
    ["Dryopithecus", "25-15 MYA", "Ape-like ancestor, knuckle-walker"],
    ["Ramapithecus", "15-10 MYA", "More human-like jaw, possible early hominid"],
    ["Australopithecus", "4-2 MYA", "Bipedal, small brain (~400 cc), used tools"],
    ["Homo habilis", "2.5-1.5 MYA", "Handy man, first tool maker (~650 cc brain)"],
    ["Homo erectus", "1.8-0.3 MYA", "Upright man, used fire (~900 cc brain)"],
    ["Homo neanderthalensis", "400,000-40,000 YA", "Large brain (~1400 cc), buried dead"],
    ["Homo sapiens", "300,000 YA - present", "Modern human (~1350 cc brain, language, culture)"],
  ];
  for (let _i67 = 0; _i67 < humanEvoTimeline.length; _i67++) {
    const [species, period, chars] = humanEvoTimeline[_i67];
    qs.push(makeQ("Evolution", "12", `${species}: time period:`, period, humanEvoTimeline[(_i67 + 1) % humanEvoTimeline.length][1], humanEvoTimeline[(_i67 + 2) % humanEvoTimeline.length][1], "present day only", `${species}: ${period}. ${chars}.`));
    qs.push(makeQ("Evolution", "12", `${species}: characteristics:`, chars, humanEvoTimeline[(_i67 + 1) % humanEvoTimeline.length][2], humanEvoTimeline[(_i67 + 2) % humanEvoTimeline.length][2], "fully aquatic with gills", `${species}: ${chars}.`));
  }

  const eras: [string, string, string][] = [
    ["Precambrian", "4.6 BYA - 541 MYA", "Origin of life, prokaryotes, first eukaryotes"],
    ["Paleozoic", "541-252 MYA", "Age of fishes/amphibians, first land plants, Cambrian explosion"],
    ["Mesozoic", "252-66 MYA", "Age of reptiles/dinosaurs, first mammals and birds, gymnosperms"],
    ["Cenozoic", "66 MYA - present", "Age of mammals, angiosperms dominate, human evolution"],
    ["Cambrian period", "541-485 MYA", "Explosion of marine life, trilobites"],
    ["Carboniferous", "359-299 MYA", "Coal forests, first reptiles, giant insects"],
    ["Cretaceous", "145-66 MYA", "Dinosaur extinction (K-T event), first angiosperms"],
    ["Quaternary", "2.6 MYA - present", "Ice ages, human civilization, mass extinction ongoing"],
  ];
  for (let _i68 = 0; _i68 < eras.length; _i68++) {
    const [era, period, events] = eras[_i68];
    qs.push(makeQ("Evolution", "12", `${era}: time period:`, period, eras[(_i68 + 1) % eras.length][1], eras[(_i68 + 2) % eras.length][1], "future", `${era}: ${period}. ${events}.`));
    qs.push(makeQ("Evolution", "12", `${era}: key events:`, events, eras[(_i68 + 1) % eras.length][2], eras[(_i68 + 2) % eras.length][2], "no life existed", `${era}: ${events}.`));
  }

  const evolutionaryEvidence: [string, string, string][] = [
    ["Fossil record", "Preserved remains/traces of ancient organisms", "Shows progression from simple to complex"],
    ["Comparative anatomy", "Homologous and analogous structures", "Common ancestor shown by homology"],
    ["Molecular phylogeny", "DNA/protein sequence comparison", "More similar sequences = more closely related"],
    ["Biogeography", "Distribution of species across continents", "Island species similar to mainland ancestors"],
    ["Embryology", "Similar embryonic development across vertebrates", "Gill slits, tail in all vertebrate embryos"],
    ["Artificial selection", "Human-selected traits in domesticated species", "Dog breeds, crop varieties from wild ancestors"],
    ["Antibiotic resistance", "Evolution in real-time in bacteria", "Natural selection of resistant mutants"],
    ["Industrial melanism", "Peppered moth colour change in polluted areas", "Dark moths survived better on dark trees"],
  ];
  for (let _i69 = 0; _i69 < evolutionaryEvidence.length; _i69++) {
    const [evidence, description, example] = evolutionaryEvidence[_i69];
    qs.push(makeQ("Evolution", "12", `${evidence}:`, description, evolutionaryEvidence[(_i69 + 1) % evolutionaryEvidence.length][1], evolutionaryEvidence[(_i69 + 2) % evolutionaryEvidence.length][1], "divine creation", `${evidence}: ${description}. ${example}.`));
  }

  const immunologyAdvanced: [string, string][] = [
    ["Primary immune response", "Slow (5-7 days), low antibody titre, mainly IgM"],
    ["Secondary immune response", "Fast (1-2 days), high antibody titre, mainly IgG"],
    ["Humoral immunity", "B cells produce antibodies against extracellular pathogens"],
    ["Cell-mediated immunity", "T cells destroy intracellular pathogens and cancer cells"],
    ["MHC I", "Present on all nucleated cells, present endogenous antigens to CD8+ T cells"],
    ["MHC II", "Present on APCs (macrophages, dendritic cells), present to CD4+ T cells"],
    ["Complement system", "Cascade of proteins that lyse pathogens and promote inflammation"],
    ["Opsonization", "Coating of pathogen with antibodies/complement for enhanced phagocytosis"],
    ["Inflammation", "Redness, heat, swelling, pain — innate defence mechanism"],
    ["Fever", "Elevated body temperature, inhibits pathogen growth, enhances immune response"],
    ["IgA", "Found in secretions (saliva, tears, breast milk), mucosal immunity"],
    ["IgE", "Involved in allergic reactions and antiparasitic response, binds mast cells"],
    ["IgM", "First antibody produced, pentameric, activates complement"],
    ["IgD", "Found on B cell surface, functions as receptor"],
    ["Monoclonal antibodies", "Identical antibodies from single B cell clone, used in diagnostics and therapy"],
  ];
  for (let _i70 = 0; _i70 < immunologyAdvanced.length; _i70++) {
    const [concept, def] = immunologyAdvanced[_i70];
    qs.push(makeQ("Human Health & Disease", "12", `${concept}:`, def, immunologyAdvanced[(_i70 + 1) % immunologyAdvanced.length][1], immunologyAdvanced[(_i70 + 2) % immunologyAdvanced.length][1], "no role in immunity", `${concept}: ${def}.`));
  }

  const cancerFacts: [string, string][] = [
    ["Oncogene", "Mutated proto-oncogene that promotes uncontrolled cell growth"],
    ["Tumour suppressor gene", "p53, Rb — normally prevent cancer; mutation leads to cancer"],
    ["Benign tumour", "Non-invasive, encapsulated, does not metastasize"],
    ["Malignant tumour", "Invasive, metastasizes, cancerous"],
    ["Metastasis", "Spread of cancer cells to distant sites via blood/lymph"],
    ["Carcinogen", "Agent causing cancer: chemicals (tobacco), radiation, viruses"],
    ["Biopsy", "Tissue sample examination for cancer diagnosis"],
    ["Chemotherapy", "Anti-cancer drugs that kill rapidly dividing cells"],
    ["Radiation therapy", "Ionising radiation to destroy cancer cells"],
    ["Immunotherapy", "Stimulating immune system to fight cancer"],
  ];
  for (let _i71 = 0; _i71 < cancerFacts.length; _i71++) {
    const [term, def] = cancerFacts[_i71];
    qs.push(makeQ("Human Health & Disease", "12", `${term}:`, def, cancerFacts[(_i71 + 1) % cancerFacts.length][1], cancerFacts[(_i71 + 2) % cancerFacts.length][1], "normal cell function", `${term}: ${def}.`));
  }

  const drugAbuse: [string, string, string][] = [
    ["Opioids (morphine, heroin)", "CNS depressant, pain relief, euphoria", "Highly addictive, respiratory depression"],
    ["Cannabinoids (marijuana)", "Affects cardiovascular system, psychoactive", "From Cannabis sativa"],
    ["Cocaine", "CNS stimulant, dopamine increase", "From Erythroxylum coca, highly addictive"],
    ["Barbiturates", "CNS depressant, sedation, sleep induction", "Hypnotic drugs, overdose can be fatal"],
    ["Amphetamines", "CNS stimulant, increases alertness", "Appetite suppressant, addiction risk"],
    ["LSD", "Hallucinogen, distorts perception", "From Claviceps purpurea (ergot fungus)"],
    ["Tobacco (nicotine)", "Stimulant, addictive, cardiovascular damage", "Lung cancer, COPD, emphysema"],
    ["Alcohol (ethanol)", "CNS depressant, liver cirrhosis", "Most widely abused substance"],
  ];
  for (let _i72 = 0; _i72 < drugAbuse.length; _i72++) {
    const [drug, effect, detail] = drugAbuse[_i72];
    qs.push(makeQ("Human Health & Disease", "12", `${drug}: effect:`, effect, drugAbuse[(_i72 + 1) % drugAbuse.length][1], drugAbuse[(_i72 + 2) % drugAbuse.length][1], "no physiological effect", `${drug}: ${effect}. ${detail}.`));
  }

  const fermentation: [string, string, string][] = [
    ["Beer", "Saccharomyces cerevisiae ferments barley malt", "4-6% alcohol"],
    ["Wine", "Saccharomyces cerevisiae ferments grape juice", "10-15% alcohol"],
    ["Bread", "Yeast produces CO₂ for leavening", "Alcohol evaporates during baking"],
    ["Yoghurt/Curd", "Lactobacillus converts lactose to lactic acid", "Acidic pH coagulates casein"],
    ["Cheese", "Lactobacillus + rennet coagulate milk proteins", "Aged with fungi (Penicillium) for flavour"],
    ["Soy sauce", "Aspergillus oryzae ferments soybeans", "Months of fermentation"],
    ["Idli/Dosa batter", "Leuconostoc mesenteroides fermentation", "CO₂ makes batter fluffy"],
    ["Vinegar", "Acetobacter oxidizes ethanol to acetic acid", "Two-step process: sugar→ethanol→acetic acid"],
    ["Antibiotics", "Penicillium (penicillin), Streptomyces (streptomycin)", "Secondary metabolites of microorganisms"],
    ["Biogas", "Methanobacterium in anaerobic digestion", "CH₄ + CO₂ from animal dung"],
    ["Sewage treatment", "Bacteria decompose organic matter aerobically", "Activated sludge process, BOD reduction"],
    ["Biofertilizer", "Rhizobium, Azotobacter, mycorrhiza", "Fix N₂ or solubilize P for plants"],
  ];
  for (let _i73 = 0; _i73 < fermentation.length; _i73++) {
    const [product, process, detail] = fermentation[_i73];
    qs.push(makeQ("Microorganisms", "12", `${product}: process:`, process, fermentation[(_i73 + 1) % fermentation.length][1], fermentation[(_i73 + 2) % fermentation.length][1], "photosynthesis in chloroplast", `${product}: ${process}. ${detail}.`));
  }

  const lipids: [string, string][] = [
    ["Triglycerides", "3 fatty acids + glycerol, main energy storage in animals"],
    ["Phospholipids", "2 fatty acids + glycerol + phosphate group, cell membrane"],
    ["Steroids", "4-ring structure, cholesterol, hormones (oestrogen, testosterone)"],
    ["Waxes", "Long-chain fatty acid + long-chain alcohol, waterproofing"],
    ["Saturated fatty acids", "No double bonds, solid at RT, animal fats"],
    ["Unsaturated fatty acids", "1+ double bonds, liquid at RT, plant oils"],
    ["Trans fats", "Artificial hydrogenation, linked to heart disease"],
    ["Omega-3 fatty acids", "Essential, anti-inflammatory, found in fish oil"],
    ["Sphingolipids", "Sphingosine backbone, myelin sheath component"],
    ["Glycolipids", "Lipid + carbohydrate, cell surface recognition"],
  ];
  for (let _i74 = 0; _i74 < lipids.length; _i74++) {
    const [type, def] = lipids[_i74];
    qs.push(makeQ("Biomolecules", "11", `${type}:`, def, lipids[(_i74 + 1) % lipids.length][1], lipids[(_i74 + 2) % lipids.length][1], "nucleic acid polymer", `${type}: ${def}.`));
  }

  const proteinStructure: [string, string][] = [
    ["Primary structure", "Linear sequence of amino acids in polypeptide chain"],
    ["Secondary structure", "α-helix and β-pleated sheet, hydrogen bonds between backbone"],
    ["Tertiary structure", "3D folding of polypeptide, disulphide bonds, hydrophobic interactions"],
    ["Quaternary structure", "Multiple polypeptide subunits (e.g., haemoglobin has 4 subunits)"],
    ["Denaturation", "Loss of 3D structure due to heat/pH/chemicals, loss of function"],
    ["Fibrous proteins", "Structural role, insoluble, elongated (keratin, collagen)"],
    ["Globular proteins", "Functional role, soluble, spherical (enzymes, antibodies)"],
    ["Enzyme specificity", "Lock and key model / Induced fit model"],
    ["Competitive inhibition", "Inhibitor competes with substrate for active site"],
    ["Non-competitive inhibition", "Inhibitor binds at allosteric site, changes enzyme shape"],
    ["Coenzyme", "Non-protein organic molecule needed for enzyme function (NAD⁺, FAD)"],
    ["Cofactor", "Inorganic ion needed for enzyme function (Zn²⁺, Mg²⁺, Fe²⁺)"],
  ];
  for (let _i75 = 0; _i75 < proteinStructure.length; _i75++) {
    const [concept, def] = proteinStructure[_i75];
    qs.push(makeQ("Biomolecules", "11", `${concept}:`, def, proteinStructure[(_i75 + 1) % proteinStructure.length][1], proteinStructure[(_i75 + 2) % proteinStructure.length][1], "lipid bilayer structure", `${concept}: ${def}.`));
  }

  const nucleicAcidDifferences: [string, string, string][] = [
    ["Sugar", "Deoxyribose in DNA", "Ribose in RNA"],
    ["Bases", "A, T, G, C in DNA", "A, U, G, C in RNA"],
    ["Strands", "Double-stranded in DNA", "Single-stranded in RNA (usually)"],
    ["Location", "Nucleus (mainly) in DNA", "Cytoplasm + nucleus in RNA"],
    ["Function", "Stores genetic information (DNA)", "Protein synthesis intermediary (RNA)"],
    ["Stability", "More stable (deoxyribose + double helix)", "Less stable (ribose + single strand)"],
    ["Types", "Only one type of DNA", "mRNA, tRNA, rRNA (3 main types)"],
    ["Mutation rate", "Lower in DNA (proof-reading)", "Higher in RNA (no proof-reading)"],
  ];
  for (let _i76 = 0; _i76 < nucleicAcidDifferences.length; _i76++) {
    const [property, dna, rna] = nucleicAcidDifferences[_i76];
    qs.push(makeQ("Molecular Biology", "12", `${property} difference — DNA:`, dna, rna, nucleicAcidDifferences[(_i76 + 1) % nucleicAcidDifferences.length][1], "same in both", `${property}: ${dna} vs ${rna}.`));
    qs.push(makeQ("Molecular Biology", "12", `${property} difference — RNA:`, rna, dna, nucleicAcidDifferences[(_i76 + 1) % nucleicAcidDifferences.length][2], "same in both", `${property}: ${rna} vs ${dna}.`));
  }

  const plantMovements: [string, string, string][] = [
    ["Phototropism", "Growth towards/away from light", "Auxin redistributes to shaded side"],
    ["Geotropism", "Growth in response to gravity", "Roots positively geotropic, shoots negative"],
    ["Hydrotropism", "Growth towards water source", "Roots grow towards moisture"],
    ["Chemotropism", "Growth towards chemicals", "Pollen tube towards ovule"],
    ["Thigmotropism", "Growth in response to touch", "Tendrils of climbers"],
    ["Nastic movements", "Non-directional response to stimulus", "Touch-me-not (Mimosa pudica)"],
    ["Nyctinasty", "Sleep movements", "Prayer plant leaves fold at night"],
    ["Seismonasty", "Response to touch/shock", "Mimosa pudica leaf folding"],
    ["Tactic movements", "Whole organism movement towards/away from stimulus", "Euglena towards light"],
  ];
  for (let _i77 = 0; _i77 < plantMovements.length; _i77++) {
    const [movement, description, example] = plantMovements[_i77];
    qs.push(makeQ("Plant Physiology", "11", `${movement}:`, description, plantMovements[(_i77 + 1) % plantMovements.length][1], plantMovements[(_i77 + 2) % plantMovements.length][1], "no response to any stimulus", `${movement}: ${description}. ${example}.`));
    qs.push(makeQ("Plant Physiology", "11", `Example of ${movement}:`, example, plantMovements[(_i77 + 1) % plantMovements.length][2], plantMovements[(_i77 + 2) % plantMovements.length][2], "fish swimming upstream", `${movement}: ${example}.`));
  }

  const chromosomeNumbers: [string, number][] = [
    ["Human", 46], ["Chimpanzee", 48], ["Dog", 78], ["Cat", 38],
    ["Horse", 64], ["Rat", 42], ["Mouse", 40], ["Frog", 26],
    ["Housefly", 12], ["Onion", 16], ["Rice", 24], ["Wheat", 42],
    ["Pea", 14], ["Potato", 48], ["Maize", 20], ["Fruit fly (Drosophila)", 8],
    ["Tobacco", 48], ["Sugarcane", 80], ["Banana", 22], ["Ophioglossum (fern)", 1260],
  ];
  for (const [organism, n] of chromosomeNumbers) {
    qs.push(makeQ("Genetics & Heredity", "12", `Diploid chromosome number (2n) of ${organism}:`, `${n}`, `${n / 2}`, `${n * 2}`, `${n + 2}`, `${organism}: 2n = ${n}. Haploid (n) = ${n / 2}.`));
  }

  for (let n = 2; n <= 12; n += 2) {
    const gametes = Math.pow(2, n / 2);
    qs.push(makeQ("Genetics & Heredity", "12", `Organism with 2n=${n}. Number of different gamete types:`, `${gametes}`, `${gametes / 2}`, `${n}`, `${gametes * 2}`, `Number of gamete types = 2^n where n = haploid number = ${n / 2}. Types = ${gametes}.`));
  }

  for (let n = 1; n <= 6; n++) {
    const f2 = Math.pow(3, n);
    const pheno = Math.pow(2, n);
    qs.push(makeQ("Genetics & Heredity", "12", `F₂ genotypic classes for ${n}-gene cross:`, `${f2}`, `${pheno}`, `${n * 3}`, `${f2 * 2}`, `For n genes, F₂ genotypes = 3^n = 3^${n} = ${f2}.`));
    qs.push(makeQ("Genetics & Heredity", "12", `F₂ phenotypic classes for ${n}-gene cross (complete dominance):`, `${pheno}`, `${f2}`, `${n}`, `${pheno * 2}`, `For n genes, F₂ phenotypes = 2^n = 2^${n} = ${pheno}.`));
  }

  const lymphaticSystem: [string, string][] = [
    ["Lymph", "Tissue fluid that enters lymphatic vessels, similar to plasma but less protein"],
    ["Lymph nodes", "Filter lymph, contain lymphocytes, swell during infection"],
    ["Spleen", "Largest lymphoid organ, filters blood, recycles old RBCs"],
    ["Thymus", "T lymphocyte maturation, largest in childhood, shrinks with age"],
    ["Tonsils", "Ring of lymphoid tissue in throat, first defence against ingested/inhaled pathogens"],
    ["Peyer's patches", "Lymphoid tissue in small intestine, GALT"],
    ["Bone marrow", "Primary lymphoid organ, B cell maturation, haematopoiesis"],
    ["MALT", "Mucosa-associated lymphoid tissue, lines digestive/respiratory/urogenital tracts"],
    ["Thoracic duct", "Largest lymphatic vessel, drains into left subclavian vein"],
    ["Right lymphatic duct", "Drains right arm, right thorax, right head"],
  ];
  for (let _i78 = 0; _i78 < lymphaticSystem.length; _i78++) {
    const [structure, function_] = lymphaticSystem[_i78];
    qs.push(makeQ("Human Physiology - Circulation", "11", `${structure}:`, function_, lymphaticSystem[(_i78 + 1) % lymphaticSystem.length][1], lymphaticSystem[(_i78 + 2) % lymphaticSystem.length][1], "secretes digestive enzymes", `${structure}: ${function_}.`));
  }

  const ecg: [string, string][] = [
    ["P wave", "Atrial depolarization (contraction)"],
    ["QRS complex", "Ventricular depolarization (contraction)"],
    ["T wave", "Ventricular repolarization (relaxation)"],
    ["P-R interval", "Time from atrial to ventricular depolarization (0.12-0.20 s)"],
    ["ST segment", "Period between ventricular depolarization and repolarization"],
    ["Heart block", "Prolonged P-R interval, AV node conduction delay"],
    ["Atrial fibrillation", "Irregular rapid atrial contraction, no P waves"],
    ["Ventricular tachycardia", "Rapid ventricular rate, wide QRS complex"],
  ];
  for (let _i79 = 0; _i79 < ecg.length; _i79++) {
    const [component, meaning] = ecg[_i79];
    qs.push(makeQ("Human Physiology - Circulation", "11", `ECG — ${component}:`, meaning, ecg[(_i79 + 1) % ecg.length][1], ecg[(_i79 + 2) % ecg.length][1], "liver function test result", `${component}: ${meaning}.`));
  }

  const respiratoryDisorders: [string, string][] = [
    ["Asthma", "Bronchospasm, mucus secretion, triggered by allergens/cold/exercise"],
    ["COPD", "Chronic bronchitis + emphysema, irreversible airflow obstruction"],
    ["Emphysema", "Destruction of alveolar walls, reduced surface area for gas exchange"],
    ["Pneumonia", "Infection of lungs with fluid in alveoli, bacterial/viral"],
    ["Tuberculosis", "Mycobacterium tuberculosis, granulomas in lungs"],
    ["Lung cancer", "Uncontrolled cell growth in lung tissue, mainly from smoking"],
    ["Occupational lung diseases", "Asbestosis, silicosis, from inhaling particles at work"],
    ["Sleep apnea", "Temporary cessation of breathing during sleep"],
  ];
  for (let _i80 = 0; _i80 < respiratoryDisorders.length; _i80++) {
    const [disorder, description] = respiratoryDisorders[_i80];
    qs.push(makeQ("Human Physiology - Breathing", "11", `${disorder}:`, description, respiratoryDisorders[(_i80 + 1) % respiratoryDisorders.length][1], respiratoryDisorders[(_i80 + 2) % respiratoryDisorders.length][1], "kidney stone formation", `${disorder}: ${description}.`));
  }

  const kidneyDisorders: [string, string][] = [
    ["Kidney stones", "Calcium oxalate/phosphate crystals in renal pelvis"],
    ["Glomerulonephritis", "Inflammation of glomeruli, protein/blood in urine"],
    ["Renal failure", "Kidneys unable to filter blood, requires dialysis/transplant"],
    ["Dialysis", "Artificial blood filtration using semipermeable membrane"],
    ["Kidney transplant", "Replacement with healthy donor kidney"],
    ["Urinary tract infection", "Bacterial infection of urethra/bladder/kidneys"],
    ["Nephrotic syndrome", "Massive proteinuria, oedema, hypoalbuminaemia"],
    ["Polycystic kidney", "Inherited, multiple cysts in kidneys"],
  ];
  for (let _i81 = 0; _i81 < kidneyDisorders.length; _i81++) {
    const [disorder, description] = kidneyDisorders[_i81];
    qs.push(makeQ("Human Physiology - Excretion", "11", `${disorder}:`, description, kidneyDisorders[(_i81 + 1) % kidneyDisorders.length][1], kidneyDisorders[(_i81 + 2) % kidneyDisorders.length][1], "normal digestive process", `${disorder}: ${description}.`));
  }

  const neurotransmitters: [string, string][] = [
    ["Acetylcholine", "Neuromuscular junction, parasympathetic NS, memory"],
    ["Dopamine", "Pleasure/reward, movement control, deficiency → Parkinson's"],
    ["Serotonin", "Mood regulation, sleep, appetite, deficiency → depression"],
    ["GABA", "Main inhibitory neurotransmitter in brain"],
    ["Glutamate", "Main excitatory neurotransmitter in brain"],
    ["Noradrenaline", "Alertness, fight-or-flight response, sympathetic NS"],
    ["Endorphins", "Natural painkillers, released during exercise, euphoria"],
    ["Histamine", "Wakefulness, allergic response, gastric acid secretion"],
  ];
  for (let _i82 = 0; _i82 < neurotransmitters.length; _i82++) {
    const [nt, function_] = neurotransmitters[_i82];
    qs.push(makeQ("Human Physiology - Nervous System", "11", `${nt}:`, function_, neurotransmitters[(_i82 + 1) % neurotransmitters.length][1], neurotransmitters[(_i82 + 2) % neurotransmitters.length][1], "structural protein in bone", `${nt}: ${function_}.`));
  }

  const nervousDisorders: [string, string][] = [
    ["Alzheimer's disease", "Progressive memory loss, amyloid plaques, acetylcholine deficiency"],
    ["Parkinson's disease", "Tremors, rigidity, dopamine deficiency in substantia nigra"],
    ["Epilepsy", "Seizures due to abnormal electrical activity in brain"],
    ["Multiple sclerosis", "Autoimmune destruction of myelin sheath, nerve conduction impaired"],
    ["Meningitis", "Inflammation of meninges, bacterial/viral, headache, stiff neck"],
    ["Stroke", "Brain blood supply interrupted (ischaemic) or vessel burst (haemorrhagic)"],
    ["Migraine", "Severe headache with nausea, sensitivity to light/sound"],
    ["Depression", "Mood disorder, serotonin/noradrenaline deficiency"],
  ];
  for (let _i83 = 0; _i83 < nervousDisorders.length; _i83++) {
    const [disorder, description] = nervousDisorders[_i83];
    qs.push(makeQ("Human Physiology - Nervous System", "11", `${disorder}:`, description, nervousDisorders[(_i83 + 1) % nervousDisorders.length][1], nervousDisorders[(_i83 + 2) % nervousDisorders.length][1], "bone fracture", `${disorder}: ${description}.`));
  }

  const endocrineDisorders: [string, string, string][] = [
    ["Diabetes mellitus Type 1", "Autoimmune destruction of beta cells", "Insulin-dependent, juvenile onset"],
    ["Diabetes mellitus Type 2", "Insulin resistance", "Non-insulin-dependent, adult onset, lifestyle-related"],
    ["Goitre", "Enlarged thyroid gland", "Iodine deficiency → less T₃/T₄ → TSH increases → swelling"],
    ["Cretinism", "Congenital hypothyroidism", "Stunted growth, mental retardation in children"],
    ["Myxoedema", "Hypothyroidism in adults", "Puffy face, low BMR, weight gain"],
    ["Graves' disease", "Hyperthyroidism, autoimmune", "Exophthalmos (bulging eyes), high BMR, weight loss"],
    ["Dwarfism", "GH deficiency in childhood", "Proportionate short stature"],
    ["Gigantism", "GH excess in childhood", "Excessive height"],
    ["Acromegaly", "GH excess in adults", "Enlarged hands, feet, jaw"],
    ["Addison's disease", "Adrenal cortex insufficiency", "Low cortisol, dark skin, fatigue"],
    ["Cushing's syndrome", "Excess cortisol", "Moon face, buffalo hump, weight gain"],
    ["Diabetes insipidus", "ADH deficiency", "Excessive dilute urine, extreme thirst"],
  ];
  for (let _i84 = 0; _i84 < endocrineDisorders.length; _i84++) {
    const [disorder, cause, features] = endocrineDisorders[_i84];
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `${disorder}: cause:`, cause, endocrineDisorders[(_i84 + 1) % endocrineDisorders.length][1], endocrineDisorders[(_i84 + 2) % endocrineDisorders.length][1], "excess vitamin C", `${disorder}: ${cause}. ${features}.`));
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `${disorder}: features:`, features, endocrineDisorders[(_i84 + 1) % endocrineDisorders.length][2], endocrineDisorders[(_i84 + 2) % endocrineDisorders.length][2], "no visible symptoms", `${disorder}: ${features}.`));
  }

  const digestiveEnzymes: [string, string, string, string][] = [
    ["Salivary amylase (Ptyalin)", "Mouth (saliva)", "Starch → Maltose", "pH 6.8, inactivated in stomach"],
    ["Pepsin", "Stomach (gastric juice)", "Proteins → Peptones + Proteoses", "pH 1.5-2, activated from pepsinogen by HCl"],
    ["Trypsin", "Small intestine (pancreatic juice)", "Proteins → Peptides", "pH 8, activated from trypsinogen by enterokinase"],
    ["Chymotrypsin", "Small intestine (pancreatic juice)", "Proteins → Peptides", "pH 8, activated from chymotrypsinogen"],
    ["Lipase (pancreatic)", "Small intestine", "Fats → Fatty acids + Glycerol", "Bile salts emulsify fats first"],
    ["Maltase", "Small intestine (succus entericus)", "Maltose → 2 Glucose", "Brush border enzyme"],
    ["Sucrase", "Small intestine", "Sucrose → Glucose + Fructose", "Brush border enzyme"],
    ["Lactase", "Small intestine", "Lactose → Glucose + Galactose", "Deficiency → lactose intolerance"],
    ["Nuclease", "Small intestine (pancreatic)", "Nucleic acids → Nucleotides", "DNase and RNase"],
    ["Enterokinase", "Duodenum", "Trypsinogen → Trypsin", "Activating enzyme, not digestive"],
    ["Rennin", "Stomach (infants)", "Casein → Paracasein", "Milk protein coagulation"],
    ["Carboxypeptidase", "Small intestine (pancreatic)", "Peptides → Amino acids", "Exopeptidase, from C-terminal"],
    ["Aminopeptidase", "Small intestine", "Peptides → Amino acids", "Exopeptidase, from N-terminal"],
    ["Dipeptidase", "Small intestine", "Dipeptides → 2 Amino acids", "Final protein digestion step"],
  ];
  for (let _i85 = 0; _i85 < digestiveEnzymes.length; _i85++) {
    const [enzyme, location, action, note] = digestiveEnzymes[_i85];
    qs.push(makeQ("Human Physiology - Digestion", "11", `${enzyme}: location:`, location, digestiveEnzymes[(_i85 + 1) % digestiveEnzymes.length][1], digestiveEnzymes[(_i85 + 2) % digestiveEnzymes.length][1], "liver", `${enzyme}: ${location}. ${action}.`));
    qs.push(makeQ("Human Physiology - Digestion", "11", `${enzyme}: action:`, action, digestiveEnzymes[(_i85 + 1) % digestiveEnzymes.length][2], digestiveEnzymes[(_i85 + 2) % digestiveEnzymes.length][2], "no catalytic activity", `${enzyme}: ${action}. ${note}.`));
    qs.push(makeQ("Human Physiology - Digestion", "11", `${enzyme}: note:`, note, digestiveEnzymes[(_i85 + 1) % digestiveEnzymes.length][3], digestiveEnzymes[(_i85 + 2) % digestiveEnzymes.length][3], "works at all pH values", `${enzyme}: ${note}.`));
  }

  const digestiveOrgansDetailed: [string, string, string][] = [
    ["Mouth", "Mechanical digestion (mastication) + salivary amylase", "Teeth, tongue, 3 pairs salivary glands"],
    ["Pharynx", "Swallowing (deglutition)", "Epiglottis prevents food entering trachea"],
    ["Oesophagus", "Peristalsis moves food to stomach", "25 cm muscular tube, no digestion"],
    ["Stomach", "HCl + pepsin, protein digestion begins", "Fundus, body, pylorus; pH 1.5-3.5"],
    ["Duodenum", "Bile + pancreatic juice, main digestion site", "First 25 cm of small intestine"],
    ["Jejunum", "Absorption of nutrients", "Middle section of small intestine"],
    ["Ileum", "Absorption continues, Peyer's patches", "Last section, B12 + bile salts absorbed"],
    ["Liver", "Bile production, detoxification, glycogen storage", "Largest gland, ~1.5 kg"],
    ["Gallbladder", "Stores and concentrates bile", "Releases bile via common bile duct"],
    ["Pancreas", "Exocrine (digestive enzymes) + endocrine (insulin)", "Mixed gland, islets of Langerhans"],
    ["Large intestine", "Water + mineral absorption, faeces formation", "Caecum, colon, rectum; 1.5 m"],
    ["Appendix", "Vestigial in humans, lymphoid tissue", "Attached to caecum"],
    ["Rectum", "Stores faeces before defecation", "Last 15-20 cm of large intestine"],
  ];
  for (let _i86 = 0; _i86 < digestiveOrgansDetailed.length; _i86++) {
    const [organ, function_, detail] = digestiveOrgansDetailed[_i86];
    qs.push(makeQ("Human Physiology - Digestion", "11", `${organ}: function:`, function_, digestiveOrgansDetailed[(_i86 + 1) % digestiveOrgansDetailed.length][1], digestiveOrgansDetailed[(_i86 + 2) % digestiveOrgansDetailed.length][1], "gas exchange", `${organ}: ${function_}. ${detail}.`));
    qs.push(makeQ("Human Physiology - Digestion", "11", `${organ}: detail:`, detail, digestiveOrgansDetailed[(_i86 + 1) % digestiveOrgansDetailed.length][2], digestiveOrgansDetailed[(_i86 + 2) % digestiveOrgansDetailed.length][2], "located in thorax", `${organ}: ${detail}.`));
  }

  const vitaminsFull: [string, string, string, string][] = [
    ["Vitamin A (Retinol)", "Vision, skin, immune function", "Carrot, liver, fish oil, milk", "Night blindness, xerophthalmia"],
    ["Vitamin B1 (Thiamine)", "Carbohydrate metabolism, nerve function", "Whole grains, legumes, pork", "Beriberi (wet/dry)"],
    ["Vitamin B2 (Riboflavin)", "FAD coenzyme, energy metabolism", "Milk, eggs, green vegetables", "Cheilosis (cracked lips), glossitis"],
    ["Vitamin B3 (Niacin)", "NAD⁺ coenzyme, redox reactions", "Meat, fish, legumes, groundnut", "Pellagra (3 D's: dermatitis, diarrhoea, dementia)"],
    ["Vitamin B5 (Pantothenic acid)", "Coenzyme A, fatty acid metabolism", "Widely distributed in foods", "Burning feet syndrome"],
    ["Vitamin B6 (Pyridoxine)", "Amino acid metabolism, neurotransmitter synthesis", "Meat, banana, potato, spinach", "Peripheral neuropathy, anaemia"],
    ["Vitamin B7 (Biotin)", "Carboxylation reactions, fatty acid synthesis", "Egg yolk, liver, nuts", "Dermatitis, hair loss"],
    ["Vitamin B9 (Folic acid)", "DNA synthesis, RBC formation", "Green leafy vegetables, liver", "Megaloblastic anaemia, neural tube defects"],
    ["Vitamin B12 (Cobalamin)", "RBC formation, nerve function, DNA synthesis", "Meat, fish, eggs, dairy (not in plants)", "Pernicious anaemia, nerve damage"],
    ["Vitamin C (Ascorbic acid)", "Collagen synthesis, antioxidant, immunity", "Citrus fruits, amla, guava, tomato", "Scurvy (bleeding gums, poor wound healing)"],
    ["Vitamin D (Calciferol)", "Calcium absorption, bone mineralization", "Sunlight, fish oil, egg yolk", "Rickets (children), osteomalacia (adults)"],
    ["Vitamin E (Tocopherol)", "Antioxidant, protects cell membranes", "Vegetable oils, nuts, wheat germ", "Haemolytic anaemia, infertility"],
    ["Vitamin K (Phylloquinone)", "Blood clotting factors synthesis", "Green leafy vegetables, bacteria in gut", "Delayed blood clotting, haemorrhage"],
  ];
  for (let _i87 = 0; _i87 < vitaminsFull.length; _i87++) {
    const [vitamin, function_, source, deficiency] = vitaminsFull[_i87];
    qs.push(makeQ("Human Physiology - Digestion", "11", `${vitamin}: function:`, function_, vitaminsFull[(_i87 + 1) % vitaminsFull.length][1], vitaminsFull[(_i87 + 2) % vitaminsFull.length][1], "no known function", `${vitamin}: ${function_}. Source: ${source}.`));
    qs.push(makeQ("Human Physiology - Digestion", "11", `${vitamin}: dietary source:`, source, vitaminsFull[(_i87 + 1) % vitaminsFull.length][2], vitaminsFull[(_i87 + 2) % vitaminsFull.length][2], "inorganic minerals only", `${vitamin}: ${source}.`));
    qs.push(makeQ("Human Physiology - Digestion", "11", `${vitamin}: deficiency disease:`, deficiency, vitaminsFull[(_i87 + 1) % vitaminsFull.length][3], vitaminsFull[(_i87 + 2) % vitaminsFull.length][3], "no deficiency symptoms", `${vitamin} deficiency: ${deficiency}.`));
  }

  const respiratoryValues: [string, string, string][] = [
    ["Tidal volume (TV)", "~500 mL", "Normal breath volume at rest"],
    ["Inspiratory reserve (IRV)", "~2500-3000 mL", "Extra air inhaled after normal inspiration"],
    ["Expiratory reserve (ERV)", "~1000-1100 mL", "Extra air exhaled after normal expiration"],
    ["Residual volume (RV)", "~1100-1200 mL", "Air remaining after maximal expiration"],
    ["Vital capacity (VC)", "~3500-4500 mL", "TV + IRV + ERV, maximum air exhaled after max inhalation"],
    ["Total lung capacity (TLC)", "~5800 mL", "VC + RV, total air lungs can hold"],
    ["Inspiratory capacity (IC)", "~3500 mL", "TV + IRV"],
    ["Functional residual capacity (FRC)", "~2300 mL", "ERV + RV"],
    ["Respiratory rate", "12-20 breaths/min at rest", "Controlled by medulla oblongata"],
    ["Minute ventilation", "~6000 mL/min", "TV × Respiratory rate = 500 × 12"],
    ["O₂ in inspired air", "~21%", "Atmospheric oxygen percentage"],
    ["O₂ in expired air", "~16%", "5% used by body"],
    ["CO₂ in inspired air", "~0.04%", "Trace amount in atmosphere"],
    ["CO₂ in expired air", "~4%", "Increased from cellular respiration"],
  ];
  for (let _i88 = 0; _i88 < respiratoryValues.length; _i88++) {
    const [parameter, value, note] = respiratoryValues[_i88];
    qs.push(makeQ("Human Physiology - Breathing", "11", `${parameter}:`, value, respiratoryValues[(_i88 + 1) % respiratoryValues.length][1], respiratoryValues[(_i88 + 2) % respiratoryValues.length][1], "0 mL", `${parameter}: ${value}. ${note}.`));
    qs.push(makeQ("Human Physiology - Breathing", "11", `${parameter} — note:`, note, respiratoryValues[(_i88 + 1) % respiratoryValues.length][2], respiratoryValues[(_i88 + 2) % respiratoryValues.length][2], "not applicable to humans", `${parameter}: ${note}.`));
  }

  const nephronParts: [string, string, string][] = [
    ["Bowman's capsule", "Cup-shaped, surrounds glomerulus", "Ultrafiltration of blood → glomerular filtrate"],
    ["Proximal convoluted tubule (PCT)", "Highly coiled, lined with microvilli", "Reabsorption: 65% water, glucose, amino acids, Na⁺, HCO₃⁻"],
    ["Descending loop of Henle", "Thin-walled, permeable to water", "Water reabsorbed by osmosis → concentrate filtrate"],
    ["Ascending loop of Henle", "Thick-walled, impermeable to water", "Active transport of Na⁺, Cl⁻, K⁺ out (dilutes filtrate)"],
    ["Distal convoluted tubule (DCT)", "Coiled, after loop of Henle", "Fine-tuning: Na⁺/K⁺ exchange (aldosterone), Ca²⁺ (PTH)"],
    ["Collecting duct", "Collects from multiple nephrons", "ADH controls water reabsorption → final urine concentration"],
    ["Glomerulus", "Tuft of capillaries, high pressure", "Filtration of blood → proteins and cells remain in blood"],
    ["Afferent arteriole", "Brings blood to glomerulus", "Wider than efferent → maintains high pressure"],
    ["Efferent arteriole", "Takes blood away from glomerulus", "Narrower → maintains filtration pressure"],
    ["Vasa recta", "Capillary network around loop of Henle", "Counter-current exchange, maintains medullary gradient"],
    ["Juxtaglomerular apparatus", "Modified cells at DCT-afferent arteriole junction", "Secretes renin → RAAS → blood pressure regulation"],
  ];
  for (let _i89 = 0; _i89 < nephronParts.length; _i89++) {
    const [part, structure, function_] = nephronParts[_i89];
    qs.push(makeQ("Human Physiology - Excretion", "11", `${part}: structure:`, structure, nephronParts[(_i89 + 1) % nephronParts.length][1], nephronParts[(_i89 + 2) % nephronParts.length][1], "solid bone tissue", `${part}: ${structure}. ${function_}.`));
    qs.push(makeQ("Human Physiology - Excretion", "11", `${part}: function:`, function_, nephronParts[(_i89 + 1) % nephronParts.length][2], nephronParts[(_i89 + 2) % nephronParts.length][2], "hormone secretion only", `${part}: ${function_}.`));
  }

  const brainParts: [string, string, string][] = [
    ["Cerebrum", "Largest part (85%), 2 hemispheres", "Thinking, memory, speech, voluntary actions, sensory processing"],
    ["Cerebellum", "Second largest, posterior fossa", "Coordination, balance, posture, motor learning"],
    ["Medulla oblongata", "Lowest part of brainstem", "Vital centres: respiration, heartbeat, swallowing, vomiting"],
    ["Pons", "Bridge between cerebrum and cerebellum", "Relay between cortex and cerebellum, sleep regulation"],
    ["Midbrain", "Between pons and diencephalon", "Visual/auditory reflexes, substantia nigra (dopamine)"],
    ["Hypothalamus", "Below thalamus, part of diencephalon", "Body temperature, hunger, thirst, circadian rhythm, pituitary control"],
    ["Thalamus", "Relay station in diencephalon", "Relays all sensory signals (except smell) to cortex"],
    ["Corpus callosum", "Band of nerve fibres", "Connects left and right cerebral hemispheres"],
    ["Frontal lobe", "Anterior part of cerebrum", "Reasoning, planning, speech (Broca's area), motor control"],
    ["Parietal lobe", "Top-central cerebrum", "Somatosensory processing, spatial awareness"],
    ["Temporal lobe", "Lateral cerebrum", "Auditory processing, memory (hippocampus), language (Wernicke's area)"],
    ["Occipital lobe", "Posterior cerebrum", "Visual processing, primary visual cortex"],
    ["Limbic system", "Inner border of cerebrum", "Emotions, motivation, memory (amygdala + hippocampus)"],
    ["Spinal cord", "Within vertebral column", "Reflex actions, relay between brain and body"],
  ];
  for (let _i90 = 0; _i90 < brainParts.length; _i90++) {
    const [part, location, function_] = brainParts[_i90];
    qs.push(makeQ("Human Physiology - Nervous System", "11", `${part}: location/description:`, location, brainParts[(_i90 + 1) % brainParts.length][1], brainParts[(_i90 + 2) % brainParts.length][1], "in the abdomen", `${part}: ${location}. Function: ${function_}.`));
    qs.push(makeQ("Human Physiology - Nervous System", "11", `${part}: function:`, function_, brainParts[(_i90 + 1) % brainParts.length][2], brainParts[(_i90 + 2) % brainParts.length][2], "digestion of food", `${part}: ${function_}.`));
  }

  const hormonesFull: [string, string, string][] = [
    ["GH (Growth hormone)", "Anterior pituitary", "Growth, protein synthesis, lipid metabolism"],
    ["TSH", "Anterior pituitary", "Stimulates thyroid to produce T₃/T₄"],
    ["ACTH", "Anterior pituitary", "Stimulates adrenal cortex → cortisol"],
    ["FSH", "Anterior pituitary", "Follicle development (female), spermatogenesis (male)"],
    ["LH", "Anterior pituitary", "Ovulation trigger (female), testosterone (male)"],
    ["Prolactin", "Anterior pituitary", "Milk production in mammary glands"],
    ["ADH (Vasopressin)", "Posterior pituitary (made in hypothalamus)", "Water reabsorption in collecting duct"],
    ["Oxytocin", "Posterior pituitary (made in hypothalamus)", "Uterine contraction, milk ejection"],
    ["T₃ and T₄", "Thyroid gland", "BMR regulation, growth, development"],
    ["Calcitonin", "Thyroid C-cells", "Lowers blood calcium (opposes PTH)"],
    ["PTH (Parathormone)", "Parathyroid glands", "Raises blood calcium (opposes calcitonin)"],
    ["Insulin", "Beta cells of islets of Langerhans (pancreas)", "Lowers blood glucose → glycogenesis"],
    ["Glucagon", "Alpha cells of islets of Langerhans", "Raises blood glucose → glycogenolysis"],
    ["Cortisol", "Adrenal cortex (zona fasciculata)", "Stress response, anti-inflammatory, gluconeogenesis"],
    ["Aldosterone", "Adrenal cortex (zona glomerulosa)", "Na⁺ reabsorption, K⁺ secretion in kidney"],
    ["Adrenaline (Epinephrine)", "Adrenal medulla", "Fight-or-flight: ↑HR, ↑BP, ↑glucose, bronchodilation"],
    ["Testosterone", "Leydig cells of testis", "Male secondary sexual characters, spermatogenesis"],
    ["Oestrogen", "Ovarian follicles (granulosa cells)", "Female secondary sexual characters, endometrial growth"],
    ["Progesterone", "Corpus luteum", "Maintains pregnancy, endometrial secretory phase"],
    ["Melatonin", "Pineal gland", "Circadian rhythm regulation, sleep-wake cycle"],
    ["ANP (Atrial natriuretic peptide)", "Heart atria", "Reduces blood pressure → natriuresis, vasodilation"],
    ["Erythropoietin", "Kidney (juxtaglomerular cells)", "Stimulates RBC production in bone marrow"],
    ["Leptin", "Adipose tissue", "Satiety signal, inhibits hunger"],
    ["Ghrelin", "Stomach", "Hunger hormone, stimulates appetite"],
  ];
  for (let _i91 = 0; _i91 < hormonesFull.length; _i91++) {
    const [hormone, source, function_] = hormonesFull[_i91];
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `${hormone}: secreted by:`, source, hormonesFull[(_i91 + 1) % hormonesFull.length][1], hormonesFull[(_i91 + 2) % hormonesFull.length][1], "salivary glands", `${hormone}: from ${source}. ${function_}.`));
    qs.push(makeQ("Human Physiology - Endocrine System", "11", `${hormone}: function:`, function_, hormonesFull[(_i91 + 1) % hormonesFull.length][2], hormonesFull[(_i91 + 2) % hormonesFull.length][2], "no physiological effect", `${hormone}: ${function_}.`));
  }

  const cellOrganelles: [string, string, string][] = [
    ["Nucleus", "Double membrane, nuclear pores, chromatin", "Contains DNA, controls cell activities, nucleolus makes rRNA"],
    ["Mitochondria", "Double membrane, cristae, own DNA", "Powerhouse: aerobic respiration, ATP synthesis (oxidative phosphorylation)"],
    ["Endoplasmic reticulum (Rough)", "Membrane network with ribosomes", "Protein synthesis and transport"],
    ["Endoplasmic reticulum (Smooth)", "Membrane network without ribosomes", "Lipid synthesis, detoxification, Ca²⁺ storage"],
    ["Golgi apparatus", "Stacked cisternae (dictyosomes)", "Modification, packaging, secretion of proteins; lysosome formation"],
    ["Lysosome", "Single membrane, hydrolytic enzymes", "Intracellular digestion, autophagy; 'suicidal bags of the cell'"],
    ["Ribosome", "No membrane, 2 subunits (60S+40S=80S)", "Protein synthesis (translation of mRNA)"],
    ["Centrosome", "Contains 2 centrioles (9+0 microtubule triplets)", "Spindle formation during cell division"],
    ["Peroxisome", "Single membrane, contains catalase", "H₂O₂ metabolism, fatty acid oxidation"],
    ["Vacuole", "Large in plant cells, small in animal cells", "Turgor pressure, storage, waste disposal"],
    ["Chloroplast", "Double membrane + thylakoids, own DNA (plant cell)", "Photosynthesis: light reactions (thylakoid) + Calvin cycle (stroma)"],
    ["Cell wall", "Cellulose in plants, peptidoglycan in bacteria", "Structural support, protection, shape maintenance"],
    ["Plasma membrane", "Phospholipid bilayer + proteins (fluid mosaic)", "Selective permeability, cell signaling, transport"],
    ["Cytoskeleton", "Microfilaments, microtubules, intermediate filaments", "Cell shape, movement, organelle transport, cell division"],
  ];
  for (let _i92 = 0; _i92 < cellOrganelles.length; _i92++) {
    const [organelle, structure, function_] = cellOrganelles[_i92];
    qs.push(makeQ("Cell Biology", "11", `${organelle}: structure:`, structure, cellOrganelles[(_i92 + 1) % cellOrganelles.length][1], cellOrganelles[(_i92 + 2) % cellOrganelles.length][1], "no membrane structure", `${organelle}: ${structure}. ${function_}.`));
    qs.push(makeQ("Cell Biology", "11", `${organelle}: function:`, function_, cellOrganelles[(_i92 + 1) % cellOrganelles.length][2], cellOrganelles[(_i92 + 2) % cellOrganelles.length][2], "movement of organism", `${organelle}: ${function_}.`));
  }

  const cellDivisionDetailed: [string, string][] = [
    ["Prophase (mitosis)", "Chromatin condenses → chromosomes, centrioles move to poles, spindle forms"],
    ["Metaphase (mitosis)", "Chromosomes align at metaphase plate, attached to spindle fibres at centromere"],
    ["Anaphase (mitosis)", "Centromeres split, sister chromatids move to opposite poles"],
    ["Telophase (mitosis)", "Chromosomes decondense, nuclear envelope reforms, nucleolus reappears"],
    ["Cytokinesis", "Cytoplasm divides: cell plate (plant) or cleavage furrow (animal)"],
    ["Prophase I (meiosis)", "Synapsis, crossing over (recombination), bivalents form, chiasmata visible"],
    ["Metaphase I (meiosis)", "Bivalents align at equator, random orientation of homologous pairs"],
    ["Anaphase I (meiosis)", "Homologous chromosomes separate (NOT sister chromatids), reduction division"],
    ["Telophase I + Cytokinesis I", "Two haploid cells formed, no DNA replication between meiosis I and II"],
    ["Meiosis II", "Similar to mitosis: sister chromatids separate, 4 haploid cells result"],
    ["Significance of mitosis", "Growth, repair, asexual reproduction, maintains chromosome number"],
    ["Significance of meiosis", "Gamete formation, genetic variation (crossing over + independent assortment)"],
    ["Amitosis", "Direct division, no spindle formation, common in prokaryotes"],
    ["S phase", "DNA replication occurs, each chromosome → 2 sister chromatids"],
    ["G1 phase", "Cell growth, protein synthesis, organelle duplication, G1 checkpoint"],
    ["G2 phase", "Preparation for mitosis, centriole replication, final checkpoint"],
  ];
  for (let _i93 = 0; _i93 < cellDivisionDetailed.length; _i93++) {
    const [phase, description] = cellDivisionDetailed[_i93];
    qs.push(makeQ("Cell Biology", "11", `${phase}:`, description, cellDivisionDetailed[(_i93 + 1) % cellDivisionDetailed.length][1], cellDivisionDetailed[(_i93 + 2) % cellDivisionDetailed.length][1], "no cellular changes occur", `${phase}: ${description}.`));
  }

  const photosynthesisDetailed: [string, string, string][] = [
    ["Light reaction — PS II", "Thylakoid membrane", "Water splitting (photolysis): H₂O → 2H⁺ + ½O₂ + 2e⁻ (P680)"],
    ["Light reaction — PS I", "Thylakoid membrane", "NADP⁺ reduction: NADP⁺ + 2H⁺ + 2e⁻ → NADPH (P700)"],
    ["Cyclic photophosphorylation", "PS I only, thylakoid", "Only ATP produced, no NADPH, no O₂ evolved"],
    ["Non-cyclic photophosphorylation", "PS II → PS I", "Both ATP and NADPH produced, O₂ evolved from water"],
    ["Calvin cycle — CO₂ fixation", "Stroma", "CO₂ + RuBP → 2 PGA (3C), enzyme: RuBisCO"],
    ["Calvin cycle — reduction", "Stroma", "PGA → G3P using ATP and NADPH"],
    ["Calvin cycle — regeneration", "Stroma", "G3P → RuBP regenerated, uses ATP"],
    ["C4 pathway", "Mesophyll + bundle sheath", "CO₂ fixed by PEP carboxylase → OAA → malate → bundle sheath (Calvin cycle)"],
    ["CAM pathway", "Succulent plants", "CO₂ fixed at night (stomata open), Calvin cycle by day (stomata closed)"],
    ["Photorespiration", "C3 plants", "RuBisCO fixes O₂ instead of CO₂, wasteful, no ATP produced"],
    ["Chemiosmosis (chloroplast)", "Thylakoid membrane", "H⁺ gradient drives ATP synthase → ATP (photophosphorylation)"],
    ["Chlorophyll a", "Primary pigment, P680/P700", "Directly participates in light reactions"],
    ["Chlorophyll b", "Accessory pigment", "Absorbs light and transfers energy to chlorophyll a"],
    ["Carotenoids", "Accessory pigments (orange/yellow)", "Protect from photooxidation, absorb blue-violet light"],
  ];
  for (let _i94 = 0; _i94 < photosynthesisDetailed.length; _i94++) {
    const [step, location, detail] = photosynthesisDetailed[_i94];
    qs.push(makeQ("Plant Physiology", "11", `${step}: location:`, location, photosynthesisDetailed[(_i94 + 1) % photosynthesisDetailed.length][1], photosynthesisDetailed[(_i94 + 2) % photosynthesisDetailed.length][1], "cytoplasm", `${step}: ${location}. ${detail}.`));
    qs.push(makeQ("Plant Physiology", "11", `${step}: detail:`, detail, photosynthesisDetailed[(_i94 + 1) % photosynthesisDetailed.length][2], photosynthesisDetailed[(_i94 + 2) % photosynthesisDetailed.length][2], "no chemical reaction occurs", `${step}: ${detail}.`));
  }

  const tissueTypes: [string, string, string][] = [
    ["Simple squamous epithelium", "Thin, flat cells, single layer", "Alveoli (gas exchange), blood vessels (endothelium), Bowman's capsule"],
    ["Cuboidal epithelium", "Cube-shaped cells, single layer", "Kidney tubules, thyroid follicles, small ducts"],
    ["Columnar epithelium", "Tall cells, often with goblet cells", "Stomach lining, intestinal lining, gallbladder"],
    ["Ciliated epithelium", "Columnar with cilia", "Trachea, bronchi, fallopian tubes, ventricles of brain"],
    ["Stratified squamous epithelium", "Multiple layers, flat surface cells", "Skin (keratinised), mouth, oesophagus, vagina (non-keratinised)"],
    ["Transitional epithelium", "Stretchy, changes shape", "Urinary bladder, ureters (allows distension)"],
    ["Areolar tissue", "Loose connective, matrix with fibres", "Under skin, around organs, fills spaces"],
    ["Adipose tissue", "Fat storage cells (adipocytes)", "Under skin, around kidneys, cushioning, insulation, energy reserve"],
    ["Dense regular connective", "Parallel collagen fibres", "Tendons (muscle to bone), ligaments (bone to bone)"],
    ["Cartilage (Hyaline)", "Chondrocytes in lacunae, flexible", "Trachea rings, nose tip, articular surfaces of joints"],
    ["Bone (Osseous tissue)", "Hard matrix (calcium salts + collagen)", "Haversian system with osteocytes, structural support"],
    ["Blood", "Fluid connective tissue", "Plasma + RBC + WBC + platelets, transport + immunity"],
    ["Skeletal muscle", "Striated, voluntary, multinucleate", "Attached to bones, conscious movements"],
    ["Smooth muscle", "Non-striated, involuntary, spindle-shaped", "Gut wall, blood vessels, uterus, iris"],
    ["Cardiac muscle", "Striated, involuntary, intercalated discs", "Heart wall only, rhythmic contraction, branched"],
    ["Nervous tissue", "Neurons + neuroglia", "Impulse transmission, brain, spinal cord, nerves"],
  ];
  for (let _i95 = 0; _i95 < tissueTypes.length; _i95++) {
    const [tissue, structure, location] = tissueTypes[_i95];
    qs.push(makeQ("Animal Tissues", "11", `${tissue}: structure:`, structure, tissueTypes[(_i95 + 1) % tissueTypes.length][1], tissueTypes[(_i95 + 2) % tissueTypes.length][1], "single large cell", `${tissue}: ${structure}. Found in: ${location}.`));
    qs.push(makeQ("Animal Tissues", "11", `${tissue}: location/example:`, location, tissueTypes[(_i95 + 1) % tissueTypes.length][2], tissueTypes[(_i95 + 2) % tissueTypes.length][2], "found only in plants", `${tissue}: ${location}.`));
  }

  const animalPhyla: [string, string, string][] = [
    ["Porifera", "Pore-bearing, sessile, spicules/spongin, canal system", "Sycon, Spongilla, Euspongia (bath sponge)"],
    ["Cnidaria (Coelenterata)", "Cnidocytes, radial symmetry, gastrovascular cavity, polyp/medusa", "Hydra, Jellyfish, Coral, Sea anemone"],
    ["Platyhelminthes", "Flat worms, bilateral symmetry, acoelomate, parasitic/free-living", "Planaria, Taenia (tapeworm), Fasciola (liver fluke)"],
    ["Nematoda (Aschelminthes)", "Round worms, pseudocoelomate, complete digestive tract", "Ascaris, Wuchereria (filariasis), Ancylostoma (hookworm)"],
    ["Annelida", "Segmented worms, true coelom, closed circulation", "Earthworm (Pheretima), Leech (Hirudinaria), Nereis"],
    ["Arthropoda", "Jointed legs, exoskeleton (chitin), open circulation, largest phylum", "Insecta, Arachnida, Crustacea, Myriapoda"],
    ["Mollusca", "Soft body, mantle, shell (often), open circulation (except cephalopods)", "Snail, Octopus, Squid, Mussel, Oyster"],
    ["Echinodermata", "Spiny skin, water vascular system, radial symmetry (adult), endoskeleton", "Starfish, Sea urchin, Sea cucumber, Brittle star"],
    ["Hemichordata", "Proboscis-collar-trunk, gill slits", "Balanoglossus (acorn worm)"],
    ["Chordata", "Notochord, dorsal nerve cord, pharyngeal gill slits, post-anal tail", "All vertebrates + tunicates + lancelets"],
  ];
  for (let _i96 = 0; _i96 < animalPhyla.length; _i96++) {
    const [phylum, chars, examples] = animalPhyla[_i96];
    qs.push(makeQ("Animal Kingdom", "11", `Phylum ${phylum}: characteristics:`, chars, animalPhyla[(_i96 + 1) % animalPhyla.length][1], animalPhyla[(_i96 + 2) % animalPhyla.length][1], "endoskeleton of calcium", `${phylum}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Animal Kingdom", "11", `Examples of phylum ${phylum}:`, examples, animalPhyla[(_i96 + 1) % animalPhyla.length][2], animalPhyla[(_i96 + 2) % animalPhyla.length][2], "only microscopic organisms", `${phylum}: ${examples}.`));
  }

  const humanDiseases: [string, string, string, string][] = [
    ["Malaria", "Plasmodium (vivax/falciparum)", "Female Anopheles mosquito", "Fever (periodic), chills, anaemia, splenomegaly"],
    ["Dengue", "Dengue virus (Flavivirus)", "Aedes aegypti mosquito", "High fever, joint pain (breakbone fever), haemorrhagic"],
    ["Typhoid", "Salmonella typhi", "Contaminated food/water", "Sustained fever, intestinal ulceration, Widal test"],
    ["Cholera", "Vibrio cholerae", "Contaminated water", "Severe diarrhoea (rice-water stools), dehydration"],
    ["Tuberculosis", "Mycobacterium tuberculosis", "Airborne droplets", "Persistent cough, weight loss, night sweats, Mantoux test"],
    ["Pneumonia", "Streptococcus pneumoniae", "Airborne droplets", "Lung infection, fever, cough, fluid in alveoli"],
    ["Amoebiasis", "Entamoeba histolytica", "Contaminated food/water", "Dysentery, abdominal cramps, liver abscess"],
    ["Filariasis (Elephantiasis)", "Wuchereria bancrofti", "Culex mosquito", "Lymphatic blockage, swelling of limbs"],
    ["Ringworm", "Microsporum, Trichophyton (fungi)", "Direct contact, fomites", "Circular itchy patches on skin/scalp/nails"],
    ["Common cold", "Rhinovirus", "Airborne droplets, contact", "Nasal congestion, sneezing, sore throat"],
    ["Chickenpox", "Varicella-zoster virus", "Airborne/contact", "Itchy rash with fluid-filled vesicles"],
    ["Rabies", "Rabies virus (Lyssavirus)", "Bite of infected animal", "Hydrophobia, fatal encephalitis if untreated"],
    ["Hepatitis B", "Hepatitis B virus", "Blood, sexual contact, vertical", "Liver inflammation, jaundice, can become chronic"],
    ["Ascariasis", "Ascaris lumbricoides (roundworm)", "Contaminated food/soil", "Intestinal obstruction, malnutrition in children"],
    ["Leishmaniasis (Kala-azar)", "Leishmania donovani", "Sandfly bite", "Fever, enlarged spleen/liver, weight loss"],
  ];
  for (let _i97 = 0; _i97 < humanDiseases.length; _i97++) {
    const [disease, pathogen, transmission, symptoms] = humanDiseases[_i97];
    qs.push(makeQ("Human Health & Disease", "12", `${disease}: pathogen:`, pathogen, humanDiseases[(_i97 + 1) % humanDiseases.length][1], humanDiseases[(_i97 + 2) % humanDiseases.length][1], "no pathogen, genetic disorder", `${disease}: ${pathogen}. Transmitted by ${transmission}.`));
    qs.push(makeQ("Human Health & Disease", "12", `${disease}: transmitted by:`, transmission, humanDiseases[(_i97 + 1) % humanDiseases.length][2], humanDiseases[(_i97 + 2) % humanDiseases.length][2], "inherited from parents", `${disease}: ${transmission}.`));
    qs.push(makeQ("Human Health & Disease", "12", `${disease}: symptoms:`, symptoms, humanDiseases[(_i97 + 1) % humanDiseases.length][3], humanDiseases[(_i97 + 2) % humanDiseases.length][3], "no symptoms at all", `${disease}: ${symptoms}.`));
  }

  const geneticDisorders: [string, string, string][] = [
    ["Down syndrome", "Trisomy 21 (47 chromosomes)", "Intellectual disability, characteristic facial features, short stature"],
    ["Turner syndrome", "45,X (monosomy X, female)", "Short stature, webbed neck, infertility, no secondary sexual characters"],
    ["Klinefelter syndrome", "47,XXY (male)", "Tall, gynaecomastia, infertility, reduced testosterone"],
    ["Sickle cell anaemia", "Autosomal recessive, HbS mutation (Glu→Val in β-globin)", "Sickle-shaped RBCs, anaemia, pain crises, heterozygote advantage (malaria)"],
    ["Thalassemia", "Autosomal recessive, reduced globin chain synthesis", "Anaemia, splenomegaly, requires transfusions"],
    ["Haemophilia", "X-linked recessive, factor VIII (A) or IX (B) deficiency", "Prolonged bleeding, mainly affects males"],
    ["Colour blindness", "X-linked recessive, cone deficiency", "Cannot distinguish red-green (most common)"],
    ["Phenylketonuria (PKU)", "Autosomal recessive, phenylalanine hydroxylase deficiency", "Mental retardation if untreated, fair skin, musty odour"],
    ["Cystic fibrosis", "Autosomal recessive, CFTR gene mutation", "Thick mucus in lungs/pancreas, recurrent infections"],
    ["Huntington's disease", "Autosomal dominant, CAG repeat expansion", "Late-onset neurodegeneration, chorea, dementia"],
    ["Albinism", "Autosomal recessive, tyrosinase deficiency", "No melanin, white skin/hair, pink eyes, photosensitive"],
    ["Duchenne muscular dystrophy", "X-linked recessive, dystrophin absent", "Progressive muscle wasting, wheelchair by teens"],
  ];
  for (let _i98 = 0; _i98 < geneticDisorders.length; _i98++) {
    const [disorder, genetics, features] = geneticDisorders[_i98];
    qs.push(makeQ("Genetics & Heredity", "12", `${disorder}: genetic basis:`, genetics, geneticDisorders[(_i98 + 1) % geneticDisorders.length][1], geneticDisorders[(_i98 + 2) % geneticDisorders.length][1], "environmental factor only", `${disorder}: ${genetics}. ${features}.`));
    qs.push(makeQ("Genetics & Heredity", "12", `${disorder}: features:`, features, geneticDisorders[(_i98 + 1) % geneticDisorders.length][2], geneticDisorders[(_i98 + 2) % geneticDisorders.length][2], "no clinical symptoms", `${disorder}: ${features}.`));
  }

  const plantTissues: [string, string, string][] = [
    ["Meristematic - Apical", "Growing tips of roots and shoots", "Primary growth (length), actively dividing cells"],
    ["Meristematic - Lateral", "Cambium (vascular + cork)", "Secondary growth (girth), produces secondary xylem/phloem"],
    ["Meristematic - Intercalary", "Base of leaves and internodes", "Internode elongation, found in grasses/monocots"],
    ["Parenchyma", "Thin-walled, living, large vacuole", "Storage, photosynthesis (chlorenchyma), buoyancy (aerenchyma)"],
    ["Collenchyma", "Thickened corners (pectin/cellulose), living", "Flexible support in young stems, petioles"],
    ["Sclerenchyma", "Thick lignified walls, dead at maturity", "Rigid support (fibres in jute/hemp, sclereids in nut shell)"],
    ["Xylem - Tracheids", "Elongated cells with tapered ends, dead", "Water conduction in gymnosperms mainly"],
    ["Xylem - Vessels", "Wide tubes, end walls perforated, dead", "Efficient water conduction in angiosperms"],
    ["Phloem - Sieve tubes", "Living cells, no nucleus, sieve plates", "Translocation of food (sucrose) from source to sink"],
    ["Phloem - Companion cells", "Living, with nucleus, assist sieve tubes", "Provide energy and proteins to sieve elements"],
    ["Epidermis", "Single layer of cells, cuticle outside", "Protection, stomata for gas exchange, root hairs for absorption"],
    ["Cork (Phellem)", "Dead cells, suberised walls", "Prevents water loss, protection in woody plants"],
  ];
  for (let _i99 = 0; _i99 < plantTissues.length; _i99++) {
    const [tissue, structure, function_] = plantTissues[_i99];
    qs.push(makeQ("Plant Anatomy", "11", `${tissue}: structure:`, structure, plantTissues[(_i99 + 1) % plantTissues.length][1], plantTissues[(_i99 + 2) % plantTissues.length][1], "hard calcified matrix", `${tissue}: ${structure}. ${function_}.`));
    qs.push(makeQ("Plant Anatomy", "11", `${tissue}: function:`, function_, plantTissues[(_i99 + 1) % plantTissues.length][2], plantTissues[(_i99 + 2) % plantTissues.length][2], "blood circulation", `${tissue}: ${function_}.`));
  }

  const maleReproSystem: [string, string][] = [
    ["Testis", "Primary sex organ, produces sperm (seminiferous tubules) and testosterone (Leydig cells)"],
    ["Seminiferous tubules", "Site of spermatogenesis, lined with Sertoli cells and spermatogonia"],
    ["Sertoli cells", "Nurse cells, nourish developing sperm, secrete inhibin"],
    ["Leydig cells", "Interstitial cells, produce testosterone under LH stimulation"],
    ["Epididymis", "Coiled tube on testis surface, sperm maturation and storage"],
    ["Vas deferens", "Muscular duct, transports sperm from epididymis to ejaculatory duct"],
    ["Seminal vesicle", "Secretes fructose-rich alkaline fluid (~60% of semen volume)"],
    ["Prostate gland", "Secretes slightly acidic fluid with enzymes, citric acid (~30% semen)"],
    ["Bulbourethral (Cowper's) gland", "Secretes pre-ejaculatory fluid, lubricates urethra"],
    ["Scrotum", "External sac, maintains testis 2-3°C below body temperature for spermatogenesis"],
  ];
  for (let _i100 = 0; _i100 < maleReproSystem.length; _i100++) {
    const [structure, function_] = maleReproSystem[_i100];
    qs.push(makeQ("Reproduction", "12", `Male reproductive: ${structure}:`, function_, maleReproSystem[(_i100 + 1) % maleReproSystem.length][1], maleReproSystem[(_i100 + 2) % maleReproSystem.length][1], "produces eggs", `${structure}: ${function_}.`));
  }

  const femaleReproSystem: [string, string][] = [
    ["Ovary", "Primary sex organ, produces eggs (oogenesis) and hormones (oestrogen, progesterone)"],
    ["Fallopian tube (Oviduct)", "Site of fertilisation (ampulla), ciliated epithelium moves egg towards uterus"],
    ["Uterus", "Pear-shaped muscular organ, implantation and fetal development"],
    ["Endometrium", "Inner lining of uterus, shed during menstruation, site of implantation"],
    ["Myometrium", "Muscular layer of uterus, contracts during labour (oxytocin-stimulated)"],
    ["Cervix", "Narrow opening of uterus into vagina, dilates during labour"],
    ["Vagina", "Birth canal, copulatory organ, acidic pH (lactobacilli)"],
    ["Graafian follicle", "Mature ovarian follicle, contains secondary oocyte, bursts at ovulation"],
    ["Corpus luteum", "Remnant of Graafian follicle after ovulation, secretes progesterone"],
    ["Mammary gland", "Modified sweat gland, milk production (prolactin) and ejection (oxytocin)"],
  ];
  for (let _i101 = 0; _i101 < femaleReproSystem.length; _i101++) {
    const [structure, function_] = femaleReproSystem[_i101];
    qs.push(makeQ("Reproduction", "12", `Female reproductive: ${structure}:`, function_, femaleReproSystem[(_i101 + 1) % femaleReproSystem.length][1], femaleReproSystem[(_i101 + 2) % femaleReproSystem.length][1], "produces sperm", `${structure}: ${function_}.`));
  }

  const menstrualCycle: [string, string, string][] = [
    ["Menstrual phase", "Days 1-5", "Endometrium sheds, bleeding, low oestrogen/progesterone"],
    ["Follicular phase", "Days 1-13", "FSH stimulates follicle growth, rising oestrogen, endometrium regenerates"],
    ["Ovulation", "Day 14 (approx)", "LH surge triggers release of secondary oocyte from Graafian follicle"],
    ["Luteal phase", "Days 15-28", "Corpus luteum secretes progesterone, endometrium thickens/vascularises"],
    ["If fertilisation occurs", "After day 14", "hCG from trophoblast maintains corpus luteum → progesterone continues"],
    ["If no fertilisation", "Day 28", "Corpus luteum degenerates → progesterone drops → menstruation begins again"],
  ];
  for (let _i102 = 0; _i102 < menstrualCycle.length; _i102++) {
    const [phase, timing, events] = menstrualCycle[_i102];
    qs.push(makeQ("Reproduction", "12", `Menstrual cycle — ${phase}: timing:`, timing, menstrualCycle[(_i102 + 1) % menstrualCycle.length][1], menstrualCycle[(_i102 + 2) % menstrualCycle.length][1], "no specific timing", `${phase}: ${timing}. ${events}.`));
    qs.push(makeQ("Reproduction", "12", `Menstrual cycle — ${phase}: events:`, events, menstrualCycle[(_i102 + 1) % menstrualCycle.length][2], menstrualCycle[(_i102 + 2) % menstrualCycle.length][2], "spermatogenesis begins", `${phase}: ${events}.`));
  }

  const bloodGroups: [string, string, string, string][] = [
    ["A", "A antigen on RBC", "Anti-B antibodies in plasma", "Can receive from A and O"],
    ["B", "B antigen on RBC", "Anti-A antibodies in plasma", "Can receive from B and O"],
    ["AB", "Both A and B antigens", "No antibodies (universal recipient)", "Can receive from A, B, AB, O"],
    ["O", "No antigens on RBC", "Both anti-A and anti-B (universal donor)", "Can receive from O only"],
  ];
  for (let _i103 = 0; _i103 < bloodGroups.length; _i103++) {
    const [group, antigen, antibody, compatibility] = bloodGroups[_i103];
    qs.push(makeQ("Human Physiology - Circulation", "11", `Blood group ${group}: antigens:`, antigen, bloodGroups[(_i103 + 1) % bloodGroups.length][1], bloodGroups[(_i103 + 2) % bloodGroups.length][1], "no antigens or antibodies", `Group ${group}: ${antigen}. ${antibody}.`));
    qs.push(makeQ("Human Physiology - Circulation", "11", `Blood group ${group}: antibodies:`, antibody, bloodGroups[(_i103 + 1) % bloodGroups.length][2], bloodGroups[(_i103 + 2) % bloodGroups.length][2], "all antibodies present", `Group ${group}: ${antibody}.`));
    qs.push(makeQ("Human Physiology - Circulation", "11", `Blood group ${group}: compatibility:`, compatibility, bloodGroups[(_i103 + 1) % bloodGroups.length][3], bloodGroups[(_i103 + 2) % bloodGroups.length][3], "can receive from none", `Group ${group}: ${compatibility}.`));
  }

  const photosynthesisFactors: [string, string][] = [
    ["Light intensity", "Rate increases linearly then plateaus (light saturation point)"],
    ["CO₂ concentration", "Rate increases with CO₂ up to a point; normally limiting at 0.03%"],
    ["Temperature", "Rate increases to optimum (25-35°C), then decreases (enzyme denaturation)"],
    ["Water", "Essential reactant; deficiency closes stomata → reduces CO₂ entry"],
    ["Chlorophyll content", "More chlorophyll → more light absorption → higher rate"],
    ["Blackman's law of limiting factors", "Rate determined by factor nearest its minimum value"],
    ["Action spectrum", "Shows rate of photosynthesis at each wavelength; peaks in blue and red"],
    ["Absorption spectrum", "Shows light absorbed by each pigment; chlorophyll absorbs blue and red"],
  ];
  for (let _i104 = 0; _i104 < photosynthesisFactors.length; _i104++) {
    const [factor, effect] = photosynthesisFactors[_i104];
    qs.push(makeQ("Plant Physiology", "11", `Photosynthesis — ${factor}:`, effect, photosynthesisFactors[(_i104 + 1) % photosynthesisFactors.length][1], photosynthesisFactors[(_i104 + 2) % photosynthesisFactors.length][1], "no effect on photosynthesis", `${factor}: ${effect}.`));
  }

  const plantHormonesDetailed: [string, string, string][] = [
    ["Auxin (IAA)", "Shoot tip, developing leaves", "Cell elongation, phototropism, apical dominance, root initiation"],
    ["Gibberellin (GA₃)", "Young leaves, root tips, seeds", "Stem elongation, seed germination, bolting, fruit development"],
    ["Cytokinin (Zeatin)", "Root tips, developing fruits", "Cell division, delays senescence, promotes lateral bud growth"],
    ["Abscisic acid (ABA)", "Leaves, stems, unripe fruits", "Stress hormone: stomatal closure, dormancy, inhibits growth"],
    ["Ethylene (C₂H₄)", "Ripening fruits, senescing tissues", "Fruit ripening, leaf abscission, senescence, triple response"],
  ];
  for (let _i105 = 0; _i105 < plantHormonesDetailed.length; _i105++) {
    const [hormone, source, functions] = plantHormonesDetailed[_i105];
    qs.push(makeQ("Plant Physiology", "11", `${hormone}: produced in:`, source, plantHormonesDetailed[(_i105 + 1) % plantHormonesDetailed.length][1], plantHormonesDetailed[(_i105 + 2) % plantHormonesDetailed.length][1], "pituitary gland", `${hormone}: ${source}. Functions: ${functions}.`));
    qs.push(makeQ("Plant Physiology", "11", `${hormone}: functions:`, functions, plantHormonesDetailed[(_i105 + 1) % plantHormonesDetailed.length][2], plantHormonesDetailed[(_i105 + 2) % plantHormonesDetailed.length][2], "blood pressure regulation", `${hormone}: ${functions}.`));
  }

  const nitrogenMetabolism: [string, string, string][] = [
    ["Biological nitrogen fixation", "N₂ → NH₃ by nitrogenase enzyme", "Rhizobium (symbiotic), Azotobacter/Azospirillum (free-living), Anabaena/Nostoc (cyanobacteria)"],
    ["Ammonification", "Organic N → NH₃ by decomposers", "Dead organisms, excretory products decomposed by bacteria/fungi"],
    ["Nitrification", "NH₃ → NO₂⁻ → NO₃⁻", "Nitrosomonas (NH₃→NO₂⁻), Nitrobacter (NO₂⁻→NO₃⁻), aerobic"],
    ["Nitrate assimilation", "NO₃⁻ → NO₂⁻ → NH₃ → amino acids", "Nitrate reductase and nitrite reductase in plants"],
    ["Denitrification", "NO₃⁻ → N₂O → N₂", "Pseudomonas, Thiobacillus, anaerobic, returns N₂ to atmosphere"],
    ["Leghemoglobin", "O₂ scavenger in root nodules", "Protects nitrogenase from O₂ (pink pigment)"],
    ["Nitrogenase", "Enzyme that reduces N₂ to NH₃", "Requires anaerobic conditions, 16 ATP per N₂ fixed"],
    ["Glutamine synthetase", "NH₃ + glutamate → glutamine", "Primary ammonia assimilation pathway"],
  ];
  for (let _i106 = 0; _i106 < nitrogenMetabolism.length; _i106++) {
    const [process, reaction, detail] = nitrogenMetabolism[_i106];
    qs.push(makeQ("Plant Physiology", "11", `${process}: reaction:`, reaction, nitrogenMetabolism[(_i106 + 1) % nitrogenMetabolism.length][1], nitrogenMetabolism[(_i106 + 2) % nitrogenMetabolism.length][1], "protein denaturation", `${process}: ${reaction}. ${detail}.`));
    qs.push(makeQ("Plant Physiology", "11", `${process}: detail:`, detail, nitrogenMetabolism[(_i106 + 1) % nitrogenMetabolism.length][2], nitrogenMetabolism[(_i106 + 2) % nitrogenMetabolism.length][2], "only occurs in animals", `${process}: ${detail}.`));
  }

  const ecologyCalculations: { question: string; answer: string; distractors: [string, string, string]; explanation: string }[] = [];
  for (let producers = 1000; producers <= 10000; producers += 1000) {
    const primary = producers * 0.1;
    const secondary = primary * 0.1;
    const tertiary = secondary * 0.1;
    ecologyCalculations.push({
      question: `10% rule: Producers have ${producers} kcal. Energy at primary consumer level:`,
      answer: `${primary} kcal`,
      distractors: [`${producers} kcal`, `${secondary} kcal`, `${producers * 0.5} kcal`],
      explanation: `10% law: ${producers} × 0.1 = ${primary} kcal at primary consumer.`
    });
    ecologyCalculations.push({
      question: `10% rule: Producers have ${producers} kcal. Energy at secondary consumer level:`,
      answer: `${secondary} kcal`,
      distractors: [`${primary} kcal`, `${tertiary} kcal`, `${producers} kcal`],
      explanation: `10% law: ${producers} × 0.1 × 0.1 = ${secondary} kcal at secondary consumer.`
    });
    ecologyCalculations.push({
      question: `10% rule: Producers have ${producers} kcal. Energy at tertiary consumer level:`,
      answer: `${tertiary} kcal`,
      distractors: [`${secondary} kcal`, `${primary} kcal`, `${producers * 0.01} kcal`],
      explanation: `10% law: ${producers} × 0.1³ = ${tertiary} kcal at tertiary consumer.`
    });
  }
  for (const calc of ecologyCalculations) {
    qs.push(makeQ("Ecology", "12", calc.question, calc.answer, calc.distractors[0], calc.distractors[1], calc.distractors[2], calc.explanation));
  }

  const biomoleculeTests: [string, string, string][] = [
    ["Iodine test", "Starch", "Blue-black colour with I₂/KI solution"],
    ["Benedict's test", "Reducing sugars (glucose, maltose)", "Blue → green → orange → red precipitate on heating"],
    ["Biuret test", "Proteins (peptide bonds)", "Blue → violet/purple with NaOH + CuSO₄"],
    ["Sudan III/IV test", "Lipids/fats", "Red-stained fat droplets"],
    ["Ninhydrin test", "Amino acids", "Purple/blue colour (proline gives yellow)"],
    ["Molisch's test", "All carbohydrates", "Purple ring at junction with conc. H₂SO₄"],
    ["Seliwanoff's test", "Ketoses (fructose)", "Cherry red colour with resorcinol + HCl"],
    ["Barfoed's test", "Monosaccharides vs disaccharides", "Monosaccharides react faster (Cu²⁺ reduction)"],
    ["Fehling's test", "Reducing sugars/aldehydes", "Blue → red precipitate (Cu₂O) on heating"],
    ["Millon's test", "Tyrosine-containing proteins", "White precipitate turns red on heating"],
    ["Xanthoproteic test", "Aromatic amino acids (Tyr, Trp, Phe)", "Yellow colour → orange with NaOH (conc. HNO₃)"],
    ["Dische's test (Diphenylamine)", "DNA (deoxyribose sugar)", "Blue colour"],
    ["Orcinol test", "RNA (ribose sugar)", "Green colour with orcinol + FeCl₃ + HCl"],
  ];
  for (let _i107 = 0; _i107 < biomoleculeTests.length; _i107++) {
    const [test, detects, result] = biomoleculeTests[_i107];
    qs.push(makeQ("Biomolecules", "11", `${test}: detects:`, detects, biomoleculeTests[(_i107 + 1) % biomoleculeTests.length][1], biomoleculeTests[(_i107 + 2) % biomoleculeTests.length][1], "nucleic acids only", `${test}: detects ${detects}. ${result}.`));
    qs.push(makeQ("Biomolecules", "11", `${test}: result:`, result, biomoleculeTests[(_i107 + 1) % biomoleculeTests.length][2], biomoleculeTests[(_i107 + 2) % biomoleculeTests.length][2], "no colour change", `${test}: ${result}.`));
  }

  const immuneDefence: [string, string, string][] = [
    ["Physical barrier — Skin", "First line of defence", "Keratinised layer, acidic pH (sebum), normal flora"],
    ["Physical barrier — Mucous membrane", "First line of defence", "Traps pathogens in mucus, ciliated epithelium in respiratory tract"],
    ["Chemical barrier — Lysozyme", "First line of defence", "Enzyme in tears, saliva, nasal secretions; breaks bacterial cell wall"],
    ["Chemical barrier — HCl", "First line of defence", "Stomach acid kills most ingested pathogens (pH 1.5-3.5)"],
    ["Phagocytosis", "Second line (innate)", "Neutrophils and macrophages engulf and destroy pathogens"],
    ["Natural killer (NK) cells", "Second line (innate)", "Kill virus-infected cells and tumour cells without prior sensitization"],
    ["Interferon", "Second line (innate)", "Proteins released by virus-infected cells, protect neighbouring cells"],
    ["B lymphocytes", "Third line (adaptive)", "Produce antibodies (humoral immunity), differentiate into plasma cells"],
    ["T helper cells (CD4+)", "Third line (adaptive)", "Activate B cells and cytotoxic T cells, release cytokines"],
    ["Cytotoxic T cells (CD8+)", "Third line (adaptive)", "Kill virus-infected cells and cancer cells (cell-mediated immunity)"],
    ["Memory cells", "Third line (adaptive)", "Long-lived B/T cells, rapid response on re-exposure (secondary response)"],
    ["Active immunity", "Acquired immunity", "Body makes own antibodies (natural: infection, artificial: vaccination)"],
    ["Passive immunity", "Acquired immunity", "Pre-formed antibodies received (natural: placenta/breast milk, artificial: antiserum)"],
    ["Vaccination", "Artificial active immunity", "Weakened/killed pathogen or antigen fragments → immune memory"],
  ];
  for (let _i108 = 0; _i108 < immuneDefence.length; _i108++) {
    const [component, category, detail] = immuneDefence[_i108];
    qs.push(makeQ("Human Health & Disease", "12", `${component}: category:`, category, immuneDefence[(_i108 + 1) % immuneDefence.length][1], immuneDefence[(_i108 + 2) % immuneDefence.length][1], "not part of immune system", `${component}: ${category}. ${detail}.`));
    qs.push(makeQ("Human Health & Disease", "12", `${component}: detail:`, detail, immuneDefence[(_i108 + 1) % immuneDefence.length][2], immuneDefence[(_i108 + 2) % immuneDefence.length][2], "no role in defence", `${component}: ${detail}.`));
  }

  const microorganismTypes: [string, string, string][] = [
    ["Bacteria", "Prokaryotic, cell wall (peptidoglycan), binary fission", "E. coli, Streptococcus, Lactobacillus, Rhizobium"],
    ["Virus", "Non-cellular, obligate intracellular parasite, DNA or RNA", "TMV, HIV, Influenza, Bacteriophage"],
    ["Fungi", "Eukaryotic, cell wall (chitin), heterotrophic", "Yeast, Penicillium, Aspergillus, Agaricus (mushroom)"],
    ["Protozoa", "Eukaryotic, unicellular, motile, heterotrophic", "Amoeba, Plasmodium, Paramecium, Trypanosoma"],
    ["Algae", "Eukaryotic, photosynthetic, aquatic", "Spirogyra, Chlorella, Chlamydomonas, Diatoms"],
  ];
  for (let _i109 = 0; _i109 < microorganismTypes.length; _i109++) {
    const [type, chars, examples] = microorganismTypes[_i109];
    qs.push(makeQ("Microorganisms", "11", `${type}: characteristics:`, chars, microorganismTypes[(_i109 + 1) % microorganismTypes.length][1], microorganismTypes[(_i109 + 2) % microorganismTypes.length][1], "multicellular with organs", `${type}: ${chars}. Examples: ${examples}.`));
    qs.push(makeQ("Microorganisms", "11", `Examples of ${type}:`, examples, microorganismTypes[(_i109 + 1) % microorganismTypes.length][2], microorganismTypes[(_i109 + 2) % microorganismTypes.length][2], "vertebrate animals", `${type}: ${examples}.`));
  }

  const respirationDetailed: [string, string, string][] = [
    ["Glycolysis", "Cytoplasm", "1 Glucose (6C) → 2 Pyruvate (3C) + 2 ATP + 2 NADH"],
    ["Pyruvate decarboxylation", "Mitochondrial matrix", "Pyruvate → Acetyl CoA + CO₂ + NADH"],
    ["Krebs cycle (TCA)", "Mitochondrial matrix", "Acetyl CoA → 2CO₂ + 3NADH + 1FADH₂ + 1GTP per turn"],
    ["ETC (Electron Transport Chain)", "Inner mitochondrial membrane", "NADH/FADH₂ → electrons → O₂ → H₂O + 32-34 ATP"],
    ["Chemiosmosis (mitochondria)", "Inner mitochondrial membrane", "H⁺ gradient drives ATP synthase → ATP (oxidative phosphorylation)"],
    ["Total ATP yield (aerobic)", "Complete oxidation of 1 glucose", "36-38 ATP (theoretical maximum)"],
    ["Anaerobic respiration (lactic acid)", "Cytoplasm (muscle cells)", "Pyruvate → Lactate + NAD⁺ regenerated, only 2 ATP"],
    ["Anaerobic respiration (alcohol)", "Cytoplasm (yeast)", "Pyruvate → Ethanol + CO₂ + NAD⁺ regenerated, only 2 ATP"],
    ["RQ (Respiratory Quotient)", "CO₂ produced / O₂ consumed", "Carbohydrates: 1.0, Fats: 0.7, Proteins: 0.8"],
    ["Fermentation vs aerobic", "Comparison", "Fermentation: 2 ATP, no O₂; Aerobic: 36-38 ATP, requires O₂"],
  ];
  for (let _i110 = 0; _i110 < respirationDetailed.length; _i110++) {
    const [step, location, detail] = respirationDetailed[_i110];
    qs.push(makeQ("Plant Physiology", "11", `${step}: location:`, location, respirationDetailed[(_i110 + 1) % respirationDetailed.length][1], respirationDetailed[(_i110 + 2) % respirationDetailed.length][1], "nucleus", `${step}: ${location}. ${detail}.`));
    qs.push(makeQ("Plant Physiology", "11", `${step}: detail:`, detail, respirationDetailed[(_i110 + 1) % respirationDetailed.length][2], respirationDetailed[(_i110 + 2) % respirationDetailed.length][2], "lipid synthesis only", `${step}: ${detail}.`));
  }

  const carbohydrateTypes: [string, string, string][] = [
    ["Glucose", "C₆H₁₂O₆, aldohexose", "Primary energy source, blood sugar"],
    ["Fructose", "C₆H₁₂O₆, ketohexose", "Sweetest natural sugar, in fruits"],
    ["Galactose", "C₆H₁₂O₆, aldohexose", "Component of lactose (milk sugar)"],
    ["Sucrose", "Glucose + Fructose, non-reducing", "Table sugar, transported in phloem"],
    ["Maltose", "Glucose + Glucose, reducing", "Malt sugar, from starch digestion"],
    ["Lactose", "Glucose + Galactose, reducing", "Milk sugar, digested by lactase"],
    ["Starch", "α-glucose polymer (amylose + amylopectin)", "Plant energy storage, in chloroplasts/amyloplasts"],
    ["Glycogen", "Highly branched α-glucose polymer", "Animal energy storage, in liver and muscles"],
    ["Cellulose", "β-glucose polymer, linear chains", "Plant cell wall structural component, indigestible by humans"],
    ["Chitin", "N-acetylglucosamine polymer", "Exoskeleton of arthropods, fungal cell walls"],
  ];
  for (let _i111 = 0; _i111 < carbohydrateTypes.length; _i111++) {
    const [sugar, structure, role] = carbohydrateTypes[_i111];
    qs.push(makeQ("Biomolecules", "11", `${sugar}: structure:`, structure, carbohydrateTypes[(_i111 + 1) % carbohydrateTypes.length][1], carbohydrateTypes[(_i111 + 2) % carbohydrateTypes.length][1], "amino acid chain", `${sugar}: ${structure}. ${role}.`));
    qs.push(makeQ("Biomolecules", "11", `${sugar}: biological role:`, role, carbohydrateTypes[(_i111 + 1) % carbohydrateTypes.length][2], carbohydrateTypes[(_i111 + 2) % carbohydrateTypes.length][2], "oxygen transport in blood", `${sugar}: ${role}.`));
  }

  return qs;
}
