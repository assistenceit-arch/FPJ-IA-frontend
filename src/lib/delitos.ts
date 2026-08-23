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
  "Violencia contra Servidor Público",
  "Violencia Intrafamiliar",
  "Receptación",
  "Homicidio",
  "Suministro a Menor",
  "Uso de Documento Falso",
  "Falsedad Personal",
  "Tráfico de Moneda Falsa",
  "Secuestro",
  "Extorsión",
  "Daño en Bien Ajeno o del Estado",
] as const;

export type DelitoSoportado = (typeof DELITOS_SOPORTADOS)[number];

export const DELITO_ARMAS: DelitoSoportado = "Porte Ilegal de Armas de Fuego";
export const DELITO_ESTUPEFACIENTES: DelitoSoportado =
  "Tráfico, Fabricación o Porte de Estupefacientes";
export const DELITO_HURTO: DelitoSoportado = "Hurto";
export const DELITO_LESIONES: DelitoSoportado = "Lesiones Personales";
export const DELITO_VCSP: DelitoSoportado = "Violencia contra Servidor Público";
export const DELITO_VIF: DelitoSoportado = "Violencia Intrafamiliar";
export const DELITO_RECEPTACION: DelitoSoportado = "Receptación";
export const DELITO_HOMICIDIO: DelitoSoportado = "Homicidio";
export const DELITO_SUMINISTRO_MENOR: DelitoSoportado = "Suministro a Menor";
export const DELITO_USO_DOCUMENTO_FALSO: DelitoSoportado = "Uso de Documento Falso";
export const DELITO_FALSEDAD_PERSONAL: DelitoSoportado = "Falsedad Personal";
export const DELITO_TRAFICO_MONEDA_FALSA: DelitoSoportado = "Tráfico de Moneda Falsa";
export const DELITO_SECUESTRO: DelitoSoportado = "Secuestro";
export const DELITO_EXTORSION: DelitoSoportado = "Extorsión";
export const DELITO_DANO_EN_BIEN: DelitoSoportado = "Daño en Bien Ajeno o del Estado";
