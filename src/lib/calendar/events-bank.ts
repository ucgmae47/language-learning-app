export type CalendarEvent = {
  date: string;
  name: string;
  country: string;
  emoji: string;
  description: string;
  type: "holiday" | "festival" | "cultural";
};

type StoredEvent = Omit<CalendarEvent, "date"> & { day: number };
type MonthBank = { note: string; events: StoredEvent[] };

const ES_MONTHS: Record<number, MonthBank> = {
  1: {
    note: "Enero abre el año con Reyes y nuevos comienzos en el mundo hispano.",
    events: [
      { day: 1, name: "Año Nuevo", country: "varios", emoji: "🎉", description: "Se celebra con uvas o brindis a medianoche en muchos países. Es un momento de deseos para el año.", type: "holiday" },
      { day: 6, name: "Día de Reyes", country: "España / LatAm", emoji: "👑", description: "Los niños reciben regalos de los Reyes Magos. En España hay cabalgatas y roscón de Reyes.", type: "holiday" },
      { day: 1, name: "Año Nuevo Aymara (Machaq Mara)", country: "Bolivia", emoji: "🌞", description: "En los Andes se celebra el año nuevo andino cerca de junio, pero en enero hay rituales locales de renovación. Nota: celebraciones comunitarias de inicio de ciclo.", type: "cultural" },
      { day: 15, name: "Feria de Enero (arranque)", country: "El Salvador", emoji: "🎪", description: "Varias ciudades abren ferias patronales en enero. Hay comida callejera, música y juegos.", type: "festival" },
      { day: 21, name: "Día de la Altagracia", country: "Rep. Dominicana", emoji: "🙏", description: "Festividad mariana muy importante en el este del país. Muchos peregrinan al santuario.", type: "holiday" },
      { day: 27, name: "Natalicio de José Martí (conmemoración)", country: "Cuba", emoji: "📘", description: "Se recuerda al poeta y héroe independentista. Escuelas y actos culturales marcan el día.", type: "cultural" },
      { day: 18, name: "Temporada de zampoñas y folklore", country: "Perú / Bolivia", emoji: "🎶", description: "En verano austral hay encuentros folclóricos andinos. Instrumentos de viento y danza llenan plazas.", type: "cultural" },
      { day: 10, name: "Festival de Teatro de Caracas (histórico/enero)", country: "Venezuela", emoji: "🎭", description: "Caracas ha acogido muestras teatrales de enero. El público disfruta obras nacionales e internacionales.", type: "festival" },
    ],
  },
  2: {
    note: "Febrero huele a carnaval en el Caribe y el Cono Sur.",
    events: [
      { day: 2, name: "Día de la Candelaria", country: "México / Perú", emoji: "🕯️", description: "Se come tamales en México y se celebran misas. Marca el cierre del ciclo navideño.", type: "holiday" },
      { day: 14, name: "San Valentín / Día del Amor", country: "varios", emoji: "💕", description: "Se intercambian flores y mensajes. En algunos países se llama Día del Amor y la Amistad.", type: "cultural" },
      { day: 12, name: "Carnaval de Barranquilla (época típica)", country: "Colombia", emoji: "💃", description: "Uno de los carnavales más grandes del mundo. Cumbia, disfraces y reinados llenan la costa.", type: "festival" },
      { day: 20, name: "Carnaval de Oruro (época típica)", country: "Bolivia", emoji: "👺", description: "Patrimonio UNESCO: diablada y danzas mineras. Miles de danzarines recorren la ciudad.", type: "festival" },
      { day: 24, name: "Desfiles de Carnaval", country: "varios", emoji: "🌸", description: "Desfiles florales y carrozas aparecen en carnavales hispanos. Confeti anima las calles.", type: "festival" },
      { day: 27, name: "Carnaval Dominicano", country: "Rep. Dominicana", emoji: "🎭", description: "Careta, diablos cojuelos y desfiles regionales. El carnaval culmina cerca del 27 de febrero.", type: "festival" },
      { day: 11, name: "Fiesta de la Virgen de Lourdes", country: "varios", emoji: "🙏", description: "Celebraciones religiosas en parroquias hispanas. Peregrinaciones locales acompañan la fecha.", type: "holiday" },
      { day: 5, name: "Temporada de joropo llanero", country: "Venezuela / Colombia", emoji: "🎻", description: "Encuentros de música llanera en febrero. Arpa, cuatro y canto improvisado.", type: "cultural" },
    ],
  },
  3: {
    note: "Marzo mezcla fiestas patrias, primavera y Semana Santa temprana algunos años.",
    events: [
      { day: 1, name: "Día de la Cero Impunidad / fechas cívicas locales", country: "varios", emoji: "📜", description: "En varios países hay actos escolares de marzo. Se refuerza la memoria cívica.", type: "cultural" },
      { day: 3, name: "Fiesta de Casimir / tradiciones locales", country: "España", emoji: "🌿", description: "En regiones españolas hay romerías tempranas de primavera. Se sale al campo y se comparte comida.", type: "cultural" },
      { day: 8, name: "Día Internacional de la Mujer", country: "varios", emoji: "💜", description: "Manifestaciones y actos culturales en ciudades hispanas. Se debate igualdad y derechos.", type: "cultural" },
      { day: 19, name: "San José", country: "España / LatAm", emoji: "🥖", description: "Día del padre en España y festividad religiosa. En Valencia se cruzan con el ambiente de Fallas.", type: "holiday" },
      { day: 15, name: "Fallas de Valencia (época típica)", country: "España", emoji: "🔥", description: "Monumentos de cartón-piedra se queman al final. Pirotecnia y ninots llenan Valencia.", type: "festival" },
      { day: 21, name: "Equinoccio / rituales en Teotihuacán", country: "México", emoji: "☀️", description: "Miles visitan pirámides para recibir la primavera. Tradición moderna y prehispánica se mezclan.", type: "cultural" },
      { day: 25, name: "Semana Santa (fecha móvil; a menudo marzo/abril)", country: "España / LatAm", emoji: "✝️", description: "Procesiones solemnes recorren calles. Es una de las tradiciones más visibles del calendario.", type: "holiday" },
      { day: 21, name: "Día de Benito Juárez", country: "México", emoji: "🇲🇽", description: "Feriado que honra al presidente liberal. Hay actos cívicos en escuelas.", type: "holiday" },
    ],
  },
  4: {
    note: "Abril trae Semana Santa, ferias andaluzas y otoño austral.",
    events: [
      { day: 1, name: "Día de los Inocentes (España no; LatAm varía) / bromas locales", country: "varios", emoji: "🃏", description: "En algunos contextos hay bromas primaverales. Mejor verificar costumbres locales.", type: "cultural" },
      { day: 2, name: "Feria de Abril (época típica)", country: "España", emoji: "💃", description: "Sevilla se llena de casetas, faralaes y sevillanas. Caballos y rebujito marcan la feria.", type: "festival" },
      { day: 14, name: "Día de las Américas", country: "Honduras / Centroamérica", emoji: "🌎", description: "Se celebra la identidad panamericana. Escuelas organizan desfiles y actos.", type: "holiday" },
      { day: 19, name: "Declaración de Independencia (aniv. histórico)", country: "Venezuela", emoji: "📜", description: "Actos cívicos recuerdan el 19 de abril de 1810. Bandera y escuela marcan el día.", type: "holiday" },
      { day: 22, name: "Día de la Tierra", country: "varios", emoji: "🌍", description: "Escuelas hispanas hacen campañas ecológicas. Limpieza de playas y charlas ambientales.", type: "cultural" },
      { day: 23, name: "Día del Libro / Sant Jordi", country: "España", emoji: "📚", description: "En Cataluña se regalan libros y rosas. Toda España celebra el Día del Libro.", type: "cultural" },
      { day: 30, name: "Día del Niño (México)", country: "México", emoji: "🧸", description: "Niños reciben regalos y actividades escolares. Parques y familias celebran juntos.", type: "cultural" },
      { day: 9, name: "Semana Santa andina / procesiones", country: "Perú / Ecuador", emoji: "✝️", description: "Procesiones nocturnas con andas y velas. La fe popular llena plazas coloniales.", type: "holiday" },
    ],
  },
  5: {
    note: "Mayo celebra el trabajo, la primavera europea y fiestas patrias.",
    events: [
      { day: 1, name: "Día del Trabajo", country: "varios", emoji: "🛠️", description: "Manifestaciones y día festivo en casi todo el mundo hispano. Se reconocen derechos laborales.", type: "holiday" },
      { day: 3, name: "Día de la Cruz", country: "España / LatAm", emoji: "✝️", description: "Cruces decoradas con flores en patios y cerros. Tradición muy viva en Granada y Centroamérica.", type: "cultural" },
      { day: 5, name: "Cinco de Mayo", country: "México", emoji: "🎖️", description: "Conmemora la Batalla de Puebla. Fuera de México a veces se confunde con la independencia.", type: "holiday" },
      { day: 10, name: "Día de la Madre (México y otros)", country: "México / LatAm", emoji: "💐", description: "Una de las fechas más celebradas del año. Comidas familiares y serenatas.", type: "cultural" },
      { day: 18, name: "Día Internacional de los Museos", country: "varios", emoji: "🖼️", description: "Museos abren con actividades especiales. Buena oportunidad para vocabulario cultural.", type: "cultural" },
      { day: 25, name: "Revolución de Mayo", country: "Argentina", emoji: "🇦🇷", description: "Feriado patrio que recuerda 1810. Actos escolares y desfiles.", type: "holiday" },
      { day: 15, name: "San Isidro", country: "España", emoji: "🌾", description: "Patrón de Madrid; romería y fiestas madrileñas. Tradición agrícola y urbana.", type: "festival" },
      { day: 12, name: "Fiestas de mayo en Costa Rica (varias)", country: "Costa Rica", emoji: "🌴", description: "Celebraciones cívicas y escolares de mitad de año lectivo. Música y banderas.", type: "cultural" },
    ],
  },
  6: {
    note: "Junio combina Corpus, San Juan e intimidad del invierno austral.",
    events: [
      { day: 1, name: "Día del Niño (varios países)", country: "varios", emoji: "🧒", description: "Fechas del niño varían; en junio hay actos en varios países. Juegos y espectáculos.", type: "cultural" },
      { day: 2, name: "Corpus Christi (fecha móvil a menudo mayo/junio)", country: "España / LatAm", emoji: "🍞", description: "Alfombras florales y procesiones eucarísticas. Tradición fuerte en Toledo y Cusco.", type: "holiday" },
      { day: 12, name: "Día de los Enamorados (Brasil influye frontera) / San Juan prep", country: "varios", emoji: "💛", description: "Preparativos de hogueras de San Juan. En el Caribe ya se siente el verano.", type: "cultural" },
      { day: 20, name: "Inti Raymi (cerca del solsticio)", country: "Perú", emoji: "🌞", description: "Festival inca del sol en Cusco. Representaciones teatrales y rituales andinos.", type: "festival" },
      { day: 24, name: "San Juan / Noche de San Juan", country: "España / LatAm", emoji: "🔥", description: "Hogueras en playas y pueblos. Se saltan fuegos para atraer buena suerte.", type: "festival" },
      { day: 29, name: "San Pedro y San Pablo", country: "varios", emoji: "🎣", description: "Fiestas patronales pesqueras en costas hispanas. Procesiones marítimas.", type: "holiday" },
      { day: 7, name: "Aniversario del Primer Gobierno Patrio (algunos actos)", country: "Paraguay", emoji: "🇵🇾", description: "Actos cívicos de junio en el calendario paraguayo. Escuelas participan.", type: "holiday" },
      { day: 15, name: "Feria del Libro de Madrid (época típica)", country: "España", emoji: "📖", description: "Caseta tras caseta en El Retiro. Autores firman y lectores pasean.", type: "festival" },
    ],
  },
  7: {
    note: "Julio es fiestas patrias andinas y verbenas españolas.",
    events: [
      { day: 1, name: "Fiestas patrias / mitad de año", country: "varios", emoji: "🎆", description: "Vacaciones escolares en LatAm y verbenas en España. Turismo interno aumenta.", type: "cultural" },
      { day: 5, name: "Independencia de Venezuela", country: "Venezuela", emoji: "🇻🇪", description: "Feriado del 5 de julio de 1811. Desfiles militares y actos escolares.", type: "holiday" },
      { day: 7, name: "San Fermín", country: "España", emoji: "🐂", description: "Encierros en Pamplona y fiesta popular. Pañuelo rojo y sanfermines.", type: "festival" },
      { day: 9, name: "Independencia de Argentina", country: "Argentina", emoji: "🇦🇷", description: "Feriado patrio del 9 de julio. Locro y empanadas en muchas casas.", type: "holiday" },
      { day: 20, name: "Independencia de Colombia", country: "Colombia", emoji: "🇨🇴", description: "Celebración del 20 de julio. Desfiles y conciertos.", type: "holiday" },
      { day: 24, name: "Simón Bolívar / natalicio", country: "varios", emoji: "⚔️", description: "Se conmemora al Libertador en varios países. Actos cívicos andinos.", type: "cultural" },
      { day: 28, name: "Independencia del Perú", country: "Perú", emoji: "🇵🇪", description: "Fiestas Patrias con desfiles y ferias. El 28 y 29 son feriados.", type: "holiday" },
      { day: 16, name: "La Virgen del Carmen", country: "España / Chile", emoji: "⛵", description: "Patrona de los marineros; procesiones en el mar. Fuerte en Chile y costas españolas.", type: "holiday" },
    ],
  },
  8: {
    note: "Agosto trae asunción, ferias y sol fuerte en el norte.",
    events: [
      { day: 1, name: "Fiestas patronales de agosto", country: "España", emoji: "🌞", description: "Muchos pueblos celebran fiestas patronales. Verbenas nocturnas y ferias.", type: "festival" },
      { day: 6, name: "Actos cívicos de agosto", country: "Ecuador", emoji: "🇪🇨", description: "El calendario ecuatoriano de agosto recuerda batallas independentistas.", type: "holiday" },
      { day: 10, name: "Independencia del Ecuador", country: "Ecuador", emoji: "🇪🇨", description: "Feriado del 10 de agosto de 1809. Desfiles en Quito.", type: "holiday" },
      { day: 15, name: "Asunción de la Virgen", country: "España / LatAm", emoji: "🌟", description: "Festividad religiosa y puente vacacional en España. Romerías y misas.", type: "holiday" },
      { day: 17, name: "Paso a la Inmortalidad de San Martín", country: "Argentina", emoji: "🇦🇷", description: "Feriado que honra a José de San Martín. Actos escolares.", type: "holiday" },
      { day: 25, name: "Independencia del Uruguay", country: "Uruguay", emoji: "🇺🇾", description: "Feriado patrio del 25 de agosto. Asados y actos oficiales.", type: "holiday" },
      { day: 12, name: "Verano cultural en La Habana", country: "Cuba", emoji: "🎺", description: "Conciertos y cultura callejera de verano. El son suena en plazas.", type: "cultural" },
      { day: 30, name: "Santa Rosa de Lima", country: "Perú / LatAm", emoji: "🌹", description: "Primera santa de América; festividad religiosa. Peregrinaciones en Lima.", type: "holiday" },
    ],
  },
  9: {
    note: "Septiembre es mes patrio en México y Centroamérica.",
    events: [
      { day: 7, name: "Independencias centroamericanas", country: "Centroamérica", emoji: "🎆", description: "El 15 se celebra en varios países; la semana se llena de ensayos. Faroles y desfiles.", type: "holiday" },
      { day: 15, name: "Independencia de Centroamérica", country: "Centroamérica", emoji: "🇸🇻", description: "Costa Rica, El Salvador, Guatemala, Honduras y Nicaragua celebran. Cadenas de faroles.", type: "holiday" },
      { day: 16, name: "Independencia de México", country: "México", emoji: "🇲🇽", description: "El Grito la noche del 15 y desfiles el 16. Bandera, pozole y fuegos.", type: "holiday" },
      { day: 18, name: "Fiestas Patrias de Chile", country: "Chile", emoji: "🇨🇱", description: "Dieciocho: fondas, cueca y asados. Uno de los feriados más queridos.", type: "holiday" },
      { day: 21, name: "Día del Estudiante (varios)", country: "varios", emoji: "🎓", description: "Celebraciones escolares de primavera austral. Actividades recreativas.", type: "cultural" },
      { day: 24, name: "Día de la Merced / tradiciones", country: "España / LatAm", emoji: "🙏", description: "Festividades marianas y locales. En Barcelona es fiesta mayor relacionada.", type: "holiday" },
      { day: 11, name: "Diada Nacional de Catalunya", country: "España", emoji: "🟡", description: "Día nacional catalán con actos culturales y políticos. Calles con senyera.", type: "cultural" },
      { day: 30, name: "Cierre de mes patrio", country: "México", emoji: "🎺", description: "Bandas y ferias aún suenan tras el Grito. Turismo cultural en plazas.", type: "festival" },
    ],
  },
  10: {
    note: "Octubre une hispanidad, indígenas y primavera austral.",
    events: [
      { day: 7, name: "Festival Cervantino (época típica)", country: "México", emoji: "🎭", description: "Gran festival de artes en Guanajuato. Teatro, música y calle.", type: "festival" },
      { day: 12, name: "Día de la Hispanidad / Encuentro de Culturas", country: "España / LatAm", emoji: "🌎", description: "España celebra fiesta nacional; en América se debate memoria indígena y mestiza.", type: "holiday" },
      { day: 12, name: "Día de la Resistencia Indígena", country: "Venezuela / LatAm", emoji: "🪶", description: "Algunos países resignifican el 12 de octubre. Actos de memoria indígena.", type: "cultural" },
      { day: 31, name: "Halloween / víspera de Todos Santos", country: "varios", emoji: "🎃", description: "En ciudades hispanas convive con tradiciones de Todos Santos. Niños piden dulces.", type: "cultural" },
      { day: 15, name: "Feria de Octubre (varias)", country: "España", emoji: "🍇", description: "Vendimia y ferias de otoño en regiones vinícolas. Catas y música.", type: "festival" },
      { day: 2, name: "Día del Pastelero / fechas gastronómicas", country: "varios", emoji: "🥐", description: "Octubre suele traer ferias de pan y chocolate. Ideal para vocabulario de comida.", type: "cultural" },
      { day: 9, name: "Día de Valencia / tradiciones", country: "España", emoji: "🏞️", description: "Actos locales y cultura valenciana. Paella y bandera.", type: "cultural" },
      { day: 20, name: "Mes del criollismo / folklore", country: "Argentina / Uruguay", emoji: "🪗", description: "Peñas folclóricas de primavera. Guitarra y canto popular.", type: "cultural" },
    ],
  },
  11: {
    note: "Noviembre recuerda a los muertos y cierra con ferias.",
    events: [
      { day: 1, name: "Día de Todos los Santos", country: "España / LatAm", emoji: "🕯️", description: "Visitas a cementerios y flores. En España es festivo.", type: "holiday" },
      { day: 2, name: "Día de Muertos", country: "México", emoji: "💀", description: "Ofrendas, cempasúchil y visitas a tumbas. Patrimonio cultural inmaterial.", type: "festival" },
      { day: 3, name: "Día de los Difuntos (Andes)", country: "Ecuador / Bolivia", emoji: "🍞", description: "Se prepara colada morada y guaguas de pan. Familias visitan cementerios.", type: "cultural" },
      { day: 11, name: "Armisticio / San Martín de Tours", country: "España / Europa", emoji: "🎖️", description: "Actos locales y tradiciones de noviembre. Mercados tempranos de Adviento.", type: "cultural" },
      { day: 20, name: "Día de la Revolución Mexicana", country: "México", emoji: "🇲🇽", description: "Feriado que recuerda 1910. Desfiles y actos cívicos.", type: "holiday" },
      { day: 22, name: "Santa Cecilia (músicos)", country: "varios", emoji: "🎵", description: "Patrona de los músicos; serenatas y conciertos. Bandas escolares tocan.", type: "cultural" },
      { day: 30, name: "San Andrés", country: "varios", emoji: "❄️", description: "Tradiciones de fin de noviembre en España. Empieza el ambiente invernal.", type: "holiday" },
      { day: 15, name: "Feria del Libro / eventos de otoño", country: "varios", emoji: "📚", description: "Ferias literarias de noviembre en varias capitales. Lecturas públicas.", type: "festival" },
    ],
  },
  12: {
    note: "Diciembre ilumina el mundo hispano con Adviento, Navidad y Año Viejo.",
    events: [
      { day: 6, name: "Día de la Constitución (España)", country: "España", emoji: "📜", description: "Feriado constitucional español. Puente hacia la Inmaculada.", type: "holiday" },
      { day: 8, name: "Inmaculada Concepción", country: "España / LatAm", emoji: "✨", description: "Festividad religiosa y feriado en varios países. Empieza el ambiente navideño fuerte.", type: "holiday" },
      { day: 12, name: "Virgen de Guadalupe", country: "México", emoji: "🌹", description: "Una de las peregrinaciones más grandes del mundo. Mañanitas y basílica.", type: "holiday" },
      { day: 16, name: "Las Posadas (inicio típico)", country: "México / Centroamérica", emoji: "🕯️", description: "Nueve noches de cantos, piñatas y punch. Se revive el camino a Belén.", type: "festival" },
      { day: 24, name: "Nochebuena", country: "varios", emoji: "🎄", description: "Cena familiar principal de Navidad. Tamales, lechón o mariscos según país.", type: "holiday" },
      { day: 25, name: "Navidad", country: "varios", emoji: "🎁", description: "Día festivo de regalos y misa. Ambientes familiares y villancicos.", type: "holiday" },
      { day: 28, name: "Día de los Santos Inocentes", country: "España / LatAm", emoji: "😜", description: "Día de bromas similar a April Fools. Medios publican noticias falsas divertidas.", type: "cultural" },
      { day: 31, name: "Nochevieja", country: "varios", emoji: "🍇", description: "Doce uvas en España; maletas y rituales en LatAm. Brindis a medianoche.", type: "holiday" },
    ],
  },
};

