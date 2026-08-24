export type Recipe = {
  name: string;
  name_english: string;
  country: string;
  difficulty: string;
  prep_time: string;
  servings: string;
  description: string;
  cultural_note: string;
  ingredients: string;
  instructions: string;
  vocabulary_notes: string;
};

const ES_RECIPES: Record<string, Recipe> = {
  Mexican: {
    name: "Guacamole clásico",
    name_english: "Classic Guacamole",
    country: "Mexico",
    difficulty: "Easy",
    prep_time: "15 minutos",
    servings: "4 personas",
    description:
      "Un dip cremoso de aguacate con limón, cebolla y cilantro. Se come con totopos o junto a tacos.",
    cultural_note:
      "El guacamole tiene raíces prehispánicas; el aguacate era alimento sagrado y cotidiano en Mesoamérica.",
    ingredients:
      "1. 3 aguacates maduros\n2. 1 tomate pequeño en cubos\n3. 1/4 de cebolla blanca picada\n4. 1 chile jalapeño (opcional)\n5. Jugo de 1 limón\n6. Cilantro fresco picado\n7. Sal al gusto",
    instructions:
      "1. Corta los aguacates y saca la pulpa a un bol.\n2. Machaca con un tenedor hasta quedar suave con trozos.\n3. Mezcla el tomate, la cebolla, el chile y el cilantro.\n4. Añade el jugo de limón y la sal.\n5. Prueba y ajusta el sabor. Sirve de inmediato.",
    vocabulary_notes:
      "aguacate — avocado\nmachacar — to mash\npicar — to chop\nal gusto — to taste\npulpa — flesh / pulp",
  },
  Colombian: {
    name: "Arepa de queso",
    name_english: "Cheese Arepa",
    country: "Colombia",
    difficulty: "Easy",
    prep_time: "25 minutos",
    servings: "4 personas",
    description:
      "Panecillos de maíz rellenos o mezclados con queso, dorados en sartén. Un desayuno colombiano esencial.",
    cultural_note:
      "Las arepas se comen en toda Colombia y Venezuela; cada región tiene su estilo y espesor.",
    ingredients:
      "1. 2 tazas de harina de maíz precocida\n2. 2 tazas de agua tibia\n3. 1 cucharadita de sal\n4. 1 taza de queso rallado\n5. Aceite o mantequilla para cocinar",
    instructions:
      "1. Mezcla la harina, el agua y la sal hasta formar una masa suave.\n2. Incorpora el queso rallado.\n3. Forma bolitas y aplánalas en discos.\n4. Cocina en sartén caliente 4–5 minutos por lado.\n5. Sirve calientes, solas o con más queso.",
    vocabulary_notes:
      "harina de maíz — cornmeal\nmasa — dough\nrallar — to grate\nsartén — frying pan\naplanar — to flatten",
  },
  Argentine: {
    name: "Chimichurri para asado",
    name_english: "Chimichurri for Asado",
    country: "Argentina",
    difficulty: "Easy",
    prep_time: "10 minutos",
    servings: "6 personas",
    description:
      "Salsa herbida de perejil, ajo y vinagre que acompaña carnes a la parrilla en Argentina.",
    cultural_note:
      "El asado es un ritual social argentino; el chimichurri llega a la mesa casi siempre.",
    ingredients:
      "1. 1 taza de perejil fresco picado\n2. 4 dientes de ajo picados\n3. 1 cucharadita de orégano seco\n4. 1/2 taza de aceite de oliva\n5. 3 cucharadas de vinagre de vino\n6. Ají molido y sal al gusto",
    instructions:
      "1. Mezcla el perejil, el ajo y el orégano en un bol.\n2. Agrega el aceite y el vinagre.\n3. Sazona con ají molido y sal.\n4. Deja reposar 15 minutos para que se integren los sabores.\n5. Sirve con carne asada o verduras.",
    vocabulary_notes:
      "perejil — parsley\ndiente de ajo — garlic clove\nvinagre — vinegar\nasado — barbecue\nreposar — to rest / sit",
  },
  Peruvian: {
    name: "Ceviche peruano",
    name_english: "Peruvian Ceviche",
    country: "Peru",
    difficulty: "Medium",
    prep_time: "30 minutos",
    servings: "4 personas",
    description:
      "Pescado crudo marinado en limón con cebolla morada, ají y cilantro. Plato bandera del Perú.",
    cultural_note:
      "El ceviche peruano es Patrimonio Cultural de la Nación y varía por costa y estación.",
    ingredients:
      "1. 500 g de pescado blanco fresco\n2. Jugo de 8 limones\n3. 1 cebolla morada en juliana\n4. 1 ají limo o rocoto (al gusto)\n5. Cilantro picado\n6. Sal y pimienta\n7. Camote y maíz choclo para acompañar",
    instructions:
      "1. Corta el pescado en cubos y ponlo en un bol frío.\n2. Añade sal y el jugo de limón; mezcla con cuidado.\n3. Deja marinar unos minutos hasta que el pescado se vea opaco.\n4. Incorpora la cebolla, el ají y el cilantro.\n5. Sirve de inmediato con camote y maíz.",
    vocabulary_notes:
      "pescado — fish\nmarinar — to marinate\ncebolla morada — red onion\najÍ — chili pepper\ncamote — sweet potato",
  },
  Spanish: {
    name: "Tortilla española",
    name_english: "Spanish Potato Omelette",
    country: "Spain",
    difficulty: "Medium",
    prep_time: "40 minutos",
    servings: "4 personas",
    description:
      "Tortilla de patatas con huevo, cocinada lentamente hasta quedar jugosa por dentro.",
    cultural_note:
      "La tortilla es un clásico de bar y picnic en toda España; el debate sobre cebolla nunca termina.",
    ingredients:
      "1. 5 patatas medianas\n2. 6 huevos\n3. 1 cebolla (opcional)\n4. Aceite de oliva\n5. Sal",
    instructions:
      "1. Pela y corta las patatas en rodajas finas.\n2. Fríelas en aceite a fuego medio con la cebolla hasta que estén tiernas.\n3. Escurre y mezcla con los huevos batidos y sal.\n4. Vierte en una sartén y cuaja a fuego bajo.\n5. Da la vuelta con un plato y termina de cocinar.",
    vocabulary_notes:
      "patata — potato\nrodaja — slice\nescurrir — to drain\ncuajar — to set / curdle\nfuego bajo — low heat",
  },
  Cuban: {
    name: "Arroz congrí",
    name_english: "Cuban Rice and Beans",
    country: "Cuba",
    difficulty: "Medium",
    prep_time: "50 minutos",
    servings: "6 personas",
    description:
      "Arroz cocido con frijoles negros, ajo y especias. Acompañamiento diario de la mesa cubana.",
    cultural_note:
      "El congrí (o moros y cristianos, según estilo) refleja la fusión africana y española en Cuba.",
    ingredients:
      "1. 2 tazas de arroz\n2. 1 taza de frijoles negros cocidos\n3. 1 cebolla picada\n4. 1 pimiento verde\n5. 3 dientes de ajo\n6. Comino, laurel, sal\n7. Aceite",
    instructions:
      "1. Sofríe la cebolla, el pimiento y el ajo en aceite.\n2. Añade los frijoles con un poco de su caldo.\n3. Incorpora el arroz, el comino, el laurel y la sal.\n4. Agrega agua según la medida del arroz.\n5. Cocina a fuego bajo hasta que el arroz esté tierno.",
    vocabulary_notes:
      "frijoles — beans\nsofrír — to sauté\npimiento — pepper\ncaldo — broth\ntierno — tender",
  },
  Dominican: {
    name: "Mangú con los tres golpes",
    name_english: "Mangú with the Three Hits",
    country: "Dominican Republic",
    difficulty: "Medium",
    prep_time: "35 minutos",
    servings: "4 personas",
    description:
      "Puré de plátano verde acompañado de queso frito, salami y huevos. Desayuno dominicano icónico.",
    cultural_note:
      "Los 'tres golpes' son queso, salami y huevos; juntos con mangú abren muchas mañanas dominicanas.",
    ingredients:
      "1. 4 plátanos verdes\n2. 1 cebolla en rodajas\n3. Vinagre y aceite\n4. Queso frito\n5. Salami dominicano\n6. 4 huevos\n7. Sal",
    instructions:
      "1. Hierve los plátanos pelados en agua con sal hasta que estén blandos.\n2. Machácalos con un poco del agua de cocción.\n3. Sofríe la cebolla con vinagre y aceite; úntala sobre el mangú.\n4. Fríe el queso y el salami; cocina los huevos.\n5. Sirve el mangú con los tres acompañamientos.",
    vocabulary_notes:
      "plátano verde — green plantain\nmachar — to mash\nhervir — to boil\nuntar — to spread / top\nblando — soft",
  },
};

