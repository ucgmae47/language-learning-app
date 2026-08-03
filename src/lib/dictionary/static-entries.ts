import type { DictionaryLookup } from "@/lib/dictionary/types";
import type { Language } from "@/lib/supabase/types";

type StaticEntry = Omit<DictionaryLookup, "query" | "language"> & {
  aliases?: string[];
};

const ES: StaticEntry[] = [
  {
    lemma: "comida",
    aliases: ["food", "meal", "alimento"],
    isVerb: false,
    pronunciation: "koh-MEE-dah",
    primaryTranslation: "food; meal",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Food or a meal; something you eat.",
        exampleNative: "La comida está lista.",
        exampleEnglish: "The food / meal is ready.",
      },
      {
        partOfSpeech: "noun",
        definition: "Lunch in some Spanish-speaking regions.",
        exampleNative: "¿A qué hora es la comida?",
        exampleEnglish: "What time is lunch?",
      },
    ],
    related: ["alimento", "cena", "desayuno", "comer"],
  },
  {
    lemma: "agua",
    aliases: ["water"],
    isVerb: false,
    pronunciation: "AH-gwah",
    primaryTranslation: "water",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Water.",
        exampleNative: "Necesito un vaso de agua.",
        exampleEnglish: "I need a glass of water.",
      },
    ],
    related: ["bebida", "hielo", "mar"],
  },
  {
    lemma: "casa",
    aliases: ["house", "home"],
    isVerb: false,
    pronunciation: "KAH-sah",
    primaryTranslation: "house; home",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A house or home.",
        exampleNative: "Vivo en una casa grande.",
        exampleEnglish: "I live in a big house.",
      },
    ],
    related: ["hogar", "apartamento", "habitación"],
  },
  {
    lemma: "hablar",
    aliases: ["speak", "talk", "to speak", "to talk"],
    isVerb: true,
    pronunciation: "ah-BLAR",
    primaryTranslation: "to speak; to talk",
    senses: [
      {
        partOfSpeech: "verb",
        definition: "To speak or talk.",
        exampleNative: "Me gusta hablar español.",
        exampleEnglish: "I like to speak Spanish.",
      },
    ],
    related: ["decir", "conversar", "idioma"],
  },
  {
    lemma: "comer",
    aliases: ["eat", "to eat"],
    isVerb: true,
    pronunciation: "koh-MEHR",
    primaryTranslation: "to eat",
    senses: [
      {
        partOfSpeech: "verb",
        definition: "To eat.",
        exampleNative: "Vamos a comer juntos.",
        exampleEnglish: "Let's eat together.",
      },
    ],
    related: ["comida", "bebida", "cocinar"],
  },
  {
    lemma: "libro",
    aliases: ["book"],
    isVerb: false,
    pronunciation: "LEE-broh",
    primaryTranslation: "book",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A book.",
        exampleNative: "Estoy leyendo un libro interesante.",
        exampleEnglish: "I'm reading an interesting book.",
      },
    ],
    related: ["leer", "página", "biblioteca"],
  },
  {
    lemma: "amigo",
    aliases: ["friend", "amigo", "amiga"],
    isVerb: false,
    pronunciation: "ah-MEE-goh",
    primaryTranslation: "friend",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A friend (masculine form; feminine: amiga).",
        exampleNative: "Él es mi mejor amigo.",
        exampleEnglish: "He is my best friend.",
      },
    ],
    related: ["amiga", "amistad", "compañero"],
  },
  {
    lemma: "tiempo",
    aliases: ["time", "weather"],
    isVerb: false,
    pronunciation: "tee-EHM-poh",
    primaryTranslation: "time; weather",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Time, or weather depending on context.",
        exampleNative: "No tengo tiempo hoy.",
        exampleEnglish: "I don't have time today.",
      },
    ],
    related: ["hora", "clima", "día"],
  },
];

const FR: StaticEntry[] = [
  {
    lemma: "nourriture",
    aliases: ["food", "meal", "manger"],
    isVerb: false,
    pronunciation: "noo-ree-TYOOR",
    primaryTranslation: "food",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Food; something to eat.",
        exampleNative: "La nourriture est délicieuse.",
        exampleEnglish: "The food is delicious.",
      },
    ],
    related: ["repas", "manger", "cuisine"],
  },
  {
    lemma: "eau",
    aliases: ["water"],
    isVerb: false,
    pronunciation: "oh",
    primaryTranslation: "water",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Water.",
        exampleNative: "Je bois de l'eau.",
        exampleEnglish: "I drink water.",
      },
    ],
    related: ["boisson", "glace", "mer"],
  },
  {
    lemma: "maison",
    aliases: ["house", "home"],
    isVerb: false,
    pronunciation: "meh-ZOHN",
    primaryTranslation: "house; home",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A house or home.",
        exampleNative: "J'habite dans une grande maison.",
        exampleEnglish: "I live in a big house.",
      },
    ],
    related: ["appartement", "chez", "pièce"],
  },
  {
    lemma: "parler",
    aliases: ["speak", "talk", "to speak", "to talk"],
    isVerb: true,
    pronunciation: "par-LAY",
    primaryTranslation: "to speak; to talk",
    senses: [
      {
        partOfSpeech: "verb",
        definition: "To speak or talk.",
        exampleNative: "J'aime parler français.",
        exampleEnglish: "I like to speak French.",
      },
    ],
    related: ["dire", "conversation", "langue"],
  },
  {
    lemma: "manger",
    aliases: ["eat", "to eat", "food"],
    isVerb: true,
    pronunciation: "mahn-ZHAY",
    primaryTranslation: "to eat",
    senses: [
      {
        partOfSpeech: "verb",
        definition: "To eat.",
        exampleNative: "On va manger ensemble.",
        exampleEnglish: "We're going to eat together.",
      },
    ],
    related: ["nourriture", "repas", "cuisine"],
  },
  {
    lemma: "livre",
    aliases: ["book"],
    isVerb: false,
    pronunciation: "lee-vruh",
    primaryTranslation: "book",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A book.",
        exampleNative: "Je lis un livre intéressant.",
        exampleEnglish: "I'm reading an interesting book.",
      },
    ],
    related: ["lire", "page", "bibliothèque"],
  },
  {
    lemma: "ami",
    aliases: ["friend", "amie"],
    isVerb: false,
    pronunciation: "ah-MEE",
    primaryTranslation: "friend",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "A friend (masculine form; feminine: amie).",
        exampleNative: "C'est mon meilleur ami.",
        exampleEnglish: "He is my best friend.",
      },
    ],
    related: ["amie", "amitié", "copain"],
  },
  {
    lemma: "temps",
    aliases: ["time", "weather"],
    isVerb: false,
    pronunciation: "tahn",
    primaryTranslation: "time; weather",
    senses: [
      {
        partOfSpeech: "noun",
        definition: "Time, or weather depending on context.",
        exampleNative: "Je n'ai pas le temps aujourd'hui.",
        exampleEnglish: "I don't have time today.",
      },
    ],
    related: ["heure", "météo", "jour"],
  },
];

function normalize(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Offline fallback when AI providers are unavailable. */
export function lookupStaticDictionary(
  query: string,
  language: Language,
): DictionaryLookup | null {
  const bank = language === "fr" ? FR : ES;
  const needle = normalize(query);
  if (!needle) return null;

  const entry = bank.find((item) => {
    if (normalize(item.lemma) === needle) return true;
    return (item.aliases ?? []).some((a) => normalize(a) === needle);
  });

  if (!entry) return null;

  const { aliases: _a, ...rest } = entry;
  return {
    query,
    language,
    ...rest,
  };
}
