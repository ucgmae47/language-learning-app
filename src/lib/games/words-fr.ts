/**
 * Common 5-letter French words for Wordle.
 * All uppercase, no accent marks (simplifies keyboard input).
 */
export const WORDS_FR: string[] = [
  "MONDE", "NUITS", "PLAGE", "FLEUR", "COEUR", "TEMPS", "LIVRE", "TIGRE",
  "AIGLE", "FEMME", "HOMME", "TABLE", "CHIEN", "CHATS", "ARBRE", "ECOLE",
  "POIRE", "POMME", "VERRE", "TERRE", "BIERE", "PIZZA", "TARTE", "SAUCE",
  "SOUPE", "SUCRE", "FROID", "CHAUD", "LENTE", "BELLE", "FORTE", "DOUCE",
  "DROLE", "RICHE", "BRAVE", "FILLE", "FRERE", "SOEUR", "AVION", "TRAIN",
  "ROUTE", "PLEIN", "RONDE", "HIVER", "NUAGE", "PLUIE", "NEIGE", "LAPIN",
  "VACHE", "POULE", "FORET", "OCEAN", "USINE", "HOTEL", "SPORT", "STADE",
  "MATCH", "SCORE", "LUTTE", "DANSE", "PIANO", "ALBUM", "RADIO", "FILMS",
  "SCENE", "VIRUS", "CORPS", "PIEDS", "MAINS", "DOIGT", "FOYER", "PORTE",
  "MURAL", "NOIRE", "BLANC", "ROUGE", "VERTE", "BLEUS", "BRUIT", "CALME",
  "CRANE", "CRAVE", "CRIME", "CROIS", "CROIX", "CRUEL", "DEBUT", "DEGAT",
  "DELTA", "DENSE", "DEPOT", "DESIR", "DETTE", "DIGNE", "DIVIN", "DOLCE",
  "DROIT", "DUVET", "ECLAT", "ECRAN", "EFFET", "EGLISE","ELOGE", "ELEVE",
  "EMERI", "EMOIS", "ENVOL", "EPAVE", "EPICE", "EQUIP", "ERRER", "ETAGE",
  "ETAPE", "ETUDE", "EVEIL", "EXACT", "EXCES", "EXILE", "EXTRA", "FABLE",
  "FACON", "FAUTE", "FAVRI", "FERME", "FESSE", "FETRE", "FEVRE", "FIBRE",
  "FIERE", "FIGUE", "FILET", "FLORE", "FLOTS", "FLUTE", "FOLIE", "FORCE",
  "FORME", "FOSSE", "FRANC", "FRONT", "FRUIT", "FUMEE", "GAGNE", "GARCE",
  "GARDE", "GENIE", "GENRE", "GLACE", "GLOIRE","GOUTTE","GRACE", "GRAIN",
  "GRAND", "GRAVE", "GUERE", "GUIDE", "HABIT", "HALTE", "HEROS", "IMAGE",
  "INDEX", "INTER", "IRAIT", "ISSUE", "JOUER", "JOUTE", "LARGE", "LASER",
  "LAVER", "LEGER", "LEMON", "LIEGE", "LIGNE", "LIGUE", "LIMON", "LISTE",
  "LOCAL", "LOGIS", "LOYAL", "LOVER", "LUEUR", "LUNAR", "LUSTRE","LUXE",
  "MAGIE", "MAIRE", "MARIN", "MASSE", "MEDIA", "MELON", "MERITE","MICRO",
  "MIEUX", "MILIEU","MIROIR","MIXER", "MODAL", "MOITE", "MOYEN", "NAIVE",
];

export function getDailyWordFr(): string {
  const epoch = new Date("2024-01-01").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.floor((today.getTime() - epoch) / 86_400_000);
  return WORDS_FR[day % WORDS_FR.length]!;
}