const FR_RECIPES: Record<string, Recipe> = {
  French: {
    name: "Omelette aux fines herbes",
    name_english: "Herb Omelette",
    country: "France",
    difficulty: "Easy",
    prep_time: "10 minutes",
    servings: "1 personne",
    description:
      "Une omelette légère aux herbes fraîches, cuite rapidement à la française.",
    cultural_note:
      "L'omelette est un plat du quotidien en France; la technique de pliage compte autant que les ingrédients.",
    ingredients:
      "1. 3 œufs\n2. 1 c. à soupe de lait\n3. Persil, ciboulette, estragon\n4. Beurre\n5. Sel et poivre",
    instructions:
      "1. Bats les œufs avec le lait, le sel et le poivre.\n2. Ajoute les herbes ciselées.\n3. Fais fondre le beurre dans une poêle chaude.\n4. Verse les œufs et remue doucement.\n5. Plie l'omelette et sers immédiatement.",
    vocabulary_notes:
      "œuf — egg\nciseler — to finely chop\npoêle — frying pan\nplier — to fold\nherbes — herbs",
  },
  Québécois: {
    name: "Poutine maison",
    name_english: "Homemade Poutine",
    country: "Canada (Québec)",
    difficulty: "Medium",
    prep_time: "45 minutes",
    servings: "4 personnes",
    description:
      "Frites croustillantes, fromage en grains et sauce brune chaude — le plat-symbole du Québec.",
    cultural_note:
      "Née en province dans les années 1950, la poutine est devenue un emblème de la cuisine québécoise.",
    ingredients:
      "1. 1 kg de pommes de terre\n2. Fromage en grains\n3. 2 tasses de sauce brune\n4. Huile pour friture\n5. Sel",
    instructions:
      "1. Coupe les pommes de terre en frites et rince-les.\n2. Fais-les frire une première fois, laisse reposer, puis une seconde fois.\n3. Sale les frites et place-les dans des bols.\n4. Ajoute le fromage en grains.\n5. Verse la sauce brune bien chaude et sers tout de suite.",
    vocabulary_notes:
      "frites — fries\nfromage en grains — cheese curds\nsauce brune — brown gravy\nfrire — to fry\ncroustillant — crispy",
  },
  Moroccan: {
    name: "Salade de carottes à la marocaine",
    name_english: "Moroccan Carrot Salad",
    country: "Morocco",
    difficulty: "Easy",
    prep_time: "20 minutes",
    servings: "4 personnes",
    description:
      "Carottes tièdes assaisonnées de cumin, citron et coriandre. Entrée fraîche et parfumée.",
    cultural_note:
      "Au Maroc, les salades cuisinées accompagnent souvent le repas avant le plat principal.",
    ingredients:
      "1. 500 g de carottes\n2. Jus d'un citron\n3. 2 c. à soupe d'huile d'olive\n4. 1 c. à café de cumin\n5. Coriandre fraîche\n6. Ail, sel, poivre",
    instructions:
      "1. Fais cuire les carottes entières jusqu'à ce qu'elles soient tendres.\n2. Coupe-les en rondelles.\n3. Mélange citron, huile, cumin, ail et sel.\n4. Assaisonne les carottes encore tièdes.\n5. Parsème de coriandre et sers.",
    vocabulary_notes:
      "carotte — carrot\ncumin — cumin\ncoriandre — cilantro / coriander\nrondelle — round slice\nassaisonner — to season",
  },
  Senegalese: {
    name: "Thiéboudienne simplifié",
    name_english: "Simplified Thieboudienne",
    country: "Senegal",
    difficulty: "Challenging",
    prep_time: "75 minutes",
    servings: "6 personnes",
    description:
      "Riz au poisson et légumes dans une sauce tomate parfumée — plat national du Sénégal.",
    cultural_note:
      "Le thiéboudienne (ceebu jën) est un pilier de la cuisine wolof et se partage en famille.",
    ingredients:
      "1. 500 g de poisson ferme\n2. 2 tasses de riz\n3. 3 tomates + concentré\n4. Carotte, chou, aubergine\n5. Oignon, ail, piment\n6. Huile, sel, poivre",
    instructions:
      "1. Fais revenir oignon, ail et tomates dans l'huile.\n2. Ajoute le poisson et les légumes; laisse mijoter.\n3. Retire le poisson et les légumes.\n4. Fais cuire le riz dans la sauce restante.\n5. Remets le tout ensemble et sers généreusement.",
    vocabulary_notes:
      "poisson — fish\nriz — rice\nmijoter — to simmer\nchou — cabbage\nfaire revenir — to sauté",
  },
  Haitian: {
    name: "Diri kole ak pwa (riz et pois)",
    name_english: "Haitian Rice and Beans",
    country: "Haiti",
    difficulty: "Medium",
    prep_time: "55 minutes",
    servings: "6 personnes",
    description:
      "Riz créole cuit avec des haricots rouges, du thym et du poivron. Base de nombreux repas haïtiens.",
    cultural_note:
      "Le diri kole accompagne grillades et légumes; c'est un confort quotidien de la table haïtienne.",
    ingredients:
      "1. 2 tasses de riz\n2. 1 tasse de haricots rouges cuits\n3. 1 oignon\n4. 1 poivron\n5. Thym, ail, clou de girofle\n6. Huile, sel",
    instructions:
      "1. Fais revenir l'oignon, l'ail et le poivron.\n2. Ajoute les haricots et un peu de leur bouillon.\n3. Incorpore le riz, le thym et le sel.\n4. Ajoute l'eau nécessaire et porte à ébullition.\n5. Couvre et cuis à feu doux jusqu'à absorption.",
    vocabulary_notes:
      "haricots — beans\npoivron — bell pepper\nthym — thyme\nbouillon — broth\nfeu doux — low heat",
  },
};

