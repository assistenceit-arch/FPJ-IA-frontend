import type { EstadoGuardado } from "@/lib/useAutoguardado";

export function IndicadorGuardado({ estado }: { estado: EstadoGuardado }) {
  if (estado === "inactivo") return null;

  const config: Record<Exclude<EstadoGuardado, "inactivo">, { texto: string; color: string }> = {
    guardando: { texto: "Guardando…", color: "text-institucional-700" },
    guardado: { texto: "Guardado", color: "text-estado-completo" },
    error: { texto: "No se pudo guardar — reintentando…", color: "text-estado-error" },
  };

  const { texto, color } = config[estado];

  return (
    <span className={`font-sans text-xs ${color}`} role="status" aria-live="polite">
      {texto}
    </span>
  );
}
