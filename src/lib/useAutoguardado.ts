import { useCallback, useEffect, useRef, useState } from "react";

export type EstadoGuardado = "inactivo" | "guardando" | "guardado" | "error";

/**
 * Autoguardado con debounce: cada vez que `datos` cambia, espera
 * `esperaMs` sin más cambios y luego llama a `alGuardar(datos)`.
 * WF-M1-004/005: no existen botones manuales de guardado — todo se
 * guarda automáticamente. UI-010: al menos al abandonar la pantalla.
 */
export function useAutoguardado<T>(
  datos: T,
  alGuardar: (datos: T) => Promise<unknown>,
  opciones: { esperaMs?: number; activo?: boolean } = {},
) {
  const { esperaMs = 1200, activo = true } = opciones;
  const [estado, setEstado] = useState<EstadoGuardado>("inactivo");
  const primerRenderRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimoGuardadoRef = useRef<string>(JSON.stringify(datos));

  const guardarAhora = useCallback(
    async (valor: T) => {
      const serializado = JSON.stringify(valor);
      if (serializado === ultimoGuardadoRef.current) return;
      setEstado("guardando");
      try {
        await alGuardar(valor);
        ultimoGuardadoRef.current = serializado;
        setEstado("guardado");
      } catch {
        setEstado("error");
      }
    },
    [alGuardar],
  );

  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      ultimoGuardadoRef.current = JSON.stringify(datos);
      return;
    }
    if (!activo) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void guardarAhora(datos);
    }, esperaMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(datos), activo]);

  // Guardar de inmediato al desmontar (cambiar de pantalla), sin esperar
  // el debounce — UI-010: "guardarse automáticamente al abandonar la pantalla".
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const serializado = JSON.stringify(datos);
      if (serializado !== ultimoGuardadoRef.current) {
        void alGuardar(datos);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { estado, guardarAhora: () => guardarAhora(datos) };
}
