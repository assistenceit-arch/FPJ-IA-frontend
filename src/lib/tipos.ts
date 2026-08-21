export interface Procedimiento {
  id: string;
  numeroInterno: string;
  fechaCreacion: string;
  nunc: string | null;
  fechaCaptura: string;
  horaCaptura: string;
  fechaDisposicion: string | null;
  horaDisposicion: string | null;
  delito: string;
  tipoProcedimiento: "ESTANDAR" | "COMPLEJO";
  estado: string;
  observacionesGenerales: string | null;
  activo: boolean;
  exoneradoPago: boolean;
  edicionDesbloqueada: boolean;
}

export interface FuncionarioActuante {
  nombreCompleto: string;
  documento: string;
  entidad: string;
  cargo: string;
  telefono: string;
  correo: string;
  placa: string;
  zonaAtencion: string;
  estacion: string;
  servicio: string;
  cai: string;
}

export interface CompaneroPatrulla {
  nombreCompleto: string;
  documento: string;
  placa: string;
  grado?: string;
}

export interface LugarProcedimiento {
  departamento: string;
  municipio: string;
  localidad?: string;
  barrio: string;
  direccion: string;
  caracteristicas?: string;
}

export type EstadoBloque = "vacio" | "pendiente" | "completo";

export interface ActuacionesProcedimiento {
  // Adenda 2026-08-21: derechosLeidos/fechaDerechos/horaDerechos/
  // comprendeDerechos se quitan de aquí -- pasan a ser individuales por
  // interviniente (ver Capturado en intervinientes/[capturadoId]),
  // porque cada persona puede haber sido capturada/aprehendida en un
  // momento distinto dentro del mismo procedimiento.
  autoridadReceptora: string;
  // Adenda 2026-08-20: individualizada por grupo (mayores/menores) en
  // procedimientos mixtos -- el campo de arriba se sigue usando tal
  // cual para procedimientos no mixtos.
  autoridadReceptoraAdultos?: string;
  autoridadReceptoraMenores?: string;
  justificacionDemora?: string;
  demoraExistente?: boolean;
  // Bloque 6: Relato de los hechos
  observacionInicial?: string;
  desarrolloIntervencion?: string;
  tieneCircunstanciaRelevante?: boolean;
  circunstanciaRelevante?: string;
  tieneObservacionAdicional?: boolean;
  observacionAdicional?: string;
  // Adenda 2026-08-20: existencia de testigos de los hechos (Sección 5
  // del FPJ 5). Si es true, se diligencia el listado de Testigo por
  // separado (misma dinámica que Intervinientes).
  existenTestigos?: boolean;
  // Adenda 2026-08-21 (módulo Hurto): existencia de víctimas
  // identificables (Sección 4 del FPJ 5). Mismo patrón que
  // existenTestigos. No aplica a Estupefacientes.
  existenVictimas?: boolean;
}

export const CLAVES_ACTUACIONES = [
  "autoridadReceptora",
  "autoridadReceptoraAdultos",
  "autoridadReceptoraMenores",
  "justificacionDemora",
  "observacionInicial",
  "desarrolloIntervencion",
  "tieneCircunstanciaRelevante",
  "circunstanciaRelevante",
  "tieneObservacionAdicional",
  "observacionAdicional",
  "existenTestigos",
  "existenVictimas",
] as const;

export const ACTUACIONES_VACIAS: ActuacionesProcedimiento = {
  autoridadReceptora: "",
};

// Adenda 2026-08-20: Testigos de los hechos (Sección 5 del FPJ 5), núcleo
// común transversal a todos los delitos. Misma dinámica que Capturado.
export interface Testigo {
  id: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  expedicionDocumento: string | null;
  fechaNacimiento: string | null;
  edad: number | null;
  genero: string | null;
  paisNacimiento: string | null;
  departamentoNacimiento: string | null;
  municipioNacimiento: string | null;
  profesionOficio: string | null;
  estadoCivil: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
}

// Adenda 2026-08-21 (módulo Hurto): Víctimas (Sección 4 del FPJ 5),
// núcleo común transversal a todos los delitos que las requieran.
// Mismos campos que Testigo + relacionIndiciado.
export interface Victima {
  id: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  expedicionDocumento: string | null;
  fechaNacimiento: string | null;
  edad: number | null;
  genero: string | null;
  paisNacimiento: string | null;
  departamentoNacimiento: string | null;
  municipioNacimiento: string | null;
  profesionOficio: string | null;
  estadoCivil: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  relacionIndiciado: string | null;
  // Adenda 2026-08-22 (módulo Lesiones Personales): estado físico,
  // núcleo común -- mismos campos que Capturado, sin motivoLesion.
  presentaLesiones: boolean | null;
  descripcionLesiones: string | null;
  parteCuerpoLesion: string | null;
  causanteLesion: string | null;
  elementoCausante: string | null;
  trasladoCentroAsistencial: boolean | null;
  centroAsistencial: string | null;
  motivoTraslado: string | null;
}
