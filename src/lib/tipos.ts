export interface Procedimiento {
  id: string;
  numeroInterno: string;
  fechaCreacion: string;
  nunc: string | null;
  fechaCaptura: string;
  horaCaptura: string;
  fechaDisposicion: string;
  horaDisposicion: string;
  delito: string;
  tipoProcedimiento: "ESTANDAR" | "COMPLEJO";
  estado: string;
  observacionesGenerales: string | null;
  activo: boolean;
}
