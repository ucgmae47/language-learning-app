export type MusicRecommendation = {
  title: string;
  artist: string;
  genre: string;
  year: number;
  country: string;
  description: string;
  why_good_for_learning: string;
  fun_facts: string[];
  featured_lyrics: string;
  vocabulary_notes: string;
};

const ES_SONGS: MusicRecommendation[] = [
  {
    title: "La Bamba",
    artist: "Ritchie Valens",
    genre: "Rock / Traditional",
    year: 1958,
    country: "Mexico / USA",
    description:
      "A Mexican folk song turned rock-and-roll hit. Its chorus is simple, repetitive, and instantly recognizable across the Spanish-speaking world.",
    why_good_for_learning:
      "Clear, slow-enough choruses and high repetition make it ideal for A1–A2 listening and sing-along practice.",
    fun_facts: [
      "The song comes from Veracruz folk tradition long before the rock version.",
      "Ritchie Valens recorded it as a teenager in the late 1950s.",
      "UNESCO later recognized son jarocho traditions connected to La Bamba.",
    ],
    featured_lyrics:
      "Para bailar la bamba\nPara bailar la bamba se necesita\nUna poca de gracia\nUna poca de gracia pa' mí, pa' ti",
    vocabulary_notes:
      "bailar — to dance\nse necesita — one needs / you need\ngracia — charm; grace\npa' (para) — for (colloquial shortening)",
  },
  {
    title: "Color Esperanza",
    artist: "Diego Torres",
    genre: "Latin Pop",
    year: 2001,
    country: "Argentina",
    description:
      "An uplifting Latin pop anthem about hope and moving forward. Widely sung at school events and celebrations across Latin America.",
    why_good_for_learning:
      "Diction is clear and the vocabulary of hope and action is useful for B1 learners.",
    fun_facts: [
      "Diego Torres is an Argentine singer-songwriter and actor.",
      "The song became a pan-Latin motivational staple in the 2000s.",
      "Many school choirs perform simplified versions for assemblies.",
    ],
    featured_lyrics:
      "Sé que hay todavía\nUna luz en mi alma\nSé lo bien que siento\nAunque esté quemando",
    vocabulary_notes:
      "todavía — still\nalma — soul\nquemando — burning\nluz — light",
  },
  {
    title: "Corazón Espinado",
    artist: "Santana ft. Maná",
    genre: "Latin Rock",
    year: 1999,
    country: "Mexico",
    description:
      "A collaboration between Santana and Mexican rock band Maná about heartbreak, with memorable guitar lines and emotional Spanish lyrics.",
    why_good_for_learning:
      "Strong chorus repetition and everyday emotion vocabulary suit A2–B1 listeners.",
    fun_facts: [
      "Maná is one of Mexico's most successful rock bands.",
      "The track appears on Santana's Supernatural album.",
      "The title literally means 'thorned heart.'",
    ],
    featured_lyrics:
      "Este amor me está matando\nMe está ahogando sin piedad\nEste amor que va y me viene\nMe lleva hasta la locura",
    vocabulary_notes:
      "matando — killing\nahogando — drowning\npiedad — mercy\nlocura — madness",
  },
  {
    title: "Vivir Mi Vida",
    artist: "Marc Anthony",
    genre: "Salsa",
    year: 2013,
    country: "USA / Puerto Rico",
    description:
      "A joyful salsa hit about living life fully. Fast but lyrically straightforward, with a chorus learners can shout along to.",
    why_good_for_learning:
      "The chorus is short and high-energy — great for rhythm and stress practice at A2+.",
    fun_facts: [
      "It is a Spanish adaptation of Khaled's 'C'est la vie.'",
      "Marc Anthony is a leading salsa vocalist of Puerto Rican heritage.",
      "The song won major Latin music awards after release.",
    ],
    featured_lyrics:
      "Voy a reír, voy a bailar\nVivir mi vida, la la la la\nVoy a reír, voy a gozar\nVivir mi vida, la la la la",
    vocabulary_notes:
      "reír — to laugh\nbailar — to dance\ngozar — to enjoy\nvivir — to live",
  },
  {
    title: "Procuro Olvidarte",
    artist: "Hernaldo Zúñiga",
    genre: "Balada",
    year: 1980,
    country: "Nicaragua",
    description:
      "A classic Spanish-language ballad about trying to forget a lost love. Slow tempo and clear enunciation help intermediate listeners.",
    why_good_for_learning:
      "Slower delivery and poetic but accessible vocabulary work well for B1 listening.",
    fun_facts: [
      "Hernaldo Zúñiga is a Nicaraguan singer-songwriter.",
      "The song became a staple of Spanish romantic radio.",
      "Many later artists covered the ballad across Latin America.",
    ],
    featured_lyrics:
      "Procuro olvidarte\nOlvidar tu voz, tu sonrisa, tu cara\nProcuro olvidarte\nPero es imposible olvidar",
    vocabulary_notes:
      "procuro — I try\nolvidar — to forget\nsonrisa — smile\ncara — face",
  },
  {
    title: "Me Gustas Tú",
    artist: "Manu Chao",
    genre: "Latin Alternative",
    year: 2001,
    country: "Spain / France",
    description:
      "A playful multilingual track with a famous Spanish chorus listing everyday likes. Extremely memorable for beginners.",
    why_good_for_learning:
      "The 'me gusta(n)' pattern is perfect for A1 grammar and high-frequency vocabulary.",
    fun_facts: [
      "Manu Chao mixes Spanish, French, English, and other languages.",
      "The song lists cities, weather, and daily pleasures.",
      "It remains a favorite warm-up track for Spanish classes.",
    ],
    featured_lyrics:
      "Me gustan los aviones, me gustas tú\nMe gusta viajar, me gustas tú\nMe gusta la mañana, me gustas tú\nMe gusta el viento, me gustas tú",
    vocabulary_notes:
      "me gusta(n) — I like\naviones — airplanes\nviajar — to travel\nviento — wind",
  },
  {
    title: "Ojalá Que Llueva Café",
    artist: "Juan Luis Guerra",
    genre: "Merengue / Bachata",
    year: 1989,
    country: "Dominican Republic",
    description:
      "A poetic Dominican song wishing coffee would rain on the fields — both hopeful and socially aware.",
    why_good_for_learning:
      "Rich imagery with clear merengue rhythm; excellent B1–B2 cultural listening.",
    fun_facts: [
      "Juan Luis Guerra is a Dominican music icon.",
      "'Ojalá' comes from Arabic influence via Spanish history.",
      "The song blends agricultural imagery with social hope.",
    ],
    featured_lyrics:
      "Ojalá que llueva café en el campo\nQue caiga un aguacero de yuca y té\nDel cielo una jarina de queso blanco\nY al Sur una montaña de berro y miel",
    vocabulary_notes:
      "ojalá — hopefully / I wish\nllueva — that it rains (subjunctive)\ncampo — countryside\naguacero — downpour",
  },
  {
    title: "Limón y Sal",
    artist: "Julieta Venegas",
    genre: "Latin Pop / Folk Pop",
    year: 2006,
    country: "Mexico",
    description:
      "A bright Mexican pop song about love that needs both sweetness and salt — honesty and everyday feeling.",
    why_good_for_learning:
      "Natural conversational Spanish and moderate tempo suit A2–B1 learners.",
    fun_facts: [
      "Julieta Venegas began as an accordion-playing singer-songwriter.",
      "The album Limón y Sal was a major Latin pop success.",
      "Her lyrics often use simple metaphors from daily life.",
    ],
    featured_lyrics:
      "No necesito que me digas qué hacer\nNi que me digas a dónde ir\nNo necesito que me digas cómo ser\nSolo necesito que estés aquí",
    vocabulary_notes:
      "necesitar — to need\ndigas — you tell (subjunctive)\na dónde — where (to)\nsolo — only",
  },
  {
    title: "Waka Waka (Esto es África)",
    artist: "Shakira",
    genre: "Pop / World",
    year: 2010,
    country: "Colombia",
    description:
      "The Spanish-language World Cup anthem with a catchy chorus and motivational sports vocabulary.",
    why_good_for_learning:
      "Very clear chorus and sports imagery help A1–A2 learners stay engaged.",
    fun_facts: [
      "Shakira is Colombian and one of the world's best-known Latin artists.",
      "The song was the official anthem of the 2010 FIFA World Cup.",
      "It mixes Spanish lyrics with African musical motifs.",
    ],
    featured_lyrics:
      "Porque esto es África\nWaka waka eh eh\nTiempos de alegría\nWaka waka eh eh",
    vocabulary_notes:
      "porque — because\ntiempos — times\nalegría — joy\nesto es — this is",
  },
];

