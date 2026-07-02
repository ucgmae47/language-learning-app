import type { DrillConcept, DrillQuestion } from "./types";

export const CONCEPTS_ES: DrillConcept[] = [
  {
    key: "es-preterite-regular",
    label: "Preterite — Regular",
    description: "Regular -ar, -er, -ir verbs in the preterite tense",
  },
  {
    key: "es-preterite-irregular",
    label: "Preterite — Irregular",
    description: "High-frequency irregular verbs in the preterite",
  },
  {
    key: "es-imperfect",
    label: "Imperfect",
    description: "The imperfect tense for habits and background descriptions",
  },
  {
    key: "es-subjunctive-present",
    label: "Present Subjunctive",
    description: "The present subjunctive in wish, doubt, and impersonal clauses",
  },
  {
    key: "es-conditional",
    label: "Conditional",
    description: "The conditional tense for hypothetical situations",
  },
  {
    key: "es-ser-estar",
    label: "Ser vs. Estar",
    description: "Choosing between the two Spanish verbs 'to be'",
  },
];

export const QUESTIONS_ES: DrillQuestion[] = [
  // ─── Preterite — Regular ────────────────────────────────────────────────
  {
    id: "es-pre-r-01",
    concept: "es-preterite-regular",
    conceptLabel: "Preterite — Regular",
    prompt: "Conjugate 'hablar' (to speak) — yo, preterite",
    answer: "hablé",
    explanation:
      "Regular -ar verbs in the yo preterite take the ending -é: habl + é = hablé. Note the accent — it distinguishes past from present.",
  },
  {
    id: "es-pre-r-02",
    concept: "es-preterite-regular",
    conceptLabel: "Preterite — Regular",
    prompt: "Conjugate 'comer' (to eat) — nosotros, preterite",
    answer: "comimos",
    explanation:
      "Regular -er verbs use -imos for nosotros in the preterite: com + imos = comimos.",
  },
  {
    id: "es-pre-r-03",
    concept: "es-preterite-regular",
    conceptLabel: "Preterite — Regular",
    prompt: "Conjugate 'vivir' (to live) — ellos, preterite",
    answer: "vivieron",
    explanation:
      "Regular -ir verbs use -ieron for ellos/ellas: viv + ieron = vivieron.",
  },
  {
    id: "es-pre-r-04",
    concept: "es-preterite-regular",
    conceptLabel: "Preterite — Regular",
    prompt: "Conjugate 'llamar' (to call) — tú, preterite",
    answer: "llamaste",
    explanation:
      "Regular -ar verbs use -aste for tú in the preterite: llam + aste = llamaste.",
  },
  {
    id: "es-pre-r-05",
    concept: "es-preterite-regular",
    conceptLabel: "Preterite — Regular",
    prompt: "Conjugate 'beber' (to drink) — ella, preterite",
    answer: "bebió",
    explanation:
      "Regular -er verbs use -ió for él/ella: beb + ió = bebió. Don't forget the accent on the ó.",
  },
  // ─── Preterite — Irregular ──────────────────────────────────────────────
  {
    id: "es-pre-i-01",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'hacer' (to do/make) — yo, preterite",
    answer: "hice",
    explanation:
      "'Hacer' is irregular: the stem changes to hic- and the c→z before o (hizo for él). Yo form = hice.",
  },
  {
    id: "es-pre-i-02",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'tener' (to have) — él, preterite",
    answer: "tuvo",
    explanation:
      "'Tener' uses the irregular stem tuv-: tuv + o = tuvo (no accent on irregular preterites).",
  },
  {
    id: "es-pre-i-03",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'ir' (to go) — tú, preterite",
    answer: "fuiste",
    explanation:
      "'Ir' and 'ser' share the same preterite forms. Tú = fuiste. Context tells the verbs apart.",
  },
  {
    id: "es-pre-i-04",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'ser' (to be) — nosotros, preterite",
    answer: "fuimos",
    alternates: ["fuimos"],
    explanation:
      "'Ser' shares all preterite forms with 'ir'. Nosotros = fuimos.",
  },
  {
    id: "es-pre-i-05",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'saber' (to know) — yo, preterite",
    answer: "supe",
    explanation:
      "'Saber' uses the irregular stem sup-: sup + e = supe.",
  },
  {
    id: "es-pre-i-06",
    concept: "es-preterite-irregular",
    conceptLabel: "Preterite — Irregular",
    prompt: "Conjugate 'poder' (to be able to) — ella, preterite",
    answer: "pudo",
    explanation:
      "'Poder' uses the irregular stem pud-: pud + o = pudo.",
  },
  // ─── Imperfect ──────────────────────────────────────────────────────────
  {
    id: "es-imp-01",
    concept: "es-imperfect",
    conceptLabel: "Imperfect",
    prompt: "Conjugate 'hablar' (to speak) — yo, imperfect",
    answer: "hablaba",
    explanation:
      "Regular -ar verbs form the imperfect with -aba endings: habl + aba = hablaba.",
  },
  {
    id: "es-imp-02",
    concept: "es-imperfect",
    conceptLabel: "Imperfect",
    prompt: "Conjugate 'ser' (to be) — tú, imperfect",
    answer: "eras",
    explanation:
      "'Ser' is irregular in the imperfect: era, eras, era, éramos, erais, eran. Tú = eras.",
  },
  {
    id: "es-imp-03",
    concept: "es-imperfect",
    conceptLabel: "Imperfect",
    prompt: "Conjugate 'ir' (to go) — ellos, imperfect",
    answer: "iban",
    explanation:
      "'Ir' is irregular in the imperfect: iba, ibas, iba, íbamos, ibais, iban. Ellos = iban.",
  },
  {
    id: "es-imp-04",
    concept: "es-imperfect",
    conceptLabel: "Imperfect",
    prompt: "Conjugate 'tener' (to have) — ella, imperfect",
    answer: "tenía",
    explanation:
      "Regular -er/-ir verbs use -ía endings in the imperfect: ten + ía = tenía.",
  },
  {
    id: "es-imp-05",
    concept: "es-imperfect",
    conceptLabel: "Imperfect",
    prompt: "Conjugate 'ver' (to see) — yo, imperfect",
    answer: "veía",
    explanation:
      "'Ver' is slightly irregular — it keeps the full stem ve- before the regular -ía ending: ve + ía = veía.",
  },
  // ─── Present Subjunctive ────────────────────────────────────────────────
  {
    id: "es-subj-01",
    concept: "es-subjunctive-present",
    conceptLabel: "Present Subjunctive",
    prompt: "Fill in the blank — tú, hablar",
    sentence: "Quiero que tú ___ más despacio.",
    answer: "hables",
    explanation:
      "After 'querer que', use the present subjunctive. -Ar verbs use -es for tú: habl + es = hables.",
  },
  {
    id: "es-subj-02",
    concept: "es-subjunctive-present",
    conceptLabel: "Present Subjunctive",
    prompt: "Fill in the blank — él, comer",
    sentence: "Es necesario que él ___ más verduras.",
    answer: "coma",
    explanation:
      "Impersonal expressions like 'es necesario que' trigger the subjunctive. -Er verbs use -a for él: com + a = coma.",
  },
  {
    id: "es-subj-03",
    concept: "es-subjunctive-present",
    conceptLabel: "Present Subjunctive",
    prompt: "Fill in the blank — ellos, tener",
    sentence: "No creo que ellos ___ razón.",
    answer: "tengan",
    explanation:
      "'Tener' is irregular in the subjunctive. The yo present is 'tengo', so the subjunctive stem is teng-: teng + an = tengan.",
  },
  {
    id: "es-subj-04",
    concept: "es-subjunctive-present",
    conceptLabel: "Present Subjunctive",
    prompt: "Fill in the blank — yo, ir",
    sentence: "Ojalá ___ al concierto mañana.",
    answer: "vaya",
    explanation:
      "'Ir' is irregular in the subjunctive: vaya, vayas, vaya, vayamos, vayáis, vayan. With 'ojalá', use subjunctive — yo = vaya.",
  },
  // ─── Conditional ────────────────────────────────────────────────────────
  {
    id: "es-cond-01",
    concept: "es-conditional",
    conceptLabel: "Conditional",
    prompt: "Conjugate 'hablar' (to speak) — yo, conditional",
    answer: "hablaría",
    explanation:
      "The conditional is formed from the infinitive + -ía endings: hablar + ía = hablaría.",
  },
  {
    id: "es-cond-02",
    concept: "es-conditional",
    conceptLabel: "Conditional",
    prompt: "Conjugate 'tener' (to have) — tú, conditional",
    answer: "tendrías",
    explanation:
      "'Tener' has an irregular conditional stem: tendr-. Tú = tendr + ías = tendrías.",
  },
  {
    id: "es-cond-03",
    concept: "es-conditional",
    conceptLabel: "Conditional",
    prompt: "Conjugate 'hacer' (to do/make) — él, conditional",
    answer: "haría",
    explanation:
      "'Hacer' has an irregular conditional stem: har-. Él = har + ía = haría.",
  },
  // ─── Ser vs. Estar ───────────────────────────────────────────────────────
  {
    id: "es-se-01",
    concept: "es-ser-estar",
    conceptLabel: "Ser vs. Estar",
    prompt: "Fill in the blank with 'es' or 'está'",
    sentence: "La reunión ___ a las tres de la tarde.",
    answer: "es",
    explanation:
      "Use 'ser' for scheduled events and times: La reunión es a las tres.",
  },
  {
    id: "es-se-02",
    concept: "es-ser-estar",
    conceptLabel: "Ser vs. Estar",
    prompt: "Fill in the blank with 'es' or 'está'",
    sentence: "Ella ___ muy cansada hoy.",
    answer: "está",
    explanation:
      "Use 'estar' for temporary states and conditions. Fatigue is a temporary state: Ella está muy cansada.",
  },
  {
    id: "es-se-03",
    concept: "es-ser-estar",
    conceptLabel: "Ser vs. Estar",
    prompt: "Fill in the blank with 'es' or 'está'",
    sentence: "El libro ___ de mi hermano.",
    answer: "es",
    explanation:
      "Use 'ser' for possession: El libro es de mi hermano (the book belongs to my brother).",
  },
  {
    id: "es-se-04",
    concept: "es-ser-estar",
    conceptLabel: "Ser vs. Estar",
    prompt: "Fill in the blank with 'es' or 'está'",
    sentence: "¿Dónde ___ el banco más cercano?",
    answer: "está",
    explanation:
      "Use 'estar' for location of physical objects and people (not events): ¿Dónde está el banco?",
  },
  {
    id: "es-se-05",
    concept: "es-ser-estar",
    conceptLabel: "Ser vs. Estar",
    prompt: "Fill in the blank with 'es' or 'está'",
    sentence: "Mi padre ___ médico.",
    answer: "es",
    explanation:
      "Use 'ser' for professions and roles: Mi padre es médico.",
  },
];
