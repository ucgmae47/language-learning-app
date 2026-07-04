/**
 * Common 5-letter Spanish words for Wordle.
 * All uppercase, no accent marks (simplifies keyboard input).
 * Deterministic daily word is derived from this list by index.
 */
export const WORDS_ES: string[] = [
  "GATOS", "PERRO", "LIBRO", "MUNDO", "NOCHE", "TARDE", "PLAZA", "CAMPO",
  "VERDE", "NUEVO", "BUENO", "CALLE", "MADRE", "PADRE", "MANOS", "VINOS",
  "PECHO", "BESOS", "CIELO", "SUELO", "VUELO", "HIELO", "MIEDO", "FUEGO",
  "JUEGO", "LUEGO", "VIEJO", "LECHE", "COCHE", "RONDA", "BANCO", "BAILE",
  "CABLE", "FICHA", "PLAYA", "PASTA", "GUSTO", "JUSTO", "SUSTO", "TEXTO",
  "FINCA", "PINTA", "TINTA", "MENTA", "VENTA", "RENTA", "LETRA", "BELLA",
  "BELLO", "SELLO", "POLLO", "BOLLO", "ROLLO", "FALLA", "MALLA", "CALLA",
  "VALLA", "BOLSA", "SALSA", "FALSA", "PRESA", "FRESA", "QUESO", "PRESO",
  "GRAMO", "DRAMA", "PRIMA", "CREMA", "PLUMA", "BLUSA", "BRUJA", "BARCA",
  "MANGA", "PLATA", "NOTAS", "BOTAS", "TOTAL", "CORAL", "MORAL", "VOCAL",
  "LOCAL", "SOLAR", "POLAR", "LUNAR", "FINAL", "CANAL", "TRECE", "NUEVE",
  "SIETE", "CINCO", "DOBLE", "NOBLE", "RUBIO", "LABIO", "RADIO", "PRISA",
  "BRISA", "GANGA", "RANGO", "MANGO", "TANGO", "LARGO", "CARGO", "AMIGO",
  "LINDO", "CALMA", "PALMA", "CULPA", "PULPO", "GRUPO", "TURBO", "CURVO",
  "SURCO", "MARCO", "BARCO", "PARCO", "CLAVO", "BRAVO", "SUAVE", "GRAVE",
  "DOBLE", "PRADO", "GRADO", "FRADO", "LAZO",  "PLAZO", "BRAZO", "TRAGO",
  "LARGO", "CLARO", "PARO",  "BARRO", "CARRO", "GORRO", "ZORRO", "BURRO",
  "TURNO", "CURVA", "PURGA", "MUGRE", "LUSTRE","BUSTO", "GUSTO", "JUSTO",
  "FONDO", "RONDO", "HONDO", "PONDO", "MUNDO", "PLENO", "LLENO", "BUENO",
  "FRENO", "TOREO", "PASEO", "DESEO", "TORSO", "VERSO", "CURSO", "BURSA",
  "TURBA", "CURVA", "SURCO", "BURRO", "TURCO", "ZURCO", "DURCE", "DULCE",
  "PULSE", "BULTO", "CULTO", "MULTO", "VULTO", "FUTIL", "SUTIL", "UNTIL",
  "FRUTA", "BRUTA", "PUNTA", "JUNTA", "MUNTA", "CUNHA", "LUCHA", "MUCHA",
  "CUCHA", "BUCHE", "DUCHA", "LUCHE", "PUCHE", "TUCHE", "CUCHI", "FUCHI",
];

export function getDailyWordEs(): string {
  const epoch = new Date("2024-01-01").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.floor((today.getTime() - epoch) / 86_400_000);
  return WORDS_ES[day % WORDS_ES.length]!;
}
