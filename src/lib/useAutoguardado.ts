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

  // Adenda 2026-08-03: refs que siempre reflejan el `datos`/`alGuardar`
  // más recientes. Son necesarios porque el efecto de "guardar al
  // desmontar" (más abajo) solo puede correr una vez, al desmontar de
  // verdad — si leyera `datos`/`alGuardar` directamente del closure de
  // ese efecto, quedaría atrapado con los valores del primer render
  // (React stale closure) y jamás vería lo último que el usuario
  // escribió, así que si el usuario salía de la pantalla antes de que
  // se cumpliera el debounce, ese último cambio se perdía en silencio.
  const datosRef = useRef(datos);
  const alGuardarRef = useRef(alGuardar);
  useEffect(() => {
    datosRef.current = datos;
    alGuardarRef.current = alGuardar;
  });

  const guardarAhora = useCallback(async (valor: T) => {
    const serializado = JSON.stringify(valor);
    if (serializado === ultimoGuardadoRef.current) return;
    setEstado("guardando");
    try {
      await alGuardarRef.current(valor);
      ultimoGuardadoRef.current = serializado;
      setEstado("guardado");
    } catch {
      setEstado("error");
    }
  }, []);

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
  // el debounce — UI-010: "guardarse automáticamente al abandonar la
  // pantalla". Usa los refs de arriba, NO `datos`/`alGuardar`
  // directamente, para no quedar atrapado con los valores del primer
  // render.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const serializado = JSON.stringify(datosRef.current);
      if (serializado !== ultimoGuardadoRef.current) {
        void alGuardarRef.current(datosRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { estado, guardarAhora: () => guardarAhora(datos) };
}
