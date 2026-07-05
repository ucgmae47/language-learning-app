export type VerbQuestion = {
  verb: string;
  english: string;
  pronoun: string;
  answer: string;
};

const VERBS_ES = [
  { verb: "HABLAR",    english: "to speak",    c: { "yo": "hablo",    "tú": "hablas",   "él/ella": "habla",    "nosotros": "hablamos",   "vosotros": "habláis",   "ellos/ellas": "hablan"    } },
  { verb: "COMER",     english: "to eat",      c: { "yo": "como",     "tú": "comes",    "él/ella": "come",     "nosotros": "comemos",    "vosotros": "coméis",    "ellos/ellas": "comen"     } },
  { verb: "VIVIR",     english: "to live",     c: { "yo": "vivo",     "tú": "vives",    "él/ella": "vive",     "nosotros": "vivimos",    "vosotros": "vivís",     "ellos/ellas": "viven"     } },
  { verb: "SER",       english: "to be",       c: { "yo": "soy",      "tú": "eres",     "él/ella": "es",       "nosotros": "somos",      "vosotros": "sois",      "ellos/ellas": "son"       } },
  { verb: "ESTAR",     english: "to be (state)",c:{ "yo": "estoy",    "tú": "estás",    "él/ella": "está",     "nosotros": "estamos",    "vosotros": "estáis",    "ellos/ellas": "están"     } },
  { verb: "TENER",     english: "to have",     c: { "yo": "tengo",    "tú": "tienes",   "él/ella": "tiene",    "nosotros": "tenemos",    "vosotros": "tenéis",    "ellos/ellas": "tienen"    } },
  { verb: "IR",        english: "to go",       c: { "yo": "voy",      "tú": "vas",      "él/ella": "va",       "nosotros": "vamos",      "vosotros": "vais",      "ellos/ellas": "van"       } },
  { verb: "HACER",     english: "to do/make",  c: { "yo": "hago",     "tú": "haces",    "él/ella": "hace",     "nosotros": "hacemos",    "vosotros": "hacéis",    "ellos/ellas": "hacen"     } },
  { verb: "PODER",     english: "to be able",  c: { "yo": "puedo",    "tú": "puedes",   "él/ella": "puede",    "nosotros": "podemos",    "vosotros": "podéis",    "ellos/ellas": "pueden"    } },
  { verb: "QUERER",    english: "to want",     c: { "yo": "quiero",   "tú": "quieres",  "él/ella": "quiere",   "nosotros": "queremos",   "vosotros": "queréis",   "ellos/ellas": "quieren"   } },
  { verb: "DECIR",     english: "to say",      c: { "yo": "digo",     "tú": "dices",    "él/ella": "dice",     "nosotros": "decimos",    "vosotros": "decís",     "ellos/ellas": "dicen"     } },
  { verb: "SABER",     english: "to know",     c: { "yo": "sé",       "tú": "sabes",    "él/ella": "sabe",     "nosotros": "sabemos",    "vosotros": "sabéis",    "ellos/ellas": "saben"     } },
  { verb: "VER",       english: "to see",      c: { "yo": "veo",      "tú": "ves",      "él/ella": "ve",       "nosotros": "vemos",      "vosotros": "veis",      "ellos/ellas": "ven"       } },
  { verb: "DAR",       english: "to give",     c: { "yo": "doy",      "tú": "das",      "él/ella": "da",       "nosotros": "damos",      "vosotros": "dais",      "ellos/ellas": "dan"       } },
  { verb: "PONER",     english: "to put",      c: { "yo": "pongo",    "tú": "pones",    "él/ella": "pone",     "nosotros": "ponemos",    "vosotros": "ponéis",    "ellos/ellas": "ponen"     } },
  { verb: "VENIR",     english: "to come",     c: { "yo": "vengo",    "tú": "vienes",   "él/ella": "viene",    "nosotros": "venimos",    "vosotros": "venís",     "ellos/ellas": "vienen"    } },
  { verb: "SALIR",     english: "to leave",    c: { "yo": "salgo",    "tú": "sales",    "él/ella": "sale",     "nosotros": "salimos",    "vosotros": "salís",     "ellos/ellas": "salen"     } },
  { verb: "TRAER",     english: "to bring",    c: { "yo": "traigo",   "tú": "traes",    "él/ella": "trae",     "nosotros": "traemos",    "vosotros": "traéis",    "ellos/ellas": "traen"     } },
  { verb: "CONOCER",   english: "to know (person)",c:{ "yo":"conozco","tú": "conoces",  "él/ella": "conoce",   "nosotros": "conocemos",  "vosotros": "conocéis",  "ellos/ellas": "conocen"   } },
  { verb: "JUGAR",     english: "to play",     c: { "yo": "juego",    "tú": "juegas",   "él/ella": "juega",    "nosotros": "jugamos",    "vosotros": "jugáis",    "ellos/ellas": "juegan"    } },
  { verb: "LEER",      english: "to read",     c: { "yo": "leo",      "tú": "lees",     "él/ella": "lee",      "nosotros": "leemos",     "vosotros": "leéis",     "ellos/ellas": "leen"      } },
  { verb: "ESCRIBIR",  english: "to write",    c: { "yo": "escribo",  "tú": "escribes", "él/ella": "escribe",  "nosotros": "escribimos", "vosotros": "escribís",  "ellos/ellas": "escriben"  } },
  { verb: "BEBER",     english: "to drink",    c: { "yo": "bebo",     "tú": "bebes",    "él/ella": "bebe",     "nosotros": "bebemos",    "vosotros": "bebéis",    "ellos/ellas": "beben"     } },
  { verb: "CORRER",    english: "to run",      c: { "yo": "corro",    "tú": "corres",   "él/ella": "corre",    "nosotros": "corremos",   "vosotros": "corréis",   "ellos/ellas": "corren"    } },
  { verb: "ABRIR",     english: "to open",     c: { "yo": "abro",     "tú": "abres",    "él/ella": "abre",     "nosotros": "abrimos",    "vosotros": "abrís",     "ellos/ellas": "abren"     } },
  { verb: "CERRAR",    english: "to close",    c: { "yo": "cierro",   "tú": "cierras",  "él/ella": "cierra",   "nosotros": "cerramos",   "vosotros": "cerráis",   "ellos/ellas": "cierran"   } },
  { verb: "COMPRAR",   english: "to buy",      c: { "yo": "compro",   "tú": "compras",  "él/ella": "compra",   "nosotros": "compramos",  "vosotros": "compráis",  "ellos/ellas": "compran"   } },
  { verb: "VENDER",    english: "to sell",     c: { "yo": "vendo",    "tú": "vendes",   "él/ella": "vende",    "nosotros": "vendemos",   "vosotros": "vendéis",   "ellos/ellas": "venden"    } },
  { verb: "TRABAJAR",  english: "to work",     c: { "yo": "trabajo",  "tú": "trabajas", "él/ella": "trabaja",  "nosotros": "trabajamos", "vosotros": "trabajáis", "ellos/ellas": "trabajan"  } },
  { verb: "ESTUDIAR",  english: "to study",    c: { "yo": "estudio",  "tú": "estudias", "él/ella": "estudia",  "nosotros": "estudiamos", "vosotros": "estudiáis", "ellos/ellas": "estudian"  } },
] as const;

/** Strip accents for loose comparison */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function getAllVerbQuestionsEs(): VerbQuestion[] {
  const qs: VerbQuestion[] = [];
  for (const v of VERBS_ES) {
    for (const [pronoun, answer] of Object.entries(v.c)) {
      qs.push({ verb: v.verb, english: v.english, pronoun, answer });
    }
  }
  return qs;
}

/** Fisher-Yates shuffle */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