function normalizeCuisine(cuisine: string): string {
  return cuisine.trim().toLowerCase();
}

const ES_ALIASES: Record<string, string> = {
  mexican: "Mexican",
  mexico: "Mexican",
  méxico: "Mexican",
  colombian: "Colombian",
  colombia: "Colombian",
  argentine: "Argentine",
  argentinian: "Argentine",
  argentina: "Argentine",
  peruvian: "Peruvian",
  peru: "Peruvian",
  perú: "Peruvian",
  spanish: "Spanish",
  spain: "Spanish",
  españa: "Spanish",
  cuban: "Cuban",
  cuba: "Cuban",
  dominican: "Dominican",
  "dominican republic": "Dominican",
};

const FR_ALIASES: Record<string, string> = {
  french: "French",
  france: "French",
  quebecois: "Québécois",
  québécois: "Québécois",
  quebec: "Québécois",
  québec: "Québécois",
  moroccan: "Moroccan",
  morocco: "Moroccan",
  maroc: "Moroccan",
  senegalese: "Senegalese",
  senegal: "Senegalese",
  sénégal: "Senegalese",
  haitian: "Haitian",
  haiti: "Haitian",
  haïti: "Haitian",
};

export function getRecipe(
  language: string,
  cuisine: string,
  _cefrLevel?: string,
): Recipe | null {
  const key = normalizeCuisine(cuisine);
  if (language === "fr") {
    const mapped = FR_ALIASES[key] ?? Object.keys(FR_RECIPES).find((k) => k.toLowerCase() === key);
    return mapped ? FR_RECIPES[mapped] ?? null : null;
  }
  const mapped = ES_ALIASES[key] ?? Object.keys(ES_RECIPES).find((k) => k.toLowerCase() === key);
  return mapped ? ES_RECIPES[mapped] ?? null : null;
}