const FR_MONTHS: Record<number, MonthBank> = {
  1: {
    note: "Janvier commence avec le Nouvel An et l'Épiphanie dans le monde francophone.",
    events: [
      { day: 1, name: "Jour de l'An", country: "plusieurs", emoji: "🎉", description: "On se souhaite la bonne année et on partage galettes plus tard dans le mois. C'est un jour férié.", type: "holiday" },
      { day: 6, name: "Épiphanie / Galette des rois", country: "France / Belgique", emoji: "👑", description: "On partage la galette des rois avec une fève. Le tirage désigne le roi ou la reine du jour.", type: "festival" },
      { day: 15, name: "Festival Regard Benin (saison culturelle)", country: "Bénin", emoji: "🎭", description: "La saison culturelle ouest-africaine propose danse et théâtre. Les scènes accueillent des artistes régionaux.", type: "festival" },
      { day: 11, name: "Commémorations de janvier", country: "Haïti", emoji: "🇭🇹", description: "Des actes culturels marquent l'histoire haïtienne en janvier. Musique et discours publics.", type: "cultural" },
      { day: 20, name: "Saint-Sébastien / fêtes locales", country: "France", emoji: "🕯️", description: "Certaines communes fêtent leur saint patron en janvier. Processions et repas de village.", type: "cultural" },
      { day: 27, name: "Journée de la mémoire", country: "France / Belgique", emoji: "🕯️", description: "Des cérémonies scolaires rappellent l'histoire européenne. Moments de recueillement.", type: "cultural" },
      { day: 8, name: "Rentrée culturelle d'hiver", country: "Québec", emoji: "📚", description: "Théâtres et bibliothèques relancent la saison après les Fêtes. Spectacles en français.", type: "cultural" },
      { day: 21, name: "Fête de la communauté (variée)", country: "plusieurs", emoji: "🤝", description: "Rencontres associatives francophones en janvier. Ateliers et cafés-causeries.", type: "cultural" },
    ],
  },
  2: {
    note: "Février est le mois du Carnaval et de la Chandeleur.",
    events: [
      { day: 2, name: "Chandeleur", country: "France / Belgique", emoji: "🥞", description: "On mange des crêpes en famille. Tradition de prosperité et de partage.", type: "festival" },
      { day: 14, name: "Saint-Valentin", country: "plusieurs", emoji: "💕", description: "Fête des amoureux dans le monde francophone. Fleurs et dîners.", type: "cultural" },
      { day: 15, name: "Carnaval de Dunkerque (période typique)", country: "France", emoji: "🎭", description: "Défilés costumés et chants de carnaval dans le Nord. Ambiance festive malgré le froid.", type: "festival" },
      { day: 18, name: "Carnaval de Québec (période typique)", country: "Canada", emoji: "❄️", description: "Défilés sur neige, bonhomme Carnaval et caribou. Grand festival d'hiver.", type: "festival" },
      { day: 12, name: "Carnaval antillais (période typique)", country: "Haïti / Antilles", emoji: "💃", description: "Défilés, groupes et danse avant le Carême. Couleurs et percussions.", type: "festival" },
      { day: 28, name: "Ndimby / saisons musicales", country: "Madagascar", emoji: "🎶", description: "Concerts et scènes francophones de fin d'été austral. Musique métissée.", type: "cultural" },
      { day: 3, name: "Fête du N'kwidjin / marchés", country: "Cameroun", emoji: "🛍️", description: "Marchés animés et fêtes locales de février. Cuisine de rue et musique.", type: "cultural" },
      { day: 21, name: "Semaine du goût / ateliers (varié)", country: "plusieurs", emoji: "🧀", description: "Ateliers culinaires d'hiver en français. Vocabulaire gourmand.", type: "cultural" },
    ],
  },
  3: {
    note: "Mars annonce le printemps et la Francophonie.",
    events: [
      { day: 8, name: "Journée internationale des droits des femmes", country: "plusieurs", emoji: "💜", description: "Marches et débats dans les villes francophones. Culture et égalité.", type: "cultural" },
      { day: 14, name: "Printemps des poètes (période typique)", country: "France", emoji: "📜", description: "Lectures de poésie dans écoles et cafés. La langue française se célèbre en vers.", type: "festival" },
      { day: 20, name: "Journée internationale de la Francophonie", country: "plusieurs", emoji: "🌍", description: "Plus de 300 millions de francophones célèbrent la langue. Concours et concerts.", type: "cultural" },
      { day: 21, name: "Nowruz / diversité (communautés)", country: "plusieurs", emoji: "🌱", description: "Des communautés francophones célèbrent le nouvel an printanier. Tables de fête.", type: "cultural" },
      { day: 24, name: "Semaine sainte (date mobile)", country: "plusieurs", emoji: "✝️", description: "Processions dans les pays catholiques francophones. Traditions locales.", type: "holiday" },
      { day: 1, name: "Saint-David / ponts culturels", country: "Belgique / France", emoji: "🌿", description: "Début mars voit des fêtes locales et foires. Ambiance de fin d'hiver.", type: "cultural" },
      { day: 15, name: "Festival Jazz (saisons africaines)", country: "Sénégal", emoji: "🎷", description: "Dakar et Saint-Louis accueillent des scènes jazz. Improvisation et français croisé.", type: "festival" },
      { day: 28, name: "Fêtes de printemps scolaires", country: "plusieurs", emoji: "🌷", description: "Sorties pédagogiques et spectacles d'école. Chansons en français.", type: "cultural" },
    ],
  },
  4: {
    note: "Avril mélange Pâques, poisson d'avril et saisons des pluies africaines.",
    events: [
      { day: 1, name: "Poisson d'avril", country: "France / Belgique / Québec", emoji: "🐟", description: "On colle des poissons en papier dans le dos. Blagues légères partout.", type: "cultural" },
      { day: 6, name: "Pâques (date mobile souvent mars/avril)", country: "plusieurs", emoji: "🐣", description: "Chasse aux œufs et repas familial. Jour férié dans beaucoup de pays.", type: "holiday" },
      { day: 7, name: "Journée mondiale de la santé", country: "plusieurs", emoji: "🏥", description: "Campagnes de sensibilisation en français. Vocabulaire médical utile.", type: "cultural" },
      { day: 16, name: "Foires de printemps", country: "France", emoji: "🌷", description: "Marchés aux fleurs et brocantes. Ambiance de redoux.", type: "festival" },
      { day: 22, name: "Jour de la Terre", country: "plusieurs", emoji: "🌍", description: "Actions écologiques dans les écoles francophones. Nettoyage et ateliers.", type: "cultural" },
      { day: 25, name: "Fête de la libération (Italie/influence) / actes locaux", country: "plusieurs", emoji: "🕊️", description: "Commémorations printanières locales. Discours et drapeaux.", type: "cultural" },
      { day: 12, name: "Festival des cerisiers / culture", country: "France", emoji: "🌸", description: "Parcs partagés et pique-niques. Photo et promenade.", type: "cultural" },
      { day: 30, name: "Nuit des musées (période proche)", country: "France / Belgique", emoji: "🖼️", description: "Ouvertures nocturnes gratuites ou spéciales. Art accessible.", type: "festival" },
    ],
  },
  5: {
    note: "Mai célèbre le travail, l'Europe et les fêtes mariales.",
    events: [
      { day: 1, name: "Fête du Travail", country: "plusieurs", emoji: "🛠️", description: "Jour férié avec muguet en France. Manifestations syndicales.", type: "holiday" },
      { day: 8, name: "Victoire 1945", country: "France", emoji: "🎖️", description: "Commémoration de la fin de la guerre en Europe. Cérémonies publiques.", type: "holiday" },
      { day: 9, name: "Journée de l'Europe", country: "plusieurs", emoji: "🇪🇺", description: "Institutions et écoles parlent d'unité européenne. Drapeaux bleus.", type: "cultural" },
      { day: 15, name: "Saint-Honoré / pâtisserie", country: "France", emoji: "🍰", description: "Les pâtissiers célèbrent leur saint patron. Vitrines gourmandes.", type: "cultural" },
      { day: 21, name: "Lundi de Pentecôte (date mobile)", country: "France / Belgique", emoji: "⛪", description: "Pont de mai selon les années. Sorties en famille.", type: "holiday" },
      { day: 24, name: "Fête des mères (souvent mai)", country: "plusieurs", emoji: "💐", description: "Brunch et cadeaux faits main. Vocabulaire familial.", type: "cultural" },
      { day: 10, name: "Ascension (date mobile)", country: "plusieurs", emoji: "✝️", description: "Jour férié religieux dans plusieurs pays. Week-end prolongé.", type: "holiday" },
      { day: 18, name: "Nuit européenne des musées", country: "plusieurs", emoji: "🖼️", description: "Musées ouverts en soirée. Files d'attente culturelles.", type: "festival" },
    ],
  },
  6: {
    note: "Juin offre la Fête de la musique et les feux de la Saint-Jean.",
    events: [
      { day: 1, name: "Fête des voisins (période typique)", country: "France / Belgique", emoji: "🏘️", description: "Apéritifs dans les rues et cours. Rencontres de quartier.", type: "cultural" },
      { day: 6, name: "Fête nationale suisse préparatifs / actes romands", country: "Suisse", emoji: "🇨🇭", description: "La Suisse romande prépare l'été avec marchés. Ambiance alpine.", type: "cultural" },
      { day: 15, name: "Fête des pères (souvent juin)", country: "plusieurs", emoji: "👔", description: "Repas en famille et cartes. Vocabulaire de parenté.", type: "cultural" },
      { day: 21, name: "Fête de la musique", country: "plusieurs", emoji: "🎵", description: "Concerts gratuits dans les rues du monde francophone. Amateur et pro mêlés.", type: "festival" },
      { day: 24, name: "Saint-Jean-Baptiste / Fête nationale du Québec", country: "Canada", emoji: "💙", description: "Défilés et spectacles à Montréal et Québec. Fierté francophone.", type: "holiday" },
      { day: 24, name: "Feux de la Saint-Jean", country: "France / Belgique", emoji: "🔥", description: "Feux de joie dans villages. Tradition du solstice.", type: "festival" },
      { day: 10, name: "Lever du Ndam / saisons", country: "Cameroun", emoji: "🥁", description: "Festivals culturels de saison sèche/pluie selon région. Danses traditionnelles.", type: "festival" },
      { day: 28, name: "Fin d'année scolaire", country: "plusieurs", emoji: "🎓", description: "Remises de prix et kermesses. Chansons d'école.", type: "cultural" },
    ],
  },
  7: {
    note: "Juillet rime avec Bastille et vacances d'été.",
    events: [
      { day: 1, name: "Fête du Canada", country: "Canada", emoji: "🇨🇦", description: "Célébrations bilingues; le français rayonne au Québec. Feux et concerts.", type: "holiday" },
      { day: 4, name: "Rendez-vous culturels d'été", country: "plusieurs", emoji: "☀️", description: "Festivals en plein air en Afrique et en Europe. Scènes francophones.", type: "festival" },
      { day: 14, name: "Fête nationale française", country: "France", emoji: "🇫🇷", description: "Défilé, bals populaires et feux d'artifice. Jour de la Bastille.", type: "holiday" },
      { day: 15, name: "Festival d'Avignon (période typique)", country: "France", emoji: "🎭", description: "Théâtre dans toute la ville. Vitrine mondiale du spectacle vivant.", type: "festival" },
      { day: 18, name: "Jazz à Juan / festivals Côte", country: "France", emoji: "🎷", description: "Jazz estival sur la Côte d'Azur. Soirées en terrasse.", type: "festival" },
      { day: 21, name: "Fête nationale belge", country: "Belgique", emoji: "🇧🇪", description: "Feux d'artifice et concerts à Bruxelles. Pays bilingue/trilingue.", type: "holiday" },
      { day: 28, name: "Vacances et colonies", country: "plusieurs", emoji: "⛺", description: "Départs en camp d'été francophones. Jeux et chansons.", type: "cultural" },
      { day: 10, name: "Tabaski (date mobile parfois)", country: "Afrique de l'Ouest", emoji: "🐑", description: "Grande fête musulmane dans des pays francophones. Partage de repas.", type: "holiday" },
    ],
  },
  8: {
    note: "Août est le mois des fêtes patronales et des festivals africains.",
    events: [
      { day: 1, name: "Fête nationale suisse", country: "Suisse", emoji: "🇨🇭", description: "Feux sur les montagnes et lampions. La Suisse romande célèbre en français.", type: "holiday" },
      { day: 15, name: "Assomption", country: "France / Belgique / Afrique", emoji: "🌟", description: "Jour férié religieux. Processions mariales.", type: "holiday" },
      { day: 17, name: "Festivals des masques", country: "Burkina Faso", emoji: "🎭", description: "Traditions de masques et danses. Tourisme culturel.", type: "festival" },
      { day: 20, name: "Festival international de folklore", country: "plusieurs", emoji: "💃", description: "Troupes francophones partagent danses. Costumes et tambours.", type: "festival" },
      { day: 12, name: "Pèlerinage / fêtes mariales", country: "plusieurs", emoji: "🙏", description: "Pèlerinages d'été en France et outre-mer. Chants religieux.", type: "cultural" },
      { day: 25, name: "Nuit des étoiles (période typique)", country: "France", emoji: "⭐", description: "Observation astronomique grand public. Vocabulaire scientifique.", type: "cultural" },
      { day: 4, name: "Independence / fêtes civiques (Burkina 4 août)", country: "Burkina Faso", emoji: "🇧🇫", description: "Fête nationale burkinabè. Défilés et concerts.", type: "holiday" },
      { day: 7, name: "Fête de l'indépendance (Côte d'Ivoire 7 août)", country: "Côte d'Ivoire", emoji: "🇨🇮", description: "Célébrations nationales à Abidjan et Yamoussoukro. Drapeaux orange-blanc-vert.", type: "holiday" },
    ],
  },
  9: {
    note: "Septembre marque la rentrée et les vendanges.",
    events: [
      { day: 1, name: "Rentrée scolaire", country: "France / Belgique / Afrique", emoji: "🎒", description: "Cartables neufs et emploi du temps. Expression clé: bonne rentrée.", type: "cultural" },
      { day: 8, name: "Fête de la Nativité / traditions", country: "plusieurs", emoji: "✨", description: "Fêtes religieuses locales de septembre. Marchés.", type: "holiday" },
      { day: 15, name: "Journées du patrimoine (période typique)", country: "France / Belgique", emoji: "🏛️", description: "Monuments ouverts gratuitement. Files devant musées.", type: "festival" },
      { day: 21, name: "Journée internationale de la paix", country: "plusieurs", emoji: "🕊️", description: "Écoles francophones organisent ateliers. Chansons de paix.", type: "cultural" },
      { day: 27, name: "Journée européenne des langues", country: "plusieurs", emoji: "🗣️", description: "On célèbre le plurilinguisme. Ateliers de français langue étrangère.", type: "cultural" },
      { day: 12, name: "Vendanges", country: "France / Suisse", emoji: "🍇", description: "Récolte du raisin dans les vignobles. Fêtes villageoises.", type: "festival" },
      { day: 24, name: "Fêtes de la Communauté", country: "plusieurs", emoji: "🤝", description: "Assemblées culturelles francophones. Cuisine partagée.", type: "cultural" },
      { day: 30, name: "Fin de septembre littéraire", country: "plusieurs", emoji: "📖", description: "Salons du livre de rentrée. Prix et dédicaces.", type: "cultural" },
    ],
  },
  10: {
    note: "Octobre apporte les vendanges tardives et la semaine bleue.",
    events: [
      { day: 1, name: "Journée internationale des personnes âgées", country: "plusieurs", emoji: "💙", description: "Semaine bleue en France. Rencontres intergénérationnelles.", type: "cultural" },
      { day: 4, name: "Saint-François / fêtes locales", country: "plusieurs", emoji: "🌿", description: "Fêtes patronales d'automne. Marchés de produits.", type: "cultural" },
      { day: 12, name: "Fêtes des vendanges de Montmartre", country: "France", emoji: "🍇", description: "Défilé et fête populaire à Paris. Vin et fanfares.", type: "festival" },
      { day: 18, name: "Foires d'automne", country: "Belgique / France", emoji: "🍂", description: "Foires agricoles et artisanales. Fromages et bières.", type: "festival" },
      { day: 24, name: "Semaine d'activités scolaires", country: "plusieurs", emoji: "📚", description: "Projets pédagogiques d'automne. Exposés en français.", type: "cultural" },
      { day: 31, name: "Halloween", country: "France / Québec / Belgique", emoji: "🎃", description: "De plus en plus fêté; très populaire au Québec. Costumes et bonbons.", type: "cultural" },
      { day: 9, name: "Journée du cinéma francophone (variée)", country: "plusieurs", emoji: "🎬", description: "Projections et débats. Films en VO française.", type: "festival" },
      { day: 16, name: "Journée mondiale de l'alimentation", country: "plusieurs", emoji: "🍽️", description: "Ateliers cuisine et solidarité. Vocabulaire alimentaire.", type: "cultural" },
    ],
  },
  11: {
    note: "Novembre est le mois du souvenir et du Beaujolais.",
    events: [
      { day: 1, name: "Toussaint", country: "France / Belgique", emoji: "🕯️", description: "Jour férié: fleurissement des tombes. Chrysanthèmes.", type: "holiday" },
      { day: 11, name: "Armistice 1918", country: "France / Belgique", emoji: "🎖️", description: "Minute de silence et cérémonies. Coquelicots et drapeaux.", type: "holiday" },
      { day: 15, name: "Fête du Roi / dynastie (Belgique)", country: "Belgique", emoji: "🇧🇪", description: "Fête du Roi en Belgique. Actes officiels.", type: "holiday" },
      { day: 20, name: "Journée internationale des droits de l'enfant", country: "plusieurs", emoji: "🧸", description: "Écoles organisent débats et spectacles. Droits en français simple.", type: "cultural" },
      { day: 21, name: "Beaujolais nouveau", country: "France", emoji: "🍷", description: "Arrivée festive du vin nouveau. Bistrots bondés.", type: "festival" },
      { day: 25, name: "Sainte-Catherine / traditions", country: "France", emoji: "🎩", description: "Ancienne fête des Catherinettes. Folklore léger.", type: "cultural" },
      { day: 30, name: "Saint-André", country: "plusieurs", emoji: "❄️", description: "Traditions de fin novembre. Marchés de Noël ouvrent.", type: "cultural" },
      { day: 18, name: "FESPACO (années bisannuelles, Ouaga)", country: "Burkina Faso", emoji: "🎥", description: "Grand festival panafricain du cinéma. Films et débats.", type: "festival" },
    ],
  },
  12: {
    note: "Décembre illumine la francophonie avec l'Avent et Noël.",
    events: [
      { day: 6, name: "Saint-Nicolas", country: "Belgique / France du Nord", emoji: "🎁", description: "Le saint apporte des cadeaux aux enfants. Pain d'épices et chocolat.", type: "festival" },
      { day: 8, name: "Immaculée Conception", country: "plusieurs", emoji: "✨", description: "Fête religieuse et illuminations. Début intense de l'Avent.", type: "holiday" },
      { day: 13, name: "Sainte-Lucie / marchés", country: "plusieurs", emoji: "🕯️", description: "Marchés de Noël francophones. Vin chaud et sapins.", type: "festival" },
      { day: 21, name: "Solstice d'hiver", country: "plusieurs", emoji: "🌑", description: "Soirées les plus longues; feux et concerts. Ambiance intimiste.", type: "cultural" },
      { day: 24, name: "Réveillon de Noël", country: "plusieurs", emoji: "🎄", description: "Grand repas du 24 au soir. Fruits de mer ou dinde selon région.", type: "holiday" },
      { day: 25, name: "Noël", country: "plusieurs", emoji: "🎁", description: "Jour férié de cadeaux et famille. Chants de Noël.", type: "holiday" },
      { day: 26, name: "Saint-Étienne", country: "France (Alsace) / Belgique", emoji: "🎁", description: "Deuxième jour de Noël dans certaines régions. Visites familiales.", type: "holiday" },
      { day: 31, name: "Saint-Sylvestre", country: "plusieurs", emoji: "🥂", description: "Réveillon du Nouvel An. Vœux à minuit.", type: "holiday" },
    ],
  },
};

const MONTH_NAMES_ES = ["","enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MONTH_NAMES_FR = ["","janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getCalendarEvents(
  language: "es" | "fr",
  year: number,
  month: number,
): { events: CalendarEvent[]; month_note: string } {
  const m = Math.min(12, Math.max(1, Math.floor(month)));
  const y = Math.floor(year) || new Date().getFullYear();
  const bank = language === "fr" ? FR_MONTHS[m] : ES_MONTHS[m];
  if (!bank) return { events: [], month_note: "" };

  const dim = daysInMonth(y, m);
  const events: CalendarEvent[] = bank.events.map((e) => {
    const day = Math.min(e.day, dim);
    const mm = String(m).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return {
      date: `${y}-${mm}-${dd}`,
      name: e.name,
      country: e.country,
      emoji: e.emoji,
      description: e.description,
      type: e.type,
    };
  });

  const monthName = language === "fr" ? MONTH_NAMES_FR[m] : MONTH_NAMES_ES[m];
  const month_note = `${bank.note} (${monthName} ${y})`;
  return { events, month_note };
}
