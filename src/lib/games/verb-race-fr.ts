import type { VerbQuestion } from "./verb-race-es";
export type { VerbQuestion };

const VERBS_FR = [
  { verb: "PARLER",     english: "to speak",      c: { "je": "parle",    "tu": "parles",   "il/elle": "parle",    "nous": "parlons",      "vous": "parlez",       "ils/elles": "parlent"      } },
  { verb: "MANGER",     english: "to eat",        c: { "je": "mange",    "tu": "manges",   "il/elle": "mange",    "nous": "mangeons",     "vous": "mangez",       "ils/elles": "mangent"      } },
  { verb: "FINIR",      english: "to finish",     c: { "je": "finis",    "tu": "finis",    "il/elle": "finit",    "nous": "finissons",    "vous": "finissez",     "ils/elles": "finissent"    } },
  { verb: "ALLER",      english: "to go",         c: { "je": "vais",     "tu": "vas",      "il/elle": "va",       "nous": "allons",       "vous": "allez",        "ils/elles": "vont"         } },
  { verb: "ÊTRE",       english: "to be",         c: { "je": "suis",     "tu": "es",       "il/elle": "est",      "nous": "sommes",       "vous": "êtes",         "ils/elles": "sont"         } },
  { verb: "AVOIR",      english: "to have",       c: { "je": "ai",       "tu": "as",       "il/elle": "a",        "nous": "avons",        "vous": "avez",         "ils/elles": "ont"          } },
  { verb: "FAIRE",      english: "to do/make",    c: { "je": "fais",     "tu": "fais",     "il/elle": "fait",     "nous": "faisons",      "vous": "faites",       "ils/elles": "font"         } },
  { verb: "POUVOIR",    english: "to be able",    c: { "je": "peux",     "tu": "peux",     "il/elle": "peut",     "nous": "pouvons",      "vous": "pouvez",       "ils/elles": "peuvent"      } },
  { verb: "VOULOIR",    english: "to want",       c: { "je": "veux",     "tu": "veux",     "il/elle": "veut",     "nous": "voulons",      "vous": "voulez",       "ils/elles": "veulent"      } },
  { verb: "VENIR",      english: "to come",       c: { "je": "viens",    "tu": "viens",    "il/elle": "vient",    "nous": "venons",       "vous": "venez",        "ils/elles": "viennent"     } },
  { verb: "VOIR",       english: "to see",        c: { "je": "vois",     "tu": "vois",     "il/elle": "voit",     "nous": "voyons",       "vous": "voyez",        "ils/elles": "voient"       } },
  { verb: "SAVOIR",     english: "to know",       c: { "je": "sais",     "tu": "sais",     "il/elle": "sait",     "nous": "savons",       "vous": "savez",        "ils/elles": "savent"       } },
  { verb: "PRENDRE",    english: "to take",       c: { "je": "prends",   "tu": "prends",   "il/elle": "prend",    "nous": "prenons",      "vous": "prenez",       "ils/elles": "prennent"     } },
  { verb: "DIRE",       english: "to say",        c: { "je": "dis",      "tu": "dis",      "il/elle": "dit",      "nous": "disons",       "vous": "dites",        "ils/elles": "disent"       } },
  { verb: "METTRE",     english: "to put",        c: { "je": "mets",     "tu": "mets",     "il/elle": "met",      "nous": "mettons",      "vous": "mettez",       "ils/elles": "mettent"      } },
  { verb: "ÉCRIRE",     english: "to write",      c: { "je": "écris",    "tu": "écris",    "il/elle": "écrit",    "nous": "écrivons",     "vous": "écrivez",      "ils/elles": "écrivent"     } },
  { verb: "LIRE",       english: "to read",       c: { "je": "lis",      "tu": "lis",      "il/elle": "lit",      "nous": "lisons",       "vous": "lisez",        "ils/elles": "lisent"       } },
  { verb: "BOIRE",      english: "to drink",      c: { "je": "bois",     "tu": "bois",     "il/elle": "boit",     "nous": "buvons",       "vous": "buvez",        "ils/elles": "boivent"      } },
  { verb: "COURIR",     english: "to run",        c: { "je": "cours",    "tu": "cours",    "il/elle": "court",    "nous": "courons",      "vous": "courez",       "ils/elles": "courent"      } },
  { verb: "OUVRIR",     english: "to open",       c: { "je": "ouvre",    "tu": "ouvres",   "il/elle": "ouvre",    "nous": "ouvrons",      "vous": "ouvrez",       "ils/elles": "ouvrent"      } },
  { verb: "FERMER",     english: "to close",      c: { "je": "ferme",    "tu": "fermes",   "il/elle": "ferme",    "nous": "fermons",      "vous": "fermez",       "ils/elles": "ferment"      } },
  { verb: "ACHETER",    english: "to buy",        c: { "je": "achète",   "tu": "achètes",  "il/elle": "achète",   "nous": "achetons",     "vous": "achetez",      "ils/elles": "achètent"     } },
  { verb: "VENDRE",     english: "to sell",       c: { "je": "vends",    "tu": "vends",    "il/elle": "vend",     "nous": "vendons",      "vous": "vendez",       "ils/elles": "vendent"      } },
  { verb: "TRAVAILLER", english: "to work",       c: { "je": "travaille","tu": "travailles","il/elle": "travaille","nous": "travaillons",  "vous": "travaillez",   "ils/elles": "travaillent"  } },
  { verb: "ÉTUDIER",    english: "to study",      c: { "je": "étudie",   "tu": "étudies",  "il/elle": "étudie",   "nous": "étudions",     "vous": "étudiez",      "ils/elles": "étudient"     } },
  { verb: "CHOISIR",    english: "to choose",     c: { "je": "choisis",  "tu": "choisis",  "il/elle": "choisit",  "nous": "choisissons",  "vous": "choisissez",   "ils/elles": "choisissent"  } },
  { verb: "RÉPONDRE",   english: "to answer",     c: { "je": "réponds",  "tu": "réponds",  "il/elle": "répond",   "nous": "répondons",    "vous": "répondez",     "ils/elles": "répondent"    } },
  { verb: "PARTIR",     english: "to leave",      c: { "je": "pars",     "tu": "pars",     "il/elle": "part",     "nous": "partons",      "vous": "partez",       "ils/elles": "partent"      } },
  { verb: "DORMIR",     english: "to sleep",      c: { "je": "dors",     "tu": "dors",     "il/elle": "dort",     "nous": "dormons",      "vous": "dormez",       "ils/elles": "dorment"      } },
  { verb: "COMPRENDRE", english: "to understand", c: { "je": "comprends","tu": "comprends","il/elle": "comprend", "nous": "comprenons",   "vous": "comprenez",    "ils/elles": "comprennent"  } },
] as const;

export function getAllVerbQuestionsFr(): VerbQuestion[] {
  const qs: VerbQuestion[] = [];
  for (const v of VERBS_FR) {
    for (const [pronoun, answer] of Object.entries(v.c)) {
      qs.push({ verb: v.verb, english: v.english, pronoun, answer });
    }
  }
  return qs;
}
