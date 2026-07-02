import type { Question } from "./questions";

// ── French questions ──────────────────────────────────────────────────────────

export const QUESTIONS_FR: Question[] = [
  // A1 band
  {
    id: 112,
    band: "A1",
    prompt: 'How do you say "hello" in French?',
    options: [
      { label: "Au revoir", value: "A" },
      { label: "Merci", value: "B" },
      { label: "S'il vous plaît", value: "C" },
      { label: "Bonjour", value: "D" },
    ],
    correct: "D",
  },
  {
    id: 113,
    band: "A1",
    prompt: "Quelle est la forme correcte ? « Je ___ à Paris. »",
    options: [
      { label: "vivent", value: "A" },
      { label: "vivons", value: "B" },
      { label: "vis", value: "C" },
      { label: "vivez", value: "D" },
    ],
    correct: "C",
  },
  {
    id: 114,
    band: "A1",
    prompt: "Complète : « ___ livre est sur la table. »",
    options: [
      { label: "La", value: "A" },
      { label: "Le", value: "B" },
      { label: "Les", value: "C" },
      { label: "Une", value: "D" },
    ],
    correct: "B",
  },

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

  // C1 band
  {
    id: 115,
    band: "C1",
    prompt: "Complète avec le subjonctif présent : « Il a accepté à condition que nous ___ les frais. »",
    options: [
      { label: "payons", value: "A" },
      { label: "payions", value: "B" },
      { label: "avons payé", value: "C" },
      { label: "paierions", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 116,
    band: "C1",
    prompt:
      "Lisez : «La proposition fut accueillie avec réticence par les délégués.» Que signifie «réticence» ?",
    options: [
      { label: "Enthusiasm", value: "A" },
      { label: "Reluctance / hesitation", value: "B" },
      { label: "Confusion", value: "C" },
      { label: "Approval", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 117,
    band: "C1",
    prompt: "Transformez en discours indirect : «'Je serai là demain', dit-elle.»",
    options: [
      { label: "Elle dit qu'elle sera là le lendemain.", value: "A" },
      { label: "Elle dit qu'elle serait là le lendemain.", value: "B" },
      { label: "Elle dit qu'elle soit là le lendemain.", value: "C" },
      { label: "Elle dit qu'elle était là le lendemain.", value: "D" },
    ],
    correct: "B",
  },

  // C2 band
  {
    id: 118,
    band: "C2",
    prompt:
      "Lisez : «Les vagues frappaient le rivage comme des mains désespérées cherchant à s'échapper.» Quel procédé stylistique est utilisé ?",
    options: [
      { label: "Métaphore", value: "A" },
      { label: "Hyperbole", value: "B" },
      { label: "Comparaison", value: "C" },
      { label: "Personnification", value: "D" },
    ],
    correct: "C",
  },
  {
    id: 119,
    band: "C2",
    prompt: "Quelle est la différence sémantique entre «tuer» et «assassiner» ?",
    options: [
      { label: "Ce sont des synonymes exacts.", value: "A" },
      { label: "«Assassiner» implique la préméditation ; «tuer» est plus général.", value: "B" },
      { label: "«Tuer» est formel ; «assassiner» est familier.", value: "C" },
      { label: "«Assassiner» ne s'emploie qu'à l'écrit.", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 120,
    band: "C2",
    prompt:
      "Dans quel registre de langue se situe : «On s'est bien marrés à la soirée de Kévin, franchement c'était ouf !» ?",
    options: [
      { label: "Soutenu (formal)", value: "A" },
      { label: "Standard", value: "B" },
      { label: "Familier (colloquial)", value: "C" },
      { label: "Technique", value: "D" },
    ],
    correct: "C",
  },
];
