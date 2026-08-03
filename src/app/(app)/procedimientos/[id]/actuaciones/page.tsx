"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { ActuacionesProcedimiento, Procedimiento } from "@/lib/tipos";
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

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-institucional-950">{titulo}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export default function BloqueActuaciones() {
  const { id } = useParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<ActuacionesProcedimiento>(ACTUACIONES_VACIAS);
  const [procedimiento, setProcedimiento] = useState<Procedimiento | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      api.get<ActuacionesProcedimiento | null>(`/procedimientos/${id}/actuaciones-procedimiento`).catch(() => null),
      api.get<Procedimiento>(`/procedimientos/${id}`),
    ]).then(([a, p]) => {
      if (cancelado) return;
      if (a) setDatos({ ...ACTUACIONES_VACIAS, ...soloClaves(a, CLAVES_ACTUACIONES) });
      setProcedimiento(p);
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardar = useCallback(
    async (valor: ActuacionesProcedimiento) => {
      if (!valor.fechaDerechos || !valor.horaDerechos || !valor.autoridadReceptora?.trim()) return;
      try {
        await api.put(`/procedimientos/${id}/actuaciones-procedimiento`, valor);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar las actuaciones.");
        throw err;
      }
    },
    [id],
  );
  const { estado: estadoGuardado } = useAutoguardado(datos, guardar, { activo: !cargando });

  const guardarDisposicion = useCallback(
    async (p: Procedimiento | null) => {
      if (!p || !p.fechaDisposicion || !p.horaDisposicion) return;
      await api.patch(`/procedimientos/${id}`, {
        fechaDisposicion: p.fechaDisposicion,
        horaDisposicion: p.horaDisposicion,
      });
    },
    [id],
  );
  const { estado: estadoDisposicion } = useAutoguardado(procedimiento, guardarDisposicion, { activo: !cargando });

  const set = (cambios: Partial<ActuacionesProcedimiento>) => setDatos({ ...datos, ...cambios });

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">5. Actuaciones procedimentales</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Todo lo ocurrido desde la captura/aprehensión hasta la puesta a disposición.
          </p>
        </div>
        <IndicadorGuardado estado={estadoGuardado} />
      </div>

      {error && (
        <p role="alert" className="font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <Seccion titulo="Captura o aprehensión (solo lectura)">
        <p className="font-sans text-sm text-institucional-700">
          {new Date(procedimiento!.fechaCaptura).toLocaleDateString("es-CO")} · {procedimiento!.horaCaptura}
        </p>
      </Seccion>

      <Seccion titulo="Lectura de derechos">
        <Campo etiqueta="¿Se le leyeron los derechos?" requerido>
          <SiNo valor={datos.derechosLeidos} onChange={(v) => set({ derechosLeidos: v })} />
        </Campo>
        {datos.derechosLeidos && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de lectura de derechos" requerido>
                <input
                  type="date"
                  className={claseInput}
                  value={datos.fechaDerechos?.slice(0, 10) ?? ""}
                  onChange={(e) => set({ fechaDerechos: `${e.target.value}T00:00:00.000Z` })}
                />
              </Campo>
              <Campo etiqueta="Hora de lectura de derechos" requerido>
                <input
                  type="time"
                  className={claseInput}
                  value={datos.horaDerechos}
                  onChange={(e) => set({ horaDerechos: e.target.value })}
                />
              </Campo>
            </div>
            <Campo etiqueta="¿Comprendió los derechos informados?" requerido>
              <SiNo valor={datos.comprendeDerechos} onChange={(v) => set({ comprendeDerechos: v })} />
            </Campo>
          </>
        )}
      </Seccion>

      <Seccion titulo="Uso de esposas">
        <Campo etiqueta="¿Se utilizaron esposas?" requerido>
          <SiNo valor={datos.usoEsposas} onChange={(v) => set({ usoEsposas: v })} />
        </Campo>
        {datos.usoEsposas && (
          <Campo etiqueta="Justificación del uso de esposas" requerido>
            <textarea
              rows={2}
              className={claseInput}
              value={datos.justificacionEsposas ?? ""}
              onChange={(e) => set({ justificacionEsposas: e.target.value })}
            />
          </Campo>
        )}
      </Seccion>

      <Seccion titulo="Estado físico">
        <Campo etiqueta="¿Presenta lesiones?" requerido>
          <SiNo valor={datos.presentaLesiones} onChange={(v) => set({ presentaLesiones: v })} />
        </Campo>
        {datos.presentaLesiones && (
          <Campo etiqueta="Descripción de las lesiones" requerido>
            <textarea
              rows={2}
              className={claseInput}
              value={datos.descripcionLesiones ?? ""}
              onChange={(e) => set({ descripcionLesiones: e.target.value })}
            />
          </Campo>
        )}
      </Seccion>

      <Seccion titulo="Centro asistencial">
        <Campo etiqueta="¿Fue trasladado a centro asistencial?" requerido>
          <SiNo valor={datos.trasladoCentroAsistencial} onChange={(v) => set({ trasladoCentroAsistencial: v })} />
        </Campo>
        {datos.trasladoCentroAsistencial && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre del centro asistencial" requerido>
              <input
                className={claseInput}
                value={datos.centroAsistencial ?? ""}
                onChange={(e) => set({ centroAsistencial: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Motivo del traslado" requerido>
              <input
                className={claseInput}
                value={datos.motivoTraslado ?? ""}
                onChange={(e) => set({ motivoTraslado: e.target.value })}
              />
            </Campo>
          </div>
        )}
      </Seccion>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-institucional-950">Puesta a disposición</h2>
          <IndicadorGuardado estado={estadoDisposicion} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm sm:grid-cols-3">
          <Campo etiqueta="Fecha" requerido>
            <input
              type="date"
              className={claseInput}
              value={procedimiento?.fechaDisposicion?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setProcedimiento(
                  procedimiento && { ...procedimiento, fechaDisposicion: `${e.target.value}T00:00:00.000Z` },
                )
              }
            />
          </Campo>
          <Campo etiqueta="Hora" requerido>
            <input
              type="time"
              className={claseInput}
              value={procedimiento?.horaDisposicion ?? ""}
              onChange={(e) => setProcedimiento(procedimiento && { ...procedimiento, horaDisposicion: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Autoridad receptora" requerido>
            <input
              className={claseInput}
              value={datos.autoridadReceptora}
              onChange={(e) => set({ autoridadReceptora: e.target.value })}
            />
          </Campo>
        </div>
        <p className="mt-2 font-sans text-xs text-institucional-700">
          El sistema calculará automáticamente si hubo demora entre la captura y la puesta a
          disposición. Si la hay, deja la justificación abajo.
        </p>
        <div className="mt-3 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
          <Campo etiqueta="Justificación de la demora (si aplica)">
            <textarea
              rows={2}
              className={claseInput}
              value={datos.justificacionDemora ?? ""}
              onChange={(e) => set({ justificacionDemora: e.target.value })}
            />
          </Campo>
        </div>
      </div>
    </div>
  );
}