const FR_SONGS: MusicRecommendation[] = [
  {
    title: "La Vie en rose",
    artist: "Édith Piaf",
    genre: "Chanson",
    year: 1947,
    country: "France",
    description:
      "The quintessential French chanson about seeing life through rose-colored glasses. Slow, clear, and culturally essential.",
    why_good_for_learning:
      "Slow tempo and iconic phrasing make it ideal for A2 listening and pronunciation modeling.",
    fun_facts: [
      "Édith Piaf is often called 'the Little Sparrow.'",
      "The song became a global symbol of French romance.",
      "Countless artists have covered it in many languages.",
    ],
    featured_lyrics:
      "Quand il me prend dans ses bras\nIl me parle tout bas\nJe vois la vie en rose\nIl me dit des mots d'amour",
    vocabulary_notes:
      "quand — when\nbras — arms\ntout bas — softly / quietly\nmots d'amour — words of love",
  },
  {
    title: "Je veux",
    artist: "Zaz",
    genre: "Jazz Pop / Chanson",
    year: 2010,
    country: "France",
    description:
      "A joyful modern chanson rejecting materialism and celebrating simple pleasures — café life, friends, and freedom.",
    why_good_for_learning:
      "Clear diction and everyday desire vocabulary ('je veux') suit A2–B1 learners.",
    fun_facts: [
      "Zaz rose to fame with this breakout single.",
      "The song mixes jazz swing with street-chanson energy.",
      "Lyrics contrast luxury goods with ordinary happiness.",
    ],
    featured_lyrics:
      "Donnez-moi une suite au Ritz\nJe n'en veux pas\nDes bijoux de chez Chanel\nJe n'en veux pas",
    vocabulary_notes:
      "donnez-moi — give me\nje n'en veux pas — I don't want any of it\nbijoux — jewels\nsuite — hotel suite",
  },
  {
    title: "Alors on danse",
    artist: "Stromae",
    genre: "Electronic / Pop",
    year: 2009,
    country: "Belgium",
    description:
      "A Belgian electro-pop hit about dancing through everyday stress. Catchy, rhythmic, and full of useful spoken-like French.",
    why_good_for_learning:
      "Repetitive chorus and modern colloquial French help B1 learners with listening stamina.",
    fun_facts: [
      "Stromae is a Belgian artist known for sharp social lyrics.",
      "The title means 'so we dance.'",
      "It topped charts across Europe after release.",
    ],
    featured_lyrics:
      "Alors on danse\nAlors on danse\nQui dit étude dit travail\nQui dit taf te dit les thunes",
    vocabulary_notes:
      "alors — so / then\nétude — study\ntravail — work\ntaf / thunes — slang for job / money",
  },
  {
    title: "Tous les mêmes",
    artist: "Stromae",
    genre: "Electronic / Pop",
    year: 2013,
    country: "Belgium",
    description:
      "A witty, theatrical song about relationship stereotypes, with rapid but crisp French lyrics.",
    why_good_for_learning:
      "Great for B1–B2 listening challenge and conversational complaint phrases.",
    fun_facts: [
      "Stromae performs gendered roles in the music video.",
      "The song critiques clichés about men and women.",
      "It was a major hit from the album Racine carrée.",
    ],
    featured_lyrics:
      "Vous les hommes, vous n'êtes tous les mêmes\nMacho mais cheap, vous vous prenez pour qui ?\nVous les hommes, vous n'êtes tous les mêmes",
    vocabulary_notes:
      "tous les mêmes — all the same\nmacho — macho\ncheap — cheap / stingy (loanword)\nvous vous prenez pour qui — who do you think you are",
  },
  {
    title: "Formidable",
    artist: "Stromae",
    genre: "Electronic / Chanson",
    year: 2013,
    country: "Belgium",
    description:
      "A melancholic play on 'formidable' vs 'faux me rend malade,' filmed as a raw street performance in Brussels.",
    why_good_for_learning:
      "Wordplay and clear emotional French reward careful B1+ listening.",
    fun_facts: [
      "The music video was shot with hidden cameras in Brussels.",
      "The title flips between 'wonderful' and a painful pun.",
      "It became one of Stromae's signature tracks.",
    ],
    featured_lyrics:
      "Tu étais formidable\nJ'étais fort minable\nNous étions formidables\nQuelle équipe formidable",
    vocabulary_notes:
      "tu étais — you were\nformidable — wonderful / impressive\nminable — pathetic\néquipe — team",
  },
  {
    title: "Comme d'habitude",
    artist: "Claude François",
    genre: "Chanson / Pop",
    year: 1967,
    country: "France",
    description:
      "The French original that inspired 'My Way.' A narrative song about routine and separation, sung clearly and dramatically.",
    why_good_for_learning:
      "Storytelling lyrics and moderate pace help B1 learners follow a full verse arc.",
    fun_facts: [
      "Paul Anka adapted it into English as 'My Way' for Frank Sinatra.",
      "Claude François was a major 1960s French pop star.",
      "The phrase 'comme d'habitude' means 'as usual.'",
    ],
    featured_lyrics:
      "Je me lève et je te bouscule\nTu ne te réveilles pas\nComme d'habitude\nSur toi je remonte le drap",
    vocabulary_notes:
      "je me lève — I get up\nbousculer — to jostle / shake\nte réveilles — you wake up\ndrap — sheet",
  },
  {
    title: "Papaoutai",
    artist: "Stromae",
    genre: "Electronic / Pop",
    year: 2013,
    country: "Belgium",
    description:
      "A powerful song about an absent father, blending dance rhythm with emotionally direct French.",
    why_good_for_learning:
      "Memorable hook and family vocabulary make it useful for A2–B1 cultural listening.",
    fun_facts: [
      "The title plays on 'Papa, où t'es?' (Dad, where are you?).",
      "Stromae's choreography became instantly recognizable.",
      "The song sparked classroom discussions about family themes.",
    ],
    featured_lyrics:
      "Où t'es, papa où t'es?\nOù t'es, papa où t'es?\nOù t'es, papa où t'es?\nOù t'es, où t'es où t'es, où t'es, papa où t'es?",
    vocabulary_notes:
      "où t'es — where are you (colloquial)\npapa — dad\noubliés — forgotten\nsans — without",
  },
  {
    title: "Je l'aime à mourir",
    artist: "Francis Cabrel",
    genre: "Folk / Chanson",
    year: 1979,
    country: "France",
    description:
      "A tender French love song with poetic but accessible vocabulary and a gentle acoustic style.",
    why_good_for_learning:
      "Clear singing and romantic everyday imagery suit B1 pronunciation and listening.",
    fun_facts: [
      "Francis Cabrel is known for thoughtful French songwriting.",
      "Shakira later recorded a Spanish version.",
      "The title means 'I love her to death' (figuratively).",
    ],
    featured_lyrics:
      "Tu sais je n'ai jamais été aussi heureux que ce soir-là\nTu étais belle à ne pas croire\nEt moi je t'en souviens à peine\nJe tremblais comme un enfant",
    vocabulary_notes:
      "heureux — happy\nce soir-là — that evening\nà ne pas croire — unbelievable\ntrembler — to tremble",
  },
  {
    title: "Miami Vice",
    artist: "Lartiste ft. Caroliina",
    genre: "Urban Pop",
    year: 2017,
    country: "France / Morocco",
    description:
      "A modern French urban-pop hit with catchy bilingual vibes and danceable rhythm popular with younger learners.",
    why_good_for_learning:
      "Contemporary slang and chorus repetition help B1 learners hear real spoken French rhythm.",
    fun_facts: [
      "Lartiste is a French singer of Moroccan heritage.",
      "The track mixes French pop with urban production.",
      "It performed strongly on French streaming charts.",
    ],
    featured_lyrics:
      "Elle veut danser, danser toute la night\nElle veut s'évader, laisser tout derrière\nElle veut danser, danser toute la night",
    vocabulary_notes:
      "danser — to dance\ns'évader — to escape\nlaisser — to leave\nderrière — behind",
  },
];

function keyOf(title: string, artist: string): string {
  return `${title.trim().toLowerCase()}::${artist.trim().toLowerCase()}`;
}

export function pickMusicRecommendation(
  language: string,
  _cefrLevel: string,
  seenSongs: { title: string; artist: string }[] = [],
): MusicRecommendation | null {
  const bank = language === "fr" ? FR_SONGS : ES_SONGS;
  const seen = new Set(seenSongs.map((s) => keyOf(s.title, s.artist)));
  const available = bank.filter((s) => !seen.has(keyOf(s.title, s.artist)));
  const pool = available.length > 0 ? available : bank;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
