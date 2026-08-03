/**
 * Programmatic crossword seed builder — no API required.
 * Run: npm run build:crosswords
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CROSSWORD_TEMPLATES, type CrosswordTemplate } from "../src/lib/crossword/templates";
import { assemblePuzzle } from "../src/lib/crossword/validate";
import type { CrosswordPuzzle } from "../src/lib/crossword/puzzles";

type WordClue = { word: string; clue: string };

const ES_WORDS: Record<number, WordClue[]> = {
  3: [
    { word: "MAR", clue: "The sea" },
    { word: "SOL", clue: "The sun" },
    { word: "PAN", clue: "Bread" },
    { word: "LUZ", clue: "Light" },
    { word: "ROL", clue: "A role" },
    { word: "TAL", clue: "Such; so" },
    { word: "OJO", clue: "Eye" },
    { word: "REY", clue: "King" },
    { word: "LEY", clue: "Law" },
    { word: "MES", clue: "Month" },
    { word: "RIO", clue: "River" },
    { word: "SAL", clue: "Salt" },
    { word: "VIA", clue: "Road" },
    { word: "SUR", clue: "South" },
    { word: "PIE", clue: "Foot" },
    { word: "UNO", clue: "One" },
    { word: "DOS", clue: "Two" },
    { word: "RED", clue: "Net; network" },
    { word: "TEA", clue: "Tea" },
    { word: "DIA", clue: "Day" },
  ],
  4: [
    { word: "MESA", clue: "Table" },
    { word: "META", clue: "Goal" },
    { word: "CASA", clue: "House" },
    { word: "SALA", clue: "Living room" },
    { word: "PATO", clue: "Duck" },
    { word: "GATO", clue: "Cat" },
    { word: "LAGO", clue: "Lake" },
    { word: "MANO", clue: "Hand" },
    { word: "AMOR", clue: "Love" },
    { word: "LUNA", clue: "Moon" },
    { word: "RISA", clue: "Laughter" },
    { word: "SOPA", clue: "Soup" },
    { word: "VIDA", clue: "Life" },
    { word: "CINE", clue: "Cinema" },
    { word: "MOTO", clue: "Motorcycle" },
    { word: "RANA", clue: "Frog" },
    { word: "BOCA", clue: "Mouth" },
    { word: "ELLO", clue: "It (neutral)" },
    { word: "PAIS", clue: "Country" },
    { word: "AGUA", clue: "Water" },
    { word: "HORA", clue: "Hour" },
    { word: "HIJO", clue: "Son" },
  ],
  5: [
    { word: "BUENO", clue: "Good" },
    { word: "CALLE", clue: "Street" },
    { word: "VERDE", clue: "Green" },
    { word: "MUNDO", clue: "World" },
    { word: "NOCHE", clue: "Night" },
    { word: "FELIZ", clue: "Happy" },
    { word: "CIELO", clue: "Sky" },
    { word: "PLATO", clue: "Plate" },
    { word: "SUELO", clue: "Ground" },
    { word: "HOGAR", clue: "Home" },
    { word: "GUSTO", clue: "Taste" },
    { word: "CLASE", clue: "Class" },
    { word: "PUNTO", clue: "Point" },
    { word: "LIBRO", clue: "Book" },
    { word: "CAMPO", clue: "Field" },
    { word: "PLAYA", clue: "Beach" },
    { word: "PERRO", clue: "Dog" },
    { word: "TARDE", clue: "Afternoon" },
    { word: "NORTE", clue: "North" },
    { word: "COCHE", clue: "Car" },
    { word: "PAPEL", clue: "Paper" },
    { word: "RADIO", clue: "Radio" },
    { word: "GRADO", clue: "Degree" },
    { word: "LUNES", clue: "Monday" },
  ],
  6: [
    { word: "CIUDAD", clue: "City" },
    { word: "COMIDA", clue: "Food" },
    { word: "TIEMPO", clue: "Time; weather" },
    { word: "DINERO", clue: "Money" },
    { word: "CAMINO", clue: "Path; road" },
    { word: "PUERTA", clue: "Door" },
    { word: "VERANO", clue: "Summer" },
    { word: "MANANA", clue: "Morning; tomorrow" },
    { word: "AMIGOS", clue: "Friends" },
    { word: "JARDIN", clue: "Garden" },
    { word: "LENGUA", clue: "Language; tongue" },
    { word: "MUSICA", clue: "Music" },
    { word: "PUEBLO", clue: "Town; people" },
    { word: "QUERER", clue: "To want; to love" },
    { word: "SABADO", clue: "Saturday" },
    { word: "TIENDA", clue: "Shop" },
    { word: "ULTIMO", clue: "Last" },
    { word: "VIAJAR", clue: "To travel" },
    { word: "ABUELO", clue: "Grandfather" },
    { word: "FUTURO", clue: "Future" },
    { word: "GRANDE", clue: "Big" },
    { word: "OLVIDO", clue: "Forgetfulness" },
    { word: "PADRES", clue: "Parents" },
    { word: "RUIDOS", clue: "Noises" },
    { word: "ESCOLA", clue: "School (adj. root)" },
    { word: "FLORES", clue: "Flowers" },
    { word: "GRADOS", clue: "Degrees" },
    { word: "HABLAD", clue: "Speak (imperative pl.)" },
    { word: "JUEGOS", clue: "Games" },
    { word: "LIBROS", clue: "Books" },
    { word: "NOCHES", clue: "Nights" },
    { word: "PLATOS", clue: "Plates" },
    { word: "SALIDA", clue: "Exit" },
    { word: "TARDE", clue: "Afternoon" },
  ].filter((w) => w.word.length === 6),
  7: [
    { word: "ESCUELA", clue: "School" },
    { word: "TRABAJO", clue: "Work; job" },
    { word: "FAMILIA", clue: "Family" },
    { word: "HERMANO", clue: "Brother" },
    { word: "HERMANA", clue: "Sister" },
    { word: "MAESTRO", clue: "Teacher (m)" },
    { word: "VENTANA", clue: "Window" },
    { word: "COLEGIO", clue: "School; college" },
    { word: "CAMINAR", clue: "To walk" },
    { word: "ESTUDIO", clue: "Study" },
    { word: "LLAMADA", clue: "Call; phone call" },
    { word: "MERCADO", clue: "Market" },
    { word: "PALABRA", clue: "Word" },
    { word: "QUIERES", clue: "You want" },
    { word: "RESPETO", clue: "Respect" },
    { word: "SISTEMA", clue: "System" },
    { word: "TERMINO", clue: "Term; end" },
    { word: "VIAJERO", clue: "Traveler" },
    { word: "ZAPATOS", clue: "Shoes" },
    { word: "ABIERTO", clue: "Open" },
    { word: "BONITOS", clue: "Pretty (m pl)" },
    { word: "CERRADO", clue: "Closed" },
    { word: "DERECHO", clue: "Right; law" },
    { word: "ESCRIBE", clue: "He/she writes" },
    { word: "LECTURA", clue: "Reading" },
    { word: "MANZANA", clue: "Apple" },
    { word: "NARANJA", clue: "Orange (fruit)" },
    { word: "OCUPADO", clue: "Busy" },
    { word: "PEQUENO", clue: "Small" },
    { word: "LECTURA", clue: "Reading" },
  ].filter((w) => w.word.length === 7),
  8: [
    { word: "TELEFONO", clue: "Telephone" },
    { word: "INVIERNO", clue: "Winter" },
    { word: "ORDENADO", clue: "Tidy; ordered" },
    { word: "APRENDER", clue: "To learn" },
    { word: "ESCRIBIR", clue: "To write" },
    { word: "HOSPITAL", clue: "Hospital" },
    { word: "JUGUETES", clue: "Toys" },
    { word: "MONTANAS", clue: "Mountains" },
    { word: "NOTICIAS", clue: "News" },
    { word: "OCUPADOS", clue: "Busy (m pl)" },
    { word: "PREGUNTA", clue: "Question" },
    { word: "SENTIRSE", clue: "To feel" },
    { word: "TRABAJAR", clue: "To work" },
    { word: "VACACION", clue: "Vacation (sing.)" },
    { word: "ABUELITA", clue: "Granny" },
    { word: "CALLEJON", clue: "Alley" },
    { word: "DOMINGOS", clue: "Sundays" },
    { word: "ESTACION", clue: "Station; season" },
    { word: "GUARDAR", clue: "To keep; save" },
    { word: "HISTORIA", clue: "History; story" },
    { word: "AMIGABLE", clue: "Friendly" },
    { word: "UNIVERSO", clue: "Universe" },
    { word: "CANCIONE", clue: "Song form" },
    { word: "DERECHOS", clue: "Rights" },
    { word: "ESCUELAS", clue: "Schools" },
    { word: "FAMILIAS", clue: "Families" },
    { word: "HERMANOS", clue: "Brothers" },
    { word: "MAESTROS", clue: "Teachers" },
    { word: "VENTANAS", clue: "Windows" },
  ].filter((w) => w.word.length === 8),
  9: [
    { word: "PRIMAVERA", clue: "Spring (season)" },
    { word: "ORDENADOR", clue: "Computer" },
    { word: "FELICIDAD", clue: "Happiness" },
    { word: "NECESIDAD", clue: "Need; necessity" },
    { word: "PROFESORA", clue: "Teacher (f)" },
    { word: "TELEFONOS", clue: "Telephones" },
    { word: "JARDINERO", clue: "Gardener" },
    { word: "OCASIONAL", clue: "Occasional" },
    { word: "COMPUTADO", clue: "Computed" },
    { word: "DESCANSAR", clue: "To rest" },
    { word: "LECCIONES", clue: "Lessons" },
    { word: "HABITANTE", clue: "Inhabitant" },
    { word: "RESPUESTA", clue: "Answer" },
    { word: "TRABAJADO", clue: "Worked" },
    { word: "APRENDIDO", clue: "Learned" },
    { word: "ESCRIBIEN", clue: "Writing (stem)" },
    { word: "HERMANITO", clue: "Little brother" },
    { word: "MERCADO", clue: "Market" },
  ].filter((w) => w.word.length === 9),
};

const FR_WORDS: Record<number, WordClue[]> = {
  3: [
    { word: "AMI", clue: "Friend (m)" },
    { word: "ILE", clue: "Island" },
    { word: "MER", clue: "Sea" },
    { word: "ROI", clue: "King" },
    { word: "LIT", clue: "Bed" },
    { word: "VIN", clue: "Wine" },
    { word: "JEU", clue: "Game" },
    { word: "PAR", clue: "By; through" },
    { word: "SEL", clue: "Salt" },
    { word: "VIE", clue: "Life" },
    { word: "NEZ", clue: "Nose" },
    { word: "POT", clue: "Pot" },
    { word: "RUE", clue: "Street" },
    { word: "SAC", clue: "Bag" },
    { word: "THE", clue: "Tea" },
    { word: "EAU", clue: "Water" },
    { word: "BUS", clue: "Bus" },
  ],
  4: [
    { word: "AMIE", clue: "Friend (f)" },
    { word: "ILES", clue: "Islands" },
    { word: "LUNE", clue: "Moon" },
    { word: "NUIT", clue: "Night" },
    { word: "PAIN", clue: "Bread" },
    { word: "MAIN", clue: "Hand" },
    { word: "CHAT", clue: "Cat" },
    { word: "VERT", clue: "Green" },
    { word: "ROSE", clue: "Pink" },
    { word: "VIES", clue: "Lives" },
    { word: "GARE", clue: "Station" },
    { word: "PONT", clue: "Bridge" },
    { word: "LENT", clue: "Slow" },
    { word: "DENT", clue: "Tooth" },
    { word: "COUR", clue: "Yard" },
    { word: "BLEU", clue: "Blue" },
    { word: "JOIE", clue: "Joy" },
    { word: "PORT", clue: "Port" },
    { word: "VENT", clue: "Wind" },
    { word: "MERE", clue: "Mother" },
    { word: "PERE", clue: "Father" },
  ],
  5: [
    { word: "MONDE", clue: "World" },
    { word: "ROUGE", clue: "Red" },
    { word: "IDOLE", clue: "Idol" },
    { word: "MERCI", clue: "Thank you" },
    { word: "TABLE", clue: "Table" },
    { word: "FLEUR", clue: "Flower" },
    { word: "PLAGE", clue: "Beach" },
    { word: "COEUR", clue: "Heart" },
    { word: "VILLE", clue: "City" },
    { word: "PARIS", clue: "Paris" },
    { word: "GRAND", clue: "Big" },
    { word: "BLANC", clue: "White" },
    { word: "ECOLE", clue: "School" },
    { word: "FRUIT", clue: "Fruit" },
    { word: "CHIEN", clue: "Dog" },
    { word: "LIVRE", clue: "Book" },
    { word: "PORTE", clue: "Door" },
    { word: "TEMPS", clue: "Time; weather" },
    { word: "ROUTE", clue: "Road" },
    { word: "JOUER", clue: "To play" },
    { word: "HEURE", clue: "Hour" },
    { word: "PIECE", clue: "Room; coin" },
  ],
  6: [
    { word: "MAISON", clue: "House" },
    { word: "ECOLES", clue: "Schools" },
    { word: "FLEURS", clue: "Flowers" },
    { word: "GATEAU", clue: "Cake" },
    { word: "HOTELS", clue: "Hotels" },
    { word: "JARDIN", clue: "Garden" },
    { word: "LANGUE", clue: "Language" },
    { word: "NATURE", clue: "Nature" },
    { word: "ORANGE", clue: "Orange" },
    { word: "PARLER", clue: "To speak" },
    { word: "QUITTE", clue: "Leaves; quits" },
    { word: "REGARD", clue: "Look; gaze" },
    { word: "SOLEIL", clue: "Sun" },
    { word: "VOYAGE", clue: "Trip" },
    { word: "ANIMAL", clue: "Animal" },
    { word: "CHEMIN", clue: "Path" },
    { word: "DINERS", clue: "Dinners" },
    { word: "FERMER", clue: "To close" },
    { word: "GARDER", clue: "To keep" },
    { word: "LIVRES", clue: "Books" },
    { word: "MARCHE", clue: "Market; walk" },
    { word: "OUVRIR", clue: "To open" },
    { word: "PENSER", clue: "To think" },
    { word: "SORTIR", clue: "To go out" },
  ],
  7: [
    { word: "FAMILLE", clue: "Family" },
    { word: "VOITURE", clue: "Car" },
    { word: "MUSIQUE", clue: "Music" },
    { word: "TRAVAIL", clue: "Work" },
    { word: "JOURNEE", clue: "Day" },
    { word: "CUISINE", clue: "Kitchen; cooking" },
    { word: "FENETRE", clue: "Window" },
    { word: "LECTURE", clue: "Reading" },
    { word: "OUVRAGE", clue: "Work; book" },
    { word: "PARLENT", clue: "They speak" },
    { word: "REPONSE", clue: "Answer" },
    { word: "SEMAINE", clue: "Week" },
    { word: "THEATRE", clue: "Theater" },
    { word: "VOYAGER", clue: "To travel" },
    { word: "ANIMAUX", clue: "Animals" },
    { word: "BONJOUR", clue: "Hello" },
    { word: "CHANTER", clue: "To sing" },
    { word: "DANSER", clue: "To dance" },
    { word: "ECRIRE", clue: "To write" },
    { word: "GRANDE", clue: "Big (f)" },
    { word: "HABITER", clue: "To live" },
    { word: "MANGER", clue: "To eat" },
    { word: "PARLONS", clue: "Let's speak" },
    { word: "REGARDS", clue: "Looks" },
  ],
  8: [
    { word: "HISTOIRE", clue: "History; story" },
    { word: "QUESTION", clue: "Question" },
    { word: "FRANCAIS", clue: "French" },
    { word: "VACANCES", clue: "Vacation" },
    { word: "CUISINER", clue: "To cook" },
    { word: "ECRIVAIN", clue: "Writer" },
    { word: "FENETRES", clue: "Windows" },
    { word: "GRANDEUR", clue: "Greatness" },
    { word: "HOPITAUX", clue: "Hospitals" },
    { word: "LIBRAIRE", clue: "Bookseller" },
    { word: "MONTAGNE", clue: "Mountain" },
    { word: "NOUVELLE", clue: "News; short story" },
    { word: "PARLERAI", clue: "I will speak" },
    { word: "REGARDER", clue: "To look" },
    { word: "SEMAINES", clue: "Weeks" },
    { word: "VOITURES", clue: "Cars" },
    { word: "APPRENDS", clue: "You learn" },
    { word: "BONHEURS", clue: "Happiness (pl)" },
    { word: "CHANTENT", clue: "They sing" },
    { word: "DORMIRAI", clue: "I will sleep" },
  ],
  9: [
    { word: "APPRENDRE", clue: "To learn" },
    { word: "TELEPHONE", clue: "Telephone" },
    { word: "IMPORTANT", clue: "Important" },
    { word: "PROFESSEUR", clue: "Teacher" },
    { word: "RESTAURANT", clue: "Restaurant" },
    { word: "UNIVERSITE", clue: "University" },
    { word: "VACANCIER", clue: "Holidaymaker" },
    { word: "ETUDIANTE", clue: "Student (f)" },
    { word: "JARDINAGE", clue: "Gardening" },
    { word: "LIBRAIRIE", clue: "Bookstore" },
    { word: "MONTAGNES", clue: "Mountains" },
    { word: "HABITANTS", clue: "Inhabitants" },
    { word: "CUISINIER", clue: "Cook (m)" },
    { word: "CHANTIONS", clue: "We were singing" },
    { word: "DORMIRAIS", clue: "You would sleep" },
    { word: "ECOLEMENT", clue: "Schooling form" },
    { word: "FERMERENT", clue: "They closed (hist.)" },
    { word: "GARDERENT", clue: "They kept (hist.)" },
    { word: "HABITERAI", clue: "I will live" },
  ].filter((w) => w.word.length === 9),
};

const TITLES_ES = [
  "En la cocina",
  "Por la ciudad",
  "En la naturaleza",
  "En familia",
  "En el trabajo",
  "Tiempo libre",
  "Los animales",
  "Arte y música",
  "De compras",
  "Salud",
  "Sentimientos",
  "La tecnología",
];

const TITLES_FR = [
  "À la cuisine",
  "En ville",
  "La nature",
  "En famille",
  "Au travail",
  "Les loisirs",
  "Les animaux",
  "Art et musique",
  "Les courses",
  "La santé",
  "Les émotions",
  "La technologie",
];

function wordsOfLength(dict: Record<number, WordClue[]>, len: number): WordClue[] {
  return (dict[len] ?? []).filter((w) => w.word.length === len);
}

/** Backtracking filler — much more reliable than pure random for larger grids. */
function fillTemplate(
  template: CrosswordTemplate,
  dict: Record<number, WordClue[]>,
  usedSignatures: Set<string>,
): CrosswordPuzzle | null {
  const slots = template.slots;
  const byLength = new Map<number, WordClue[]>();
  for (const slot of slots) {
    if (!byLength.has(slot.length)) {
      const words = wordsOfLength(dict, slot.length);
      if (words.length === 0) {
        console.warn(`  No words of length ${slot.length} for ${template.id}`);
        return null;
      }
      // Shuffle once per length bucket
      byLength.set(slot.length, [...words].sort(() => Math.random() - 0.5));
    }
  }

  const chosen: (WordClue | null)[] = slots.map(() => null);
  const gridLetters = new Map<string, string>();

  function cellKey(r: number, c: number) {
    return `${r},${c}`;
  }

  function placeLetters(slotIndex: number, word: string): Array<[string, string | undefined]> {
    const slot = slots[slotIndex]!;
    const undo: Array<[string, string | undefined]> = [];
    for (let i = 0; i < word.length; i++) {
      const r = slot.direction === "across" ? slot.row : slot.row + i;
      const c = slot.direction === "down" ? slot.col : slot.col + i;
      const key = cellKey(r, c);
      undo.push([key, gridLetters.get(key)]);
      gridLetters.set(key, word[i]!);
    }
    return undo;
  }

  function fits(slotIndex: number, word: string): boolean {
    const slot = slots[slotIndex]!;
    for (let i = 0; i < word.length; i++) {
      const r = slot.direction === "across" ? slot.row : slot.row + i;
      const c = slot.direction === "down" ? slot.col : slot.col + i;
      const existing = gridLetters.get(cellKey(r, c));
      if (existing && existing !== word[i]) return false;
    }
    return true;
  }

  function restore(undo: Array<[string, string | undefined]>) {
    for (const [key, prev] of undo) {
      if (prev === undefined) gridLetters.delete(key);
      else gridLetters.set(key, prev);
    }
  }

  // Fill most constrained (longest / fewest candidates) first
  const order = slots
    .map((_, i) => i)
    .sort((a, b) => {
      const la = byLength.get(slots[a]!.length)!.length;
      const lb = byLength.get(slots[b]!.length)!.length;
      if (slots[a]!.length !== slots[b]!.length) {
        return slots[b]!.length - slots[a]!.length;
      }
      return la - lb;
    });

  let solutions = 0;
  const maxAttempts = 3; // reshuffle and retry a few times
  let result: CrosswordPuzzle | null = null;

  function search(depth: number): boolean {
    if (depth === order.length) {
      const entries = slots.map((slot, i) => ({
        number: slot.number,
        direction: slot.direction,
        row: slot.row,
        col: slot.col,
        answer: chosen[i]!.word,
        clue: chosen[i]!.clue,
      }));
      const signature = entries.map((e) => e.answer).sort().join("|");
      if (usedSignatures.has(signature)) return false;

      const puzzle = assemblePuzzle("temp", "es", "temp", template, entries);
      if (!puzzle) return false;

      usedSignatures.add(signature);
      result = puzzle;
      solutions++;
      return true;
    }

    const slotIndex = order[depth]!;
    const candidates = byLength.get(slots[slotIndex]!.length)!;
    // Try a random rotation of candidates each depth for variety
    const start = Math.floor(Math.random() * candidates.length);

    for (let offset = 0; offset < candidates.length; offset++) {
      const word = candidates[(start + offset) % candidates.length]!;
      // Avoid using the same surface form twice in one puzzle
      if (chosen.some((c) => c?.word === word.word)) continue;
      if (!fits(slotIndex, word.word)) continue;

      const undo = placeLetters(slotIndex, word.word);
      chosen[slotIndex] = word;
      if (search(depth + 1)) return true;
      chosen[slotIndex] = null;
      restore(undo);
    }
    return false;
  }

  for (let attempt = 0; attempt < maxAttempts && !result; attempt++) {
    for (const [len, words] of byLength) {
      byLength.set(len, [...words].sort(() => Math.random() - 0.5));
    }
    gridLetters.clear();
    chosen.fill(null);
    search(0);
  }

  void solutions;
  return result;
}

