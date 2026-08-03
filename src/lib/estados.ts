import type {
  EstadoBloque,
  FuncionarioActuante,
  LugarProcedimiento,
} from "@/lib/tipos";

export function estadoFuncionario(funcionario: FuncionarioActuante | null): EstadoBloque {
  if (!funcionario) return "vacio";
  const requeridos = [
    funcionario.nombreCompleto,
    funcionario.documento,
    funcionario.entidad,
    funcionario.cargo,
    funcionario.telefono,
    funcionario.correo,
    funcionario.placa,
    funcionario.zonaAtencion,
    funcionario.estacion,
    funcionario.servicio,
  ];
  return requeridos.every((v) => Boolean(v && v.trim())) ? "completo" : "pendiente";
}

export function estadoLugar(lugar: LugarProcedimiento | null): EstadoBloque {
  if (!lugar) return "vacio";
  const requeridos = [lugar.departamento, lugar.municipio, lugar.barrio, lugar.direccion];
  return requeridos.every((v) => Boolean(v && v.trim())) ? "completo" : "pendiente";
}

export function estadoIntervinientes(cantidad: number | null): EstadoBloque {
  if (cantidad === null) return "vacio";
  return cantidad > 0 ? "completo" : "vacio";
}

export const PUNTO_ESTADO: Record<EstadoBloque, { emoji: string; color: string; texto: string }> = {
  vacio: { emoji: "⚪", color: "text-institucional-700/50", texto: "Sin diligenciar" },
  pendiente: { emoji: "🟡", color: "text-estado-pendiente", texto: "Pendiente" },
  completo: { emoji: "🟢", color: "text-estado-completo", texto: "Completo" },
};
