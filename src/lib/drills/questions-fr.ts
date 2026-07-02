import type { DrillConcept, DrillQuestion } from "./types";

export const CONCEPTS_FR: DrillConcept[] = [
  {
    key: "fr-passe-compose-avoir",
    label: "Passé composé — avoir",
    description: "Past tense with the auxiliary 'avoir'",
  },
  {
    key: "fr-passe-compose-etre",
    label: "Passé composé — être",
    description: "Past tense with the auxiliary 'être' (motion & reflexive verbs)",
  },
  {
    key: "fr-imparfait",
    label: "Imparfait",
    description: "The imperfect tense for habits and background descriptions",
  },
  {
    key: "fr-subjonctif",
    label: "Subjonctif présent",
    description: "The present subjunctive in wish, doubt, and necessity clauses",
  },
  {
    key: "fr-conditionnel",
    label: "Conditionnel présent",
    description: "The conditional for hypothetical situations and politeness",
  },
  {
    key: "fr-accord-participe",
    label: "Accord du participe passé",
    description: "Agreement of the past participle with preceding direct objects",
  },
];

export const QUESTIONS_FR: DrillQuestion[] = [
  // ─── Passé composé — avoir ──────────────────────────────────────────────
  {
    id: "fr-pc-av-01",
    concept: "fr-passe-compose-avoir",
    conceptLabel: "Passé composé — avoir",
    prompt: "Conjugate 'parler' (to speak) — je, passé composé",
    answer: "j'ai parlé",
    alternates: ["j'ai parle"],
    explanation:
      "'Parler' uses 'avoir' as the auxiliary. Je + ai + parlé = j'ai parlé. The past participle of -er verbs ends in -é.",
  },
  {
    id: "fr-pc-av-02",
    concept: "fr-passe-compose-avoir",
    conceptLabel: "Passé composé — avoir",
    prompt: "Conjugate 'finir' (to finish) — nous, passé composé",
    answer: "nous avons fini",
    explanation:
      "The past participle of -ir verbs ends in -i: fini. Nous = nous avons fini.",
  },
  {
    id: "fr-pc-av-03",
    concept: "fr-passe-compose-avoir",
    conceptLabel: "Passé composé — avoir",
    prompt: "Conjugate 'prendre' (to take) — ils, passé composé",
    answer: "ils ont pris",
    explanation:
      "'Prendre' has an irregular past participle: pris. Ils = ils ont pris.",
  },
  {
    id: "fr-pc-av-04",
    concept: "fr-passe-compose-avoir",
    conceptLabel: "Passé composé — avoir",
    prompt: "Conjugate 'lire' (to read) — elle, passé composé",
    answer: "elle a lu",
    explanation:
      "'Lire' has an irregular past participle: lu. Elle = elle a lu.",
  },
  {
    id: "fr-pc-av-05",
    concept: "fr-passe-compose-avoir",
    conceptLabel: "Passé composé — avoir",
    prompt: "Conjugate 'faire' (to do/make) — tu, passé composé",
    answer: "tu as fait",
    explanation:
      "'Faire' has an irregular past participle: fait. Tu = tu as fait.",
  },
  // ─── Passé composé — être ───────────────────────────────────────────────
  {
    id: "fr-pc-et-01",
    concept: "fr-passe-compose-etre",
    conceptLabel: "Passé composé — être",
    prompt: "Conjugate 'aller' (to go) — il, passé composé",
    answer: "il est allé",
    explanation:
      "Motion verbs like 'aller' use 'être'. The past participle (allé) agrees with the subject in gender/number. Il (masculine singular) = il est allé.",
  },
  {
    id: "fr-pc-et-02",
    concept: "fr-passe-compose-etre",
    conceptLabel: "Passé composé — être",
    prompt: "Conjugate 'partir' (to leave) — elle, passé composé",
    answer: "elle est partie",
    explanation:
      "'Partir' uses 'être'. Because the subject is feminine (elle), add -e to the participle: partie.",
  },
  {
    id: "fr-pc-et-03",
    concept: "fr-passe-compose-etre",
    conceptLabel: "Passé composé — être",
    prompt: "Conjugate 'venir' (to come) — nous, passé composé",
    answer: "nous sommes venus",
    alternates: ["nous sommes venues"],
    explanation:
      "'Venir' uses 'être'. The past participle 'venu' agrees with the subject; for a mixed or masculine group, use 'venus'. Nous = nous sommes venus.",
  },
  {
    id: "fr-pc-et-04",
    concept: "fr-passe-compose-etre",
    conceptLabel: "Passé composé — être",
    prompt: "Conjugate 'sortir' (to go out) — ils, passé composé",
    answer: "ils sont sortis",
    explanation:
      "'Sortir' uses 'être'. The masculine plural participle adds -s: sortis. Ils = ils sont sortis.",
  },
  // ─── Imparfait ──────────────────────────────────────────────────────────
  {
    id: "fr-imp-01",
    concept: "fr-imparfait",
    conceptLabel: "Imparfait",
    prompt: "Conjugate 'parler' (to speak) — je, imparfait",
    answer: "parlais",
    explanation:
      "The imparfait stem comes from the nous-present (parl-) + -ais ending. Je = parlais.",
  },
  {
    id: "fr-imp-02",
    concept: "fr-imparfait",
    conceptLabel: "Imparfait",
    prompt: "Conjugate 'être' (to be) — tu, imparfait",
    answer: "étais",
    explanation:
      "'Être' is the only irregular imparfait: étais, étais, était, étions, étiez, étaient. Tu = étais.",
  },
  {
    id: "fr-imp-03",
    concept: "fr-imparfait",
    conceptLabel: "Imparfait",
    prompt: "Conjugate 'aller' (to go) — ils, imparfait",
    answer: "allaient",
    explanation:
      "The nous-present of 'aller' is 'allons', giving the stem all-. Ils = allaient.",
  },
  {
    id: "fr-imp-04",
    concept: "fr-imparfait",
    conceptLabel: "Imparfait",
    prompt: "Conjugate 'avoir' (to have) — elle, imparfait",
    answer: "avait",
    explanation:
      "The nous-present of 'avoir' is 'avons', giving the stem av-. Elle = avait.",
  },
  {
    id: "fr-imp-05",
    concept: "fr-imparfait",
    conceptLabel: "Imparfait",
    prompt: "Conjugate 'faire' (to do/make) — nous, imparfait",
    answer: "faisions",
    explanation:
      "The nous-present of 'faire' is 'faisons', giving the stem fais-. Nous = faisions.",
  },
  // ─── Subjonctif présent ─────────────────────────────────────────────────
  {
    id: "fr-subj-01",
    concept: "fr-subjonctif",
    conceptLabel: "Subjonctif présent",
    prompt: "Fill in the blank — tu, parler",
    sentence: "Je veux que tu ___ plus lentement.",
    answer: "parles",
    explanation:
      "After 'vouloir que', use the subjonctif. For 'parler', tu subjonctif = parles.",
  },
  {
    id: "fr-subj-02",
    concept: "fr-subjonctif",
    conceptLabel: "Subjonctif présent",
    prompt: "Fill in the blank — il, finir",
    sentence: "Il faut qu'il ___ ses devoirs avant le dîner.",
    answer: "finisse",
    explanation:
      "'Il faut que' triggers the subjonctif. For -ir verbs like 'finir', il subjonctif = finisse.",
  },
  {
    id: "fr-subj-03",
    concept: "fr-subjonctif",
    conceptLabel: "Subjonctif présent",
    prompt: "Fill in the blank — ils, avoir",
    sentence: "Je doute qu'ils ___ assez d'argent.",
    answer: "aient",
    explanation:
      "'Avoir' is irregular in the subjonctif: aie, aies, ait, ayons, ayez, aient. Ils = aient.",
  },
  {
    id: "fr-subj-04",
    concept: "fr-subjonctif",
    conceptLabel: "Subjonctif présent",
    prompt: "Fill in the blank — tu, être",
    sentence: "Je suis content que tu ___ là.",
    answer: "sois",
    explanation:
      "'Être' is irregular in the subjonctif: sois, sois, soit, soyons, soyez, soient. Tu = sois.",
  },
  // ─── Conditionnel présent ───────────────────────────────────────────────
  {
    id: "fr-cond-01",
    concept: "fr-conditionnel",
    conceptLabel: "Conditionnel présent",
    prompt: "Conjugate 'parler' (to speak) — je, conditionnel",
    answer: "parlerais",
    explanation:
      "The conditionnel uses the future stem (infinitive for -er verbs) + imparfait endings: parler + ais = parlerais.",
  },
  {
    id: "fr-cond-02",
    concept: "fr-conditionnel",
    conceptLabel: "Conditionnel présent",
    prompt: "Conjugate 'avoir' (to have) — tu, conditionnel",
    answer: "aurais",
    explanation:
      "'Avoir' has an irregular future/conditionnel stem: aur-. Tu = aur + ais = aurais.",
  },
  {
    id: "fr-cond-03",
    concept: "fr-conditionnel",
    conceptLabel: "Conditionnel présent",
    prompt: "Conjugate 'faire' (to do/make) — il, conditionnel",
    answer: "ferait",
    explanation:
      "'Faire' has an irregular conditionnel stem: fer-. Il = fer + ait = ferait.",
  },
  // ─── Accord du participe passé ───────────────────────────────────────────
  {
    id: "fr-acc-01",
    concept: "fr-accord-participe",
    conceptLabel: "Accord du participe passé",
    prompt: "Give the correct past participle form of 'inviter'",
    sentence: "Les filles que j'ai ___ étaient charmantes.",
    answer: "invitées",
    explanation:
      "The direct object 'les filles' (feminine plural) precedes 'ai invité', so the participle agrees: invitées (-ées for fem. plural).",
  },
  {
    id: "fr-acc-02",
    concept: "fr-accord-participe",
    conceptLabel: "Accord du participe passé",
    prompt: "Give the correct past participle form of 'lever'",
    sentence: "Marie s'est ___ tôt ce matin.",
    answer: "levée",
    explanation:
      "Reflexive verbs use 'être' and agree with the subject. Marie is feminine singular, so: levée.",
  },
  {
    id: "fr-acc-03",
    concept: "fr-accord-participe",
    conceptLabel: "Accord du participe passé",
    prompt: "Give the correct past participle form of 'lire'",
    sentence: "Les livres que tu as ___ étaient excellents.",
    answer: "lus",
    explanation:
      "The direct object 'les livres' (masculine plural) precedes 'as lu', so the participle agrees: lus.",
  },
];
