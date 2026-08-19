"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Procedimiento } from "@/lib/tipos";
import { CampoHora } from "@/components/CampoHora";
import { DELITOS_SOPORTADOS, DELITO_ESTUPEFACIENTES } from "@/lib/delitos";

/**
 * NOTA: los campos exactos que exige POST /procedimientos todavía no se
 * verificaron contra la API real (a diferencia del resto del backend, que
 * se probó end-to-end en la Fase 4). Este formulario es un primer intento
 * razonable basado en los campos que sí conocemos del modelo
 * Procedimiento — hay que confirmarlo en la primera prueba real y
 * ajustar si el backend espera algo distinto.
 */
export default function PaginaNuevoProcedimiento() {
  const router = useRouter();
  const [fechaCaptura, setFechaCaptura] = useState("");
  const [horaCaptura, setHoraCaptura] = useState("");
  const [delito, setDelito] = useState<string>(DELITO_ESTUPEFACIENTES);
  const [tipoProcedimiento, setTipoProcedimiento] = useState<"ESTANDAR" | "COMPLEJO">("ESTANDAR");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    if (!horaCaptura) {
      setError("La hora de captura/aprehensión es obligatoria.");
      return;
    }
    if (!delito.trim()) {
      setError("El delito es obligatorio.");
      return;
    }
    setCargando(true);
    try {
      const nuevo = await api.post<Procedimiento>("/procedimientos", {
        delito: delito.trim(),
        tipoProcedimiento,
        fechaCaptura: `${fechaCaptura}T00:00:00.000Z`,
        horaCaptura,
      });
      // Adenda 2026-08-08: un procedimiento COMPLEJO requiere pago antes
      // de continuar (con asesoría especializada), así que se envía
      // directo al Bloque 8 en vez del Bloque 1.
      if (tipoProcedimiento === "COMPLEJO") {
        router.push(`/procedimientos/${nuevo.id}/pago`);
      } else {
        router.push(`/procedimientos/${nuevo.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible crear el procedimiento.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/procedimientos" className="font-sans text-sm text-institucional-700 hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-3 font-display text-2xl text-institucional-950">Nuevo procedimiento</h1>
      <p className="mt-1 font-sans text-sm text-institucional-700">
        Podrás completar el resto de la información más adelante — no hace falta terminarlo todo
        ahora.
      </p>

      <form onSubmit={manejarEnvio} className="mt-8 space-y-5 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Delito <span className="text-estado-error">*</span>
          </label>
          <select
            required
            value={delito}
            onChange={(e) => setDelito(e.target.value)}
            className="w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm outline-none focus:border-acento"
          >
            {DELITOS_SOPORTADOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="mt-1 font-sans text-xs text-institucional-700">
            El delito determina qué formularios adicionales se habilitan más adelante (ej. tipo
            de elementos incautados disponibles).
          </p>
        </div>

        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="mb-1 font-sans text-sm font-medium text-institucional-900">
            Fecha y hora de captura/aprehensión
          </legend>
          <input
            type="date"
            required
            value={fechaCaptura}
            onChange={(e) => setFechaCaptura(e.target.value)}
            className="rounded-md border border-institucional-100 px-3 py-2 font-sans text-sm outline-none focus:border-acento"
          />
          <CampoHora value={horaCaptura} onChange={setHoraCaptura} />
        </fieldset>

        <p className="rounded-md bg-institucional-100 px-3 py-2.5 font-sans text-xs text-institucional-800">
          La fecha y hora de puesta a disposición se registra más adelante, cuando se conozca —
          no se pide aquí porque normalmente no se sabe todavía al momento de crear el
          procedimiento.
        </p>

        <div>
          <label className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Tipo de procedimiento
          </label>
          <div className="flex gap-3">
            {(["ESTANDAR", "COMPLEJO"] as const).map((tipo) => (
              <button
                type="button"
                key={tipo}
                onClick={() => setTipoProcedimiento(tipo)}
                className={`rounded-md border px-3 py-2 font-sans text-sm transition-colors ${
                  tipoProcedimiento === tipo
                    ? "border-acento bg-acento-light text-acento-hover"
                    : "border-institucional-100 text-institucional-700 hover:bg-institucional-50"
                }`}
              >
                {tipo === "ESTANDAR" ? "Estándar" : "Complejo"}
              </button>
            ))}
          </div>
          {tipoProcedimiento === "COMPLEJO" && (
            <p className="mt-2 font-sans text-xs text-institucional-700">
              Los procedimientos complejos requieren pago con asesoría especializada — al crearlo
              irás directo al Bloque 8 (Pago).
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="font-sans text-sm text-estado-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Creando…" : "Crear procedimiento"}
        </button>
      </form>
    </div>
  );
}
