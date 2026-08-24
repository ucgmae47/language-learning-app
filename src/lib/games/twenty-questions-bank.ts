export type SecretAttributes = {
  isAnimal: boolean;
  isFood: boolean;
  isPlace: boolean;
  isJob: boolean;
  isObject: boolean;
  isAlive: boolean;
  largerThanBreadbox: boolean;
  foundIndoors: boolean;
};

export type Secret = {
  wordInEnglish: string;
  wordInTargetLanguage: string;
  openingHint: string;
  attributes: SecretAttributes;
};

const ES_SECRETS: Secret[] = [
  {
    wordInEnglish: "cat",
    wordInTargetLanguage: "gato",
    openingHint: "Es un animal doméstico muy común.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "dog",
    wordInTargetLanguage: "perro",
    openingHint: "Es un animal que suele ladrar.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "apple",
    wordInTargetLanguage: "manzana",
    openingHint: "Es una fruta que se come cruda o en postres.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "bread",
    wordInTargetLanguage: "pan",
    openingHint: "Se compra en la panadería casi cada día.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "school",
    wordInTargetLanguage: "escuela",
    openingHint: "Es un lugar donde los niños aprenden.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "beach",
    wordInTargetLanguage: "playa",
    openingHint: "Es un lugar con arena y mar.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "doctor",
    wordInTargetLanguage: "médico",
    openingHint: "Es una persona que ayuda cuando estás enfermo.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: true, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "teacher",
    wordInTargetLanguage: "profesor",
    openingHint: "Trabaja en una escuela y explica lecciones.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: true, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "chair",
    wordInTargetLanguage: "silla",
    openingHint: "Es un objeto donde te sientas.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "book",
    wordInTargetLanguage: "libro",
    openingHint: "Tiene páginas y se lee.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "coffee",
    wordInTargetLanguage: "café",
    openingHint: "Es una bebida caliente popular por la mañana.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "tree",
    wordInTargetLanguage: "árbol",
    openingHint: "Crece afuera y tiene hojas.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "bicycle",
    wordInTargetLanguage: "bicicleta",
    openingHint: "Tiene dos ruedas y se pedalea.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "kitchen",
    wordInTargetLanguage: "cocina",
    openingHint: "Es una habitación de la casa donde se prepara la comida.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "fish",
    wordInTargetLanguage: "pez",
    openingHint: "Vive en el agua y nada.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: false, foundIndoors: false },
  },
  {
    wordInEnglish: "pizza",
    wordInTargetLanguage: "pizza",
    openingHint: "Es una comida redonda con queso.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
];

const FR_SECRETS: Secret[] = [
  {
    wordInEnglish: "cat",
    wordInTargetLanguage: "chat",
    openingHint: "C'est un animal domestique très commun.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "dog",
    wordInTargetLanguage: "chien",
    openingHint: "C'est un animal qui aboie souvent.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "apple",
    wordInTargetLanguage: "pomme",
    openingHint: "C'est un fruit qu'on mange cru ou en dessert.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "bread",
    wordInTargetLanguage: "pain",
    openingHint: "On l'achète à la boulangerie presque chaque jour.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "school",
    wordInTargetLanguage: "école",
    openingHint: "C'est un endroit où les enfants apprennent.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "beach",
    wordInTargetLanguage: "plage",
    openingHint: "C'est un lieu avec du sable et de la mer.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "doctor",
    wordInTargetLanguage: "médecin",
    openingHint: "C'est une personne qui aide quand on est malade.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: true, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "teacher",
    wordInTargetLanguage: "professeur",
    openingHint: "Cette personne travaille à l'école et explique des leçons.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: true, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "chair",
    wordInTargetLanguage: "chaise",
    openingHint: "C'est un objet sur lequel on s'assoit.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "book",
    wordInTargetLanguage: "livre",
    openingHint: "Il a des pages et on le lit.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "coffee",
    wordInTargetLanguage: "café",
    openingHint: "C'est une boisson chaude populaire le matin.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
  {
    wordInEnglish: "tree",
    wordInTargetLanguage: "arbre",
    openingHint: "Ça pousse dehors et ça a des feuilles.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "bicycle",
    wordInTargetLanguage: "vélo",
    openingHint: "Ça a deux roues et on pédale.",
    attributes: { isAnimal: false, isFood: false, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: true, foundIndoors: false },
  },
  {
    wordInEnglish: "kitchen",
    wordInTargetLanguage: "cuisine",
    openingHint: "C'est une pièce de la maison où l'on prépare les repas.",
    attributes: { isAnimal: false, isFood: false, isPlace: true, isJob: false, isObject: false, isAlive: false, largerThanBreadbox: true, foundIndoors: true },
  },
  {
    wordInEnglish: "fish",
    wordInTargetLanguage: "poisson",
    openingHint: "Ça vit dans l'eau et ça nage.",
    attributes: { isAnimal: true, isFood: false, isPlace: false, isJob: false, isObject: false, isAlive: true, largerThanBreadbox: false, foundIndoors: false },
  },
  {
    wordInEnglish: "cheese",
    wordInTargetLanguage: "fromage",
    openingHint: "C'est un aliment laitier très français.",
    attributes: { isAnimal: false, isFood: true, isPlace: false, isJob: false, isObject: true, isAlive: false, largerThanBreadbox: false, foundIndoors: true },
  },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function pickSecret(language: string): Secret {
  const bank = language === "fr" ? FR_SECRETS : ES_SECRETS;
  return bank[Math.floor(Math.random() * bank.length)]!;
}

/** Look up a banked secret by English word (for free-tier ask/guess). */
export function findSecret(language: string, wordInEnglish: string): Secret | null {
  const bank = language === "fr" ? FR_SECRETS : ES_SECRETS;
  const key = normalize(wordInEnglish);
  return bank.find((s) => normalize(s.wordInEnglish) === key) ?? null;
}

type AttrKey = keyof SecretAttributes;

const ATTR_KEYWORDS: { key: AttrKey; es: string[]; fr: string[]; en: string[] }[] = [
  { key: "isAnimal", es: ["animal", "mascota", "bestia"], fr: ["animal", "bete", "mascotte"], en: ["animal", "pet"] },
  { key: "isFood", es: ["comida", "alimento", "comer", "bebida", "fruta"], fr: ["nourriture", "aliment", "manger", "boisson", "fruit"], en: ["food", "eat", "drink", "fruit"] },
  { key: "isPlace", es: ["lugar", "sitio", "edificio", "ciudad", "pais"], fr: ["lieu", "endroit", "batiment", "ville", "pays"], en: ["place", "building", "city", "country"] },
  { key: "isJob", es: ["trabajo", "profesion", "oficio", "persona que trabaja"], fr: ["metier", "profession", "travail", "job"], en: ["job", "profession", "work"] },
  { key: "isObject", es: ["objeto", "cosa", "puedes tocar"], fr: ["objet", "chose", "toucher"], en: ["object", "thing"] },
  { key: "isAlive", es: ["vivo", "vive", "vida", "ser vivo"], fr: ["vivant", "vit", "vie", "etre vivant"], en: ["alive", "living", "live"] },
  { key: "largerThanBreadbox", es: ["mas grande", "grande", "grandeza", "caja de pan"], fr: ["plus grand", "grand", "boite a pain"], en: ["bigger", "larger", "breadbox", "size"] },
  { key: "foundIndoors", es: ["adentro", "interior", "casa", "dentro"], fr: ["interieur", "dedans", "maison", "a l interieur"], en: ["indoors", "inside", "house", "indoor"] },
];

function detectLanguageOfQuestion(q: string, expected: string): boolean {
  const n = normalize(q);
  const esMarkers = ["es ", "esta", "tiene", "puede", "eres", "vives", "comes", "¿", "que ", "cual"];
  const frMarkers = ["est ", "est-ce", "as-tu", "peut", "viv", "mange", "quoi", "quel", "une ", "un "];
  const esHits = esMarkers.filter((m) => n.includes(normalize(m))).length;
  const frHits = frMarkers.filter((m) => n.includes(normalize(m))).length;
  if (expected === "fr") return frHits >= esHits && (frHits > 0 || /[àâäéèêëïîôùûç]/.test(q.toLowerCase()));
  return esHits >= frHits && (esHits > 0 || /[áéíóúñ¿¡]/.test(q.toLowerCase()) || n.startsWith("es ") || n.includes(" es "));
}

function resolveAttribute(question: string, language: string): AttrKey | null {
  const n = normalize(question);
  for (const row of ATTR_KEYWORDS) {
    const keys = language === "fr" ? row.fr : row.es;
    if (keys.some((k) => n.includes(normalize(k)))) return row.key;
    if (row.en.some((k) => n.includes(normalize(k)))) return row.key;
  }
  return null;
}

export function answerYesNo(
  secret: Secret,
  question: string,
  language: string,
): { isCorrectLanguage: boolean; responseText: string } {
  const langName = language === "fr" ? "French" : "Spanish";
  if (!detectLanguageOfQuestion(question, language)) {
    return {
      isCorrectLanguage: false,
      responseText: `Please ask your question in ${langName}!`,
    };
  }

  const attr = resolveAttribute(question, language);
  const yes = language === "fr" ? "Oui !" : "¡Sí!";
  const no = language === "fr" ? "Non." : "No.";
  const unsure =
    language === "fr"
      ? "Je ne suis pas sûr de comprendre. Essaie une autre question."
      : "No estoy seguro de entender. Prueba otra pregunta.";

  if (!attr) {
    return { isCorrectLanguage: true, responseText: unsure };
  }

  const value = secret.attributes[attr];
  // Negated questions ("no es…", "n'est pas…") flip the answer
  const n = normalize(question);
  const negated =
    n.includes(" no ") ||
    n.startsWith("no ") ||
    n.includes("nunca") ||
    n.includes("pas ") ||
    n.includes(" n est ") ||
    n.includes("nest pas") ||
    n.includes("ne sont");

  const answer = negated ? !value : value;
  return { isCorrectLanguage: true, responseText: answer ? yes : no };
}

export function evaluateGuess(
  secret: Secret,
  guess: string,
): { correct: boolean; message: string } {
  const g = normalize(guess);
  const en = normalize(secret.wordInEnglish);
  const tl = normalize(secret.wordInTargetLanguage);
  const correct =
    g === en ||
    g === tl ||
    g.includes(en) ||
    g.includes(tl) ||
    en.includes(g) ||
    tl.includes(g);

  // Detect response language from secret target word orthography heuristics
  const isFr = /[àâäéèêëïîôùûçœæ]/.test(secret.wordInTargetLanguage) ||
    ["chat", "chien", "pomme", "pain", "ecole", "école", "plage", "medecin", "médecin", "professeur", "chaise", "livre", "cafe", "café", "arbre", "velo", "vélo", "cuisine", "poisson", "fromage"].includes(tl);

  if (correct) {
    return {
      correct: true,
      message: isFr
        ? `Bravo ! C'était bien « ${secret.wordInTargetLanguage} ».`
        : `¡Muy bien! Era « ${secret.wordInTargetLanguage} ».`,
    };
  }
  return {
    correct: false,
    message: isFr
      ? `Pas tout à fait. La réponse était « ${secret.wordInTargetLanguage} ».`
      : `Casi… La respuesta era « ${secret.wordInTargetLanguage} ».`,
  };
}
