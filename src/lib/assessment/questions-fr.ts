import type { Question } from "./questions";

// ── French questions ──────────────────────────────────────────────────────────

export const QUESTIONS_FR: Question[] = [
  // A2 band
  {
    id: 101,
    band: "A2",
    prompt: "Quelle est la forme correcte ? « Elle ___ au marché hier. »",
    options: [
      { label: "va", value: "A" },
      { label: "est allée", value: "B" },
      { label: "ira", value: "C" },
      { label: "allait", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 102,
    band: "A2",
    prompt: 'Choose the correct French translation of "I have two sisters."',
    options: [
      { label: "J'ai deux sœurs.", value: "A" },
      { label: "J'avais deux sœurs.", value: "B" },
      { label: "J'aurai deux sœurs.", value: "C" },
      { label: "J'eus deux sœurs.", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 103,
    band: "A2",
    prompt: "Quel article convient ? « ___ voiture de ma mère est rouge. »",
    options: [
      { label: "Le", value: "A" },
      { label: "La", value: "B" },
      { label: "Les", value: "C" },
      { label: "Un", value: "D" },
    ],
    correct: "B",
  },

  // B1 band
  {
    id: 104,
    band: "B1",
    prompt: "Complète la phrase : « Je voudrais qu'elle ___ à temps. » (subjonctif)",
    options: [
      { label: "arrive", value: "A" },
      { label: "arrivera", value: "B" },
      { label: "est arrivée", value: "C" },
      { label: "arriverait", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 105,
    band: "B1",
    prompt:
      "Select the sentence that correctly uses the imparfait vs. passé composé: «When I was a child, I used to play football.»",
    options: [
      { label: "Quand j'étais enfant, j'ai joué au football.", value: "A" },
      { label: "Quand j'ai été enfant, je jouais au football.", value: "B" },
      { label: "Quand j'étais enfant, je jouais au football.", value: "C" },
      { label: "Quand j'ai été enfant, j'ai joué au football.", value: "D" },
    ],
    correct: "C",
  },
  {
    id: 106,
    band: "B1",
    prompt: "Que signifie « par conséquent » dans un texte argumentatif ?",
    options: [
      { label: "Cependant / however", value: "A" },
      { label: "De plus / furthermore", value: "B" },
      { label: "C'est pourquoi / therefore", value: "C" },
      { label: "À cause de / because of", value: "D" },
    ],
    correct: "C",
  },
  {
    id: 107,
    band: "B1",
    prompt: "Complète : « Si j'avais plus de temps, je ___ davantage. » (conditionnel)",
    options: [
      { label: "lirai", value: "A" },
      { label: "lirais", value: "B" },
      { label: "lis", value: "C" },
      { label: "lise", value: "D" },
    ],
    correct: "B",
  },

  // B2 band
  {
    id: 108,
    band: "B2",
    prompt: "Quelle est la voix passive correcte de « Le chef a préparé le dîner » ?",
    options: [
      { label: "Le dîner a été préparé par le chef.", value: "A" },
      { label: "Le dîner s'est préparé par le chef.", value: "B" },
      { label: "Le dîner était préparé par le chef.", value: "C" },
      { label: "Le dîner a préparé le chef.", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 109,
    band: "B2",
    prompt:
      "Which option correctly expresses the hypothetical past: «If she had studied, she would have passed.»",
    options: [
      { label: "Si elle étudiait, elle aurait réussi.", value: "A" },
      { label: "Si elle avait étudié, elle aurait réussi.", value: "B" },
      { label: "Si elle avait étudié, elle avait réussi.", value: "C" },
      { label: "Si elle étudierait, elle aurait réussi.", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 110,
    band: "B2",
    prompt: "Quel est le synonyme de « éphémère » ?",
    options: [
      { label: "Durable", value: "A" },
      { label: "Passager", value: "B" },
      { label: "Constant", value: "C" },
      { label: "Profond", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 111,
    band: "B2",
    prompt:
      "Read the excerpt: «Bien que les circonstances fussent défavorables, l'équipe persévéra.» What does «défavorables» mean?",
    options: [
      { label: "Favourable", value: "A" },
      { label: "Unpredictable", value: "B" },
      { label: "Unfavourable / challenging", value: "C" },
      { label: "Ordinary", value: "D" },
    ],
    correct: "C",
  },
];