function buildBank(
  language: "es" | "fr",
  dict: Record<number, WordClue[]>,
  titles: string[],
  count: number,
): CrosswordPuzzle[] {
  const puzzles: CrosswordPuzzle[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const preferred = CROSSWORD_TEMPLATES[i % CROSSWORD_TEMPLATES.length]!;
    // Prefer the rotating template; fall back through the full set if needed
    const candidates = [
      preferred,
      ...CROSSWORD_TEMPLATES.filter((t) => t.id !== preferred.id),
    ];

    let found: CrosswordPuzzle | null = null;
    let usedTemplate = preferred;
    for (const template of candidates) {
      found = fillTemplate(template, dict, used);
      if (found) {
        usedTemplate = template;
        break;
      }
    }

    if (found) {
      found.id = `${language}-ai-${puzzles.length + 1}`;
      found.language = language;
      found.title = titles[i % titles.length]!;
      puzzles.push(found);
      const longest = Math.max(...found.entries.map((e) => e.answer.length));
      console.log(
        `  ✓ ${found.id} (${usedTemplate.id}, max ${longest} letters): ${found.title}`,
      );
    } else {
      console.warn(`  ✗ Failed to fill any template for ${language} #${i + 1}`);
    }
  }

  return puzzles;
}

function serializePuzzle(p: CrosswordPuzzle): string {
  const grid = JSON.stringify(p.grid, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join("\n");
  const entries = p.entries
    .map(
      (e) =>
        `    { number: ${e.number}, direction: "${e.direction}", row: ${e.row}, col: ${e.col}, answer: "${e.answer}", clue: ${JSON.stringify(e.clue)} }`,
    )
    .join(",\n");
  return `  {
    id: "${p.id}",
    language: "${p.language}",
    title: ${JSON.stringify(p.title)},
    grid: ${grid},
    entries: [
${entries}
    ],
  }`;
}

// Ensure length buckets are exact
for (const dict of [ES_WORDS, FR_WORDS]) {
  for (const [lenStr, words] of Object.entries(dict)) {
    const len = Number(lenStr);
    dict[len] = words.filter((w) => w.word.length === len);
  }
}

const COUNT = 12;
console.log("Building ES puzzles…");
const es = buildBank("es", ES_WORDS, TITLES_ES, COUNT);
console.log("Building FR puzzles…");
const fr = buildBank("fr", FR_WORDS, TITLES_FR, COUNT);

console.log(`Built ${es.length} ES + ${fr.length} FR puzzles`);

if (es.length === 0 && fr.length === 0) {
  console.error("No puzzles built — aborting write");
  process.exit(1);
}

writeFileSync(
  resolve(process.cwd(), "src/lib/crossword/generated.ts"),
  `/**
 * Generated crossword bank (built via npm run build:crosswords).
 * For AI generation when Gemini quota allows: npm run generate:crosswords
 */
import type { CrosswordPuzzle } from "@/lib/crossword/puzzles";

export const GENERATED_PUZZLES_ES: CrosswordPuzzle[] = [
${es.map(serializePuzzle).join(",\n")}
];

export const GENERATED_PUZZLES_FR: CrosswordPuzzle[] = [
${fr.map(serializePuzzle).join(",\n")}
];
`,
  "utf8",
);
