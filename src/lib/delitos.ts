/**
 * Adenda 2026-08-12: lista de delitos soportados por el sistema. Debe
 * coincidir EXACTO (sensible a mayúsculas/tildes) con el mapeo del
 * backend (src/narrativa/delitos.ts) — el valor guardado en
 * Procedimiento.delito es lo que el backend usa para elegir qué set de
 * reglas de narrativa aplicar, y lo que estas pantallas usan para
 * decidir qué formularios adicionales mostrar (ej. Arma solo aparece
 * como tipo de elemento cuando el delito es de armas).
 */
export const DELITOS_SOPORTADOS = [
  "Tráfico, Fabricación o Porte de Estupefacientes",
  "Porte Ilegal de Armas de Fuego",
  "Hurto",
  "Lesiones Personales",
] as const;

export type DelitoSoportado = (typeof DELITOS_SOPORTADOS)[number];

export const DELITO_ARMAS: DelitoSoportado = "Porte Ilegal de Armas de Fuego";
export const DELITO_ESTUPEFACIENTES: DelitoSoportado =
  "Tráfico, Fabricación o Porte de Estupefacientes";
export const DELITO_HURTO: DelitoSoportado = "Hurto";
export const DELITO_LESIONES: DelitoSoportado = "Lesiones Personales";
