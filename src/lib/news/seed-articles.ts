import type { SummarizedArticle } from "@/app/actions/news";
import type { Language } from "@/lib/supabase/types";

const ES_ARTICLES: SummarizedArticle[] = [
  {
    title: "El cacao latinoamericano inspira nueva investigación científica",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2024-09-12T10:00:00Z",
    url: "https://example.com/es/cacao-investigacion",
    imageUrl: null,
    summary:
      "Científicos de México y Ecuador estudian variedades antiguas de cacao para mejorar el sabor y la resistencia de las plantas. El proyecto también documenta palabras indígenas relacionadas con el cultivo. Los resultados podrían ayudar a pequeños productores en varias regiones.",
    category: "Science",
  },
  {
    title: "Bibliotecas móviles llevan libros a pueblos andinos",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2024-10-03T14:30:00Z",
    url: "https://example.com/es/bibliotecas-moviles",
    imageUrl: null,
    summary:
      "En Perú y Bolivia, bibliotecas sobre ruedas visitan comunidades de montaña cada mes. Los niños pueden pedir prestados cuentos en español y en quechua. El programa busca aumentar el hábito de la lectura fuera de las grandes ciudades.",
    category: "World",
  },
  {
    title: "Flamenco contemporáneo une tradición y tecnología",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2024-11-18T09:15:00Z",
    url: "https://example.com/es/flamenco-contemporaneo",
    imageUrl: null,
    summary:
      "Artistas en Sevilla combinan baile flamenco con proyecciones digitales en el escenario. El espectáculo explica la historia del cante a un público joven. Los críticos dicen que la innovación no borra el respeto por las raíces del arte.",
    category: "Entertainment",
  },
  {
    title: "Parques urbanos en Medellín reducen el calor de la ciudad",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2025-01-22T16:00:00Z",
    url: "https://example.com/es/parques-medellin",
    imageUrl: null,
    summary:
      "Medellín plantó miles de árboles en corredores verdes para bajar la temperatura en barrios densos. Los vecinos usan los espacios para caminar y hacer deporte. Expertos presentan el plan como un ejemplo de adaptación al cambio climático.",
    category: "Health",
  },
  {
    title: "Astrónomos en Chile observan galaxias lejanas",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2025-02-08T11:45:00Z",
    url: "https://example.com/es/astronomia-chile",
    imageUrl: null,
    summary:
      "Los telescopios del desierto de Atacama captan imágenes de galaxias a miles de millones de años luz. Chile ofrece cielos muy claros, ideales para la investigación. Estudiantes locales participan en programas de divulgación científica.",
    category: "Science",
  },
  {
    title: "Mercados gastronómicos revitalizan centros históricos",
    sourceName: "LinguaPath Cultura",
    publishedAt: "2025-03-14T13:20:00Z",
    url: "https://example.com/es/mercados-gastronomicos",
    imageUrl: null,
    summary:
      "Ciudades como Madrid, Ciudad de México y Buenos Aires renuevan mercados antiguos con puestos de comida local. Los visitantes prueban platos regionales y aprenden nombres de ingredientes. El turismo gastronómico genera empleo para cocineros jóvenes.",
    category: "Business",
  },
];

const FR_ARTICLES: SummarizedArticle[] = [
  {
    title: "Les abeilles urbaines aident la biodiversité à Paris",
    sourceName: "LinguaPath Culture",
    publishedAt: "2024-09-15T10:00:00Z",
    url: "https://example.com/fr/abeilles-paris",
    imageUrl: null,
    summary:
      "Des ruches installées sur des toits parisiens produisent du miel local et protègent les insectes pollinisateurs. Des écoles organisent des visites pour expliquer le rôle des abeilles. Les scientifiques suivent aussi la qualité de l'air grâce au pollen collecté.",
    category: "Science",
  },
  {
    title: "Le festival de BD d'Angoulême attire des lecteurs du monde entier",
    sourceName: "LinguaPath Culture",
    publishedAt: "2024-10-20T15:00:00Z",
    url: "https://example.com/fr/festival-bd",
    imageUrl: null,
    summary:
      "Chaque année, Angoulême célèbre la bande dessinée francophone avec des expositions et des ateliers. Les auteurs rencontrent le public et présentent de nouvelles histoires. L'événement montre que la BD reste une forme d'art populaire et littéraire.",
    category: "Entertainment",
  },
  {
    title: "Des trains de nuit relient à nouveau plusieurs capitales européennes",
    sourceName: "LinguaPath Culture",
    publishedAt: "2024-11-05T08:30:00Z",
    url: "https://example.com/fr/trains-nuit",
    imageUrl: null,
    summary:
      "La France et ses voisins relancent des lignes de train de nuit pour réduire les vols courts. Les voyageurs apprécient le confort et le prix plus stable. Les organisateurs espèrent aussi faire découvrir des régions rurales le long du trajet.",
    category: "World",
  },
  {
    title: "La cuisine créole haïtienne gagne des restaurants au Québec",
    sourceName: "LinguaPath Culture",
    publishedAt: "2025-01-10T12:00:00Z",
    url: "https://example.com/fr/cuisine-creole",
    imageUrl: null,
    summary:
      "À Montréal, de nouveaux restaurants mettent en avant le riz, les épices et les légumes haïtiens. Les chefs expliquent l'histoire des plats à leurs clients. Ce succès aide aussi les jeunes entrepreneurs de la diaspora.",
    category: "Business",
  },
  {
    title: "Des chercheurs à Dakar étudient les mangroves de l'Atlantique",
    sourceName: "LinguaPath Culture",
    publishedAt: "2025-02-18T09:40:00Z",
    url: "https://example.com/fr/mangroves-dakar",
    imageUrl: null,
    summary:
      "Au Sénégal, des scientifiques mesurent comment les mangroves protègent les côtes contre l'érosion. Les communautés locales participent à la plantation de nouveaux arbres. Le projet lie écologie, économie de pêche et éducation.",
    category: "Science",
  },
  {
    title: "Le ski de fond suisse reste un sport populaire en hiver",
    sourceName: "LinguaPath Culture",
    publishedAt: "2025-03-02T17:10:00Z",
    url: "https://example.com/fr/ski-fond",
    imageUrl: null,
    summary:
      "Dans les Alpes romandes, beaucoup de familles choisissent le ski de fond plutôt que le ski alpin. L'activité demande de l'endurance et moins d'équipement coûteux. Les clubs scolaires organisent des courses amicales chaque février.",
    category: "Sports",
  },
];

/** Static educational “news” for free tier (not live headlines). */
export function getSeedNews(language: Language | string): SummarizedArticle[] {
  return language === "fr" ? FR_ARTICLES : ES_ARTICLES;
}
