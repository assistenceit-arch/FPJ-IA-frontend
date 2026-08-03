import type {
  ActuacionesProcedimiento,
  EstadoBloque,
  FuncionarioActuante,
  LugarProcedimiento,
  Procedimiento,
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
    // Adenda 2026-08-03: se había olvidado aquí al volver el CAI
    // obligatorio en el formulario — el punto pasaba a verde sin CAI.
    funcionario.cai,
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

/**
 * Bloque 4 — Elementos incautados. Cada elemento se valida por completo
 * antes de poder guardarse (no hay estado a medias por elemento), así que,
 * igual que Intervinientes, es un estado binario: sin elementos = vacío,
 * al menos uno registrado = completo.
 */
export function estadoElementos(cantidadElementos: number | null): EstadoBloque {
  if (cantidadElementos === null) return "vacio";
  return cantidadElementos > 0 ? "completo" : "vacio";
}

/**
 * Bloque 5 — Actuaciones procedimentales.
 *
 * "Vacío" si el registro nunca se ha guardado (el backend solo lo crea
 * cuando ya se diligenciaron fechaDerechos + horaDerechos +
 * autoridadReceptora, ver actuaciones/page.tsx). Una vez existe, es
 * "completo" solo si además: (a) los campos condicionales de cada
 * subsección están llenos cuando la pregunta Sí/No correspondiente fue
 * "Sí", (b) la puesta a disposición (fecha/hora, guardadas en el
 * Procedimiento) está diligenciada, (c) si el backend marcó
 * demoraExistente, hay justificación de la demora, y (d) cada
 * interviniente Aprehendido tiene respondida la pregunta de uso de
 * esposas (Adenda 2026-08-03: pasó de ser una sola respuesta del
 * procedimiento a una pregunta individual por interviniente Aprehendido).
 *
 * Nota: demoraExistente viene calculado por el backend en el último
 * guardado de actuaciones-procedimiento. Si la puesta a disposición se
 * edita después sin volver a tocar ningún campo de este bloque, ese valor
 * puede quedar desactualizado hasta el próximo guardado — es el mismo
 * pendiente de "revisar el flujo de demora" del roadmap.
 */
export function estadoActuaciones(
  actuaciones: ActuacionesProcedimiento | null,
  procedimiento: Procedimiento | null,
  aprehendidos: Array<{ usoEsposas: boolean | null; justificacionEsposas: string | null }> = [],
): EstadoBloque {
  if (!actuaciones) return "vacio";

  const requeridos: Array<string | null | undefined> = [
    actuaciones.autoridadReceptora,
    procedimiento?.fechaDisposicion,
    procedimiento?.horaDisposicion,
  ];

  if (actuaciones.derechosLeidos) {
    requeridos.push(actuaciones.fechaDerechos, actuaciones.horaDerechos);
  }
  if (actuaciones.presentaLesiones) {
    requeridos.push(actuaciones.descripcionLesiones);
  }
  if (actuaciones.trasladoCentroAsistencial) {
    requeridos.push(actuaciones.centroAsistencial, actuaciones.motivoTraslado);
  }
  if (actuaciones.demoraExistente) {
    requeridos.push(actuaciones.justificacionDemora);
  }

  const textosCompletos = requeridos.every((v) => Boolean(v && v.trim()));

  const esposasCompletas = aprehendidos.every((a) => {
    if (a.usoEsposas === null || a.usoEsposas === undefined) return false;
    if (a.usoEsposas === true) return Boolean(a.justificacionEsposas && a.justificacionEsposas.trim());
    return true;
  });

  return textosCompletos && esposasCompletas ? "completo" : "pendiente";
}

/**
 * Bloque 6 — Relato de los hechos. Comparte registro con el Bloque 5, así
 * que "vacío" también depende de que ese registro exista todavía.
 *
 * Nota/supuesto: observacionInicial y desarrolloIntervencion no están
 * marcados con asterisco (*) en la UI de relato/page.tsx, pero son el
 * contenido sustantivo de este bloque y alimentan directamente la
 * narrativa automática del FPJ-5, así que se tratan como obligatorios
 * para considerar el bloque completo. Si esa no es la intención, avísame
 * y lo ajusto.
 */
export function estadoRelato(actuaciones: ActuacionesProcedimiento | null): EstadoBloque {
  if (!actuaciones) return "vacio";

  const requeridos: Array<string | null | undefined> = [
    actuaciones.observacionInicial,
    actuaciones.desarrolloIntervencion,
  ];
  if (actuaciones.tieneCircunstanciaRelevante) {
    requeridos.push(actuaciones.circunstanciaRelevante);
  }
  if (actuaciones.tieneObservacionAdicional) {
    requeridos.push(actuaciones.observacionAdicional);
  }

  return requeridos.every((v) => Boolean(v && v.trim())) ? "completo" : "pendiente";
}

export const PUNTO_ESTADO: Record<EstadoBloque, { emoji: string; color: string; texto: string }> = {
  vacio: { emoji: "⚪", color: "text-institucional-700/50", texto: "Sin diligenciar" },
  pendiente: { emoji: "🟡", color: "text-estado-pendiente", texto: "Pendiente" },
  completo: { emoji: "🟢", color: "text-estado-completo", texto: "Completo" },
};
