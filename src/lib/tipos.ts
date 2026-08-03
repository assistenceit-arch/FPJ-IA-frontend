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
  cai?: string;
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
  usoEsposas: boolean;
  justificacionEsposas?: string;
  presentaLesiones: boolean;
  descripcionLesiones?: string;
  trasladoCentroAsistencial: boolean;
  centroAsistencial?: string;
  motivoTraslado?: string;
  autoridadReceptora: string;
  justificacionDemora?: string;
  demoraExistente?: boolean;
  // Bloque 6: Relato de los hechos
  observacionInicial?: string;
  desarrolloIntervencion?: string;
  tieneCircunstanciaRelevante?: boolean;
  circunstanciaRelevante?: string;
  tieneObservacionAdicional?: boolean;
  observacionAdicional?: string;
}

export const CLAVES_ACTUACIONES = [
  "derechosLeidos",
  "fechaDerechos",
  "horaDerechos",
  "comprendeDerechos",
  "usoEsposas",
  "justificacionEsposas",
  "presentaLesiones",
  "descripcionLesiones",
  "trasladoCentroAsistencial",
  "centroAsistencial",
  "motivoTraslado",
  "autoridadReceptora",
  "justificacionDemora",
  "observacionInicial",
  "desarrolloIntervencion",
  "tieneCircunstanciaRelevante",
  "circunstanciaRelevante",
  "tieneObservacionAdicional",
  "observacionAdicional",
] as const;

export const ACTUACIONES_VACIAS: ActuacionesProcedimiento = {
  derechosLeidos: false,
  fechaDerechos: "",
  horaDerechos: "",
  comprendeDerechos: false,
  usoEsposas: false,
  presentaLesiones: false,
  trasladoCentroAsistencial: false,
  autoridadReceptora: "",
};
