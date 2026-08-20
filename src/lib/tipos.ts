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
  derechosLeidos: boolean;
  fechaDerechos: string;
  horaDerechos: string;
  comprendeDerechos: boolean;
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
}

export const CLAVES_ACTUACIONES = [
  "derechosLeidos",
  "fechaDerechos",
  "horaDerechos",
  "comprendeDerechos",
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
] as const;

export const ACTUACIONES_VACIAS: ActuacionesProcedimiento = {
  derechosLeidos: false,
  fechaDerechos: "",
  horaDerechos: "",
  comprendeDerechos: false,
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
