"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { ActuacionesProcedimiento } from "@/lib/tipos";
import { ACTUACIONES_VACIAS, CLAVES_ACTUACIONES } from "@/lib/tipos";

const claseInput =
  "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

function Campo({ etiqueta, requerido, children }: { etiqueta: string; requerido?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
        {etiqueta}
        {requerido && <span className="text-estado-error"> *</span>}
      </span>
      {children}
    </label>
  );
}

function SiNo({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map((v) => (
        <button
          type="button"
          key={String(v)}
          onClick={() => onChange(v)}
          className={`rounded-md border px-4 py-2 font-sans text-sm transition-colors ${
            valor === v
              ? "border-acento bg-acento-light text-acento-hover"
              : "border-institucional-100 text-institucional-700 hover:bg-institucional-50"
          }`}
        >
          {v ? "Sí" : "No"}
        </button>
      ))}
    </div>
  );
}

export default function BloqueRelato() {
  const { id } = useParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<ActuacionesProcedimiento>(ACTUACIONES_VACIAS);
  const [faltaBloque5, setFaltaBloque5] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<ActuacionesProcedimiento | null>(`/procedimientos/${id}/actuaciones-procedimiento`)
      .then((a) => {
        if (cancelado) return;
        if (a) {
          setDatos({ ...ACTUACIONES_VACIAS, ...soloClaves(a, CLAVES_ACTUACIONES) });
        }
        // Adenda 2026-08-03: esto ahora es solo informativo — el relato
        // ya se guarda igual aunque falte el Bloque 5 (el backend admite
        // borrador parcial). Antes esto bloqueaba también el guardado.
        // Adenda 2026-08-21: la lectura de derechos pasó a ser individual
        // por interviniente (ya no vive en este registro), así que este
        // aviso ahora solo vigila la autoridad receptora -- un vistazo
        // rápido, no una validación exhaustiva del Bloque 5.
        setFaltaBloque5(!a || !a.autoridadReceptora?.trim());
        setCargando(false);
      })
      .catch(() => setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardar = useCallback(
    async (valor: ActuacionesProcedimiento) => {
      // Adenda 2026-08-03: el relato comparte el registro con las
      // Actuaciones (Bloque 5), pero ya no se bloquea el guardado si ese
      // bloque aún no está completo — el backend admite borrador
      // parcial. El aviso de abajo queda solo como sugerencia de orden
      // de trabajo, no como impedimento.
      setFaltaBloque5(!valor.autoridadReceptora?.trim());
      try {
        await api.put(`/procedimientos/${id}/actuaciones-procedimiento`, valor);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar el relato.");
        throw err;
      }
    },
    [id],
  );
  const { estado: estadoGuardado } = useAutoguardado(datos, guardar, { activo: !cargando });

  const set = (cambios: Partial<ActuacionesProcedimiento>) => setDatos({ ...datos, ...cambios });

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">6. Relato de los hechos</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Esta información alimenta directamente la narración automática del FPJ-5.
          </p>
        </div>
        <IndicadorGuardado estado={estadoGuardado} />
      </div>

      {faltaBloque5 && (
        <p className="rounded-md bg-institucional-100 px-3 py-2.5 font-sans text-xs text-institucional-800">
          Recomendamos completar primero el Bloque 5 (Actuaciones Procedimentales) — este relato se
          guarda junto con esa información, aunque puedes diligenciarlo ya mismo si prefieres.
        </p>
      )}

      {error && (
        <p role="alert" className="font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <div className="space-y-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
        <Campo etiqueta="¿Qué observó el personal policial que motivó la intervención?">
          <textarea
            rows={3}
            className={claseInput}
            value={datos.observacionInicial ?? ""}
            onChange={(e) => set({ observacionInicial: e.target.value })}
          />
        </Campo>

        <Campo etiqueta="Describa brevemente cómo se desarrolló la intervención">
          <textarea
            rows={3}
            className={claseInput}
            value={datos.desarrolloIntervencion ?? ""}
            onChange={(e) => set({ desarrolloIntervencion: e.target.value })}
          />
        </Campo>

        <div>
          <Campo etiqueta="¿Existió alguna circunstancia relevante durante el procedimiento?">
            <SiNo
              valor={Boolean(datos.tieneCircunstanciaRelevante)}
              onChange={(v) => set({ tieneCircunstanciaRelevante: v })}
            />
          </Campo>
          {datos.tieneCircunstanciaRelevante && (
            <div className="mt-2">
              <Campo etiqueta="Describa la circunstancia relevante" requerido>
                <textarea
                  rows={2}
                  className={claseInput}
                  value={datos.circunstanciaRelevante ?? ""}
                  onChange={(e) => set({ circunstanciaRelevante: e.target.value })}
                />
              </Campo>
            </div>
          )}
        </div>

        <div>
          <Campo etiqueta="¿Existe alguna observación adicional que deba quedar consignada en el informe?">
            <SiNo
              valor={Boolean(datos.tieneObservacionAdicional)}
              onChange={(v) => set({ tieneObservacionAdicional: v })}
            />
          </Campo>
          {datos.tieneObservacionAdicional && (
            <div className="mt-2">
              <Campo etiqueta="Observación adicional" requerido>
                <textarea
                  rows={2}
                  className={claseInput}
                  value={datos.observacionAdicional ?? ""}
                  onChange={(e) => set({ observacionAdicional: e.target.value })}
                />
              </Campo>
            </div>
          )}
        </div>
      </div>

      <p className="font-sans text-xs text-institucional-700">
        La participación y el comportamiento de cada capturado o aprehendido durante el abordaje se registran
        de forma individual en el Bloque 2 (Capturados/Aprehendidos).
      </p>
    </div>
  );
}
