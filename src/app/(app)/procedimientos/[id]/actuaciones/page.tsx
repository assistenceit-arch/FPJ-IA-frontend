"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import { CampoHora } from "@/components/CampoHora";
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

function SiNo({ valor, onChange }: { valor: boolean | null; onChange: (v: boolean) => void }) {
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

function FilaEsposas({
  procedimientoId,
  persona,
}: {
  procedimientoId: string;
  persona: {
    id: string;
    primerNombre: string;
    primerApellido: string;
    tipoInterviniente: string;
    usoEsposas: boolean | null;
    justificacionEsposas: string | null;
    tiempoEsposado: string | null;
    motivoRetiroEsposas: string | null;
    presentaLesiones: boolean | null;
    descripcionLesiones: string | null;
    parteCuerpoLesion: string | null;
    motivoLesion: string | null;
    trasladoCentroAsistencial: boolean | null;
    centroAsistencial: string | null;
    motivoTraslado: string | null;
  };
}) {
  // Adenda 2026-08-06: antes iniciaba en `false` por defecto, lo que
  // mostraba el botón "No" ya seleccionado sin que el funcionario
  // hubiera respondido de verdad. Si nunca hacía clic (porque ya se veía
  // "contestado"), nada se guardaba y el Bloque 5 se quedaba en amarillo
  // para siempre. Ahora inicia genuinamente sin responder (null) hasta
  // que el funcionario elige Sí o No de forma explícita.
  const [usoEsposas, setUsoEsposas] = useState<boolean | null>(persona.usoEsposas);
  const [justificacionEsposas, setJustificacionEsposas] = useState(persona.justificacionEsposas ?? "");
  // Adenda 2026-08-11: tiempo y motivo de retiro, junto con la
  // justificación de por qué se colocaron.
  const [tiempoEsposado, setTiempoEsposado] = useState(persona.tiempoEsposado ?? "");
  const [motivoRetiroEsposas, setMotivoRetiroEsposas] = useState(persona.motivoRetiroEsposas ?? "");

  // Adenda 2026-08-11: lesiones pasa de una sola respuesta por
  // procedimiento a individual por interviniente (aplica a Capturados Y
  // Aprehendidos, a diferencia de esposas que solo aplica a
  // Aprehendidos), con los mismos cuidados de "sin responder" que
  // esposas.
  const [presentaLesiones, setPresentaLesiones] = useState<boolean | null>(persona.presentaLesiones);
  const [descripcionLesiones, setDescripcionLesiones] = useState(persona.descripcionLesiones ?? "");
  const [parteCuerpoLesion, setParteCuerpoLesion] = useState(persona.parteCuerpoLesion ?? "");
  const [motivoLesion, setMotivoLesion] = useState(persona.motivoLesion ?? "");
  const [trasladoCentroAsistencial, setTrasladoCentroAsistencial] = useState<boolean | null>(
    persona.trasladoCentroAsistencial,
  );
  const [centroAsistencial, setCentroAsistencial] = useState(persona.centroAsistencial ?? "");
  const [motivoTraslado, setMotivoTraslado] = useState(persona.motivoTraslado ?? "");

  const esAprehendido = persona.tipoInterviniente === "APREHENDIDO";

  const guardar = useCallback(
    async (valor: {
      usoEsposas: boolean | null;
      justificacionEsposas: string;
      tiempoEsposado: string;
      motivoRetiroEsposas: string;
      presentaLesiones: boolean | null;
      descripcionLesiones: string;
      parteCuerpoLesion: string;
      motivoLesion: string;
      trasladoCentroAsistencial: boolean | null;
      centroAsistencial: string;
      motivoTraslado: string;
    }) => {
      // Nada que guardar todavía si ninguna de las dos preguntas
      // "sin responder" (esposas/lesiones) se ha contestado — evita un
      // PATCH vacío/prematuro apenas se monta la fila.
      if (valor.usoEsposas === null && valor.presentaLesiones === null) return;
      await api.patch(`/procedimientos/${procedimientoId}/capturados/${persona.id}`, valor);
    },
    [procedimientoId, persona.id],
  );
  const { estado } = useAutoguardado(
    {
      usoEsposas,
      justificacionEsposas,
      tiempoEsposado,
      motivoRetiroEsposas,
      presentaLesiones,
      descripcionLesiones,
      parteCuerpoLesion,
      motivoLesion,
      trasladoCentroAsistencial,
      centroAsistencial,
      motivoTraslado,
    },
    guardar,
  );

  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm font-medium text-institucional-950">
          {persona.primerNombre} {persona.primerApellido}
        </p>
        <IndicadorGuardado estado={estado} />
      </div>

      {esAprehendido && (
        <div className="mt-3 space-y-3 border-b border-institucional-100 pb-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
            Uso de esposas
          </p>
          <Campo etiqueta="¿Se le colocaron esposas?" requerido>
            <SiNo valor={usoEsposas} onChange={setUsoEsposas} />
          </Campo>
          {usoEsposas && (
            <>
              <Campo etiqueta="Justificación (por qué se colocaron)" requerido>
                <textarea
                  rows={2}
                  className={claseInput}
                  value={justificacionEsposas}
                  onChange={(e) => setJustificacionEsposas(e.target.value)}
                />
              </Campo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Tiempo aproximado esposado" requerido>
                  <input
                    className={claseInput}
                    placeholder="Ej. 8 minutos"
                    value={tiempoEsposado}
                    onChange={(e) => setTiempoEsposado(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Motivo del retiro" requerido>
                  <input
                    className={claseInput}
                    placeholder="Ej. se restableció la condición de seguridad"
                    value={motivoRetiroEsposas}
                    onChange={(e) => setMotivoRetiroEsposas(e.target.value)}
                  />
                </Campo>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-3 space-y-3">
        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
          Estado físico
        </p>
        <Campo etiqueta="¿Presenta lesiones?" requerido>
          <SiNo valor={presentaLesiones} onChange={setPresentaLesiones} />
        </Campo>
        {presentaLesiones && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Descripción de las lesiones" requerido>
                <textarea
                  rows={2}
                  className={claseInput}
                  value={descripcionLesiones}
                  onChange={(e) => setDescripcionLesiones(e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Parte del cuerpo" requerido>
                <input
                  className={claseInput}
                  value={parteCuerpoLesion}
                  onChange={(e) => setParteCuerpoLesion(e.target.value)}
                />
              </Campo>
            </div>
            <Campo etiqueta="Motivo de la lesión" requerido>
              <input
                className={claseInput}
                placeholder="Ej. caída durante el intento de fuga"
                value={motivoLesion}
                onChange={(e) => setMotivoLesion(e.target.value)}
              />
            </Campo>
            <Campo etiqueta="¿Fue trasladado a centro asistencial?" requerido>
              <SiNo valor={trasladoCentroAsistencial} onChange={setTrasladoCentroAsistencial} />
            </Campo>
            {trasladoCentroAsistencial && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre del centro asistencial" requerido>
                  <input
                    className={claseInput}
                    value={centroAsistencial}
                    onChange={(e) => setCentroAsistencial(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Motivo del traslado" requerido>
                  <input
                    className={claseInput}
                    value={motivoTraslado}
                    onChange={(e) => setMotivoTraslado(e.target.value)}
                  />
                </Campo>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface IntervinienteResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
  tipoInterviniente: string;
  usoEsposas: boolean | null;
  justificacionEsposas: string | null;
  tiempoEsposado: string | null;
  motivoRetiroEsposas: string | null;
  presentaLesiones: boolean | null;
  descripcionLesiones: string | null;
  parteCuerpoLesion: string | null;
  motivoLesion: string | null;
  trasladoCentroAsistencial: boolean | null;
  centroAsistencial: string | null;
  motivoTraslado: string | null;
}

export default function BloqueActuaciones() {
  const { id } = useParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<ActuacionesProcedimiento>(ACTUACIONES_VACIAS);
  const [procedimiento, setProcedimiento] = useState<Procedimiento | null>(null);
  const [intervinientes, setIntervinientes] = useState<IntervinienteResumen[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      api.get<ActuacionesProcedimiento | null>(`/procedimientos/${id}/actuaciones-procedimiento`).catch(() => null),
      api.get<Procedimiento>(`/procedimientos/${id}`),
      api.get<IntervinienteResumen[]>(`/procedimientos/${id}/capturados`).catch(() => []),
    ]).then(([a, p, capturados]) => {
      if (cancelado) return;
      if (a) setDatos({ ...ACTUACIONES_VACIAS, ...soloClaves(a, CLAVES_ACTUACIONES) });
      setProcedimiento(p);
      setIntervinientes(capturados);
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardar = useCallback(
    async (valor: ActuacionesProcedimiento) => {
      // Adenda 2026-08-03: ya no se bloquea el guardado hasta que
      // fechaDerechos/horaDerechos/autoridadReceptora estén completos —
      // el backend ahora admite borrador parcial. Antes, mientras
      // faltara alguno, NADA de este bloque se guardaba (incluido el
      // relato del Bloque 6, que comparte este mismo registro), y el
      // trabajo se perdía al salir o recargar la página.
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
      if (!p) return;
      // Adenda 2026-08-03: se guarda cada campo por separado (fecha u
      // hora), ya no se exige que ambos estén presentes a la vez.
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

  // Adenda 2026-08-20: en procedimientos mixtos, la autoridad receptora
  // se pide individualizada por grupo (mayores/menores).
  const esMixto =
    intervinientes.some((p) => p.tipoInterviniente === "CAPTURADO") &&
    intervinientes.some((p) => p.tipoInterviniente === "APREHENDIDO");

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
                  onChange={(e) => set({ fechaDerechos: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })}
                />
              </Campo>
              <Campo etiqueta="Hora de lectura de derechos" requerido>
                <CampoHora value={datos.horaDerechos} onChange={(v) => set({ horaDerechos: v })} />
              </Campo>
            </div>
            <Campo etiqueta="¿Comprendió los derechos informados?" requerido>
              <SiNo valor={datos.comprendeDerechos} onChange={(v) => set({ comprendeDerechos: v })} />
            </Campo>
          </>
        )}
      </Seccion>

      <div>
        <h2 className="font-display text-lg text-institucional-950">Esposas y estado físico</h2>
        <p className="mt-1 font-sans text-sm text-institucional-700">
          Preguntas individuales por interviniente — en procedimientos con varias personas, cada
          una se responde por separado. El uso de esposas solo aplica a Aprehendidos (menores de
          edad); las lesiones aplican a cualquier interviniente.
        </p>
        <div className="mt-3 space-y-3">
          {intervinientes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-institucional-100 bg-white px-4 py-6 text-center font-sans text-sm text-institucional-700">
              No hay intervinientes registrados en este procedimiento todavía.
            </p>
          ) : (
            intervinientes.map((persona) => (
              <FilaEsposas key={persona.id} procedimientoId={id} persona={persona} />
            ))
          )}
        </div>
      </div>

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
                  procedimiento && {
                    ...procedimiento,
                    fechaDisposicion: e.target.value ? `${e.target.value}T00:00:00.000Z` : null,
                  },
                )
              }
            />
          </Campo>
          <Campo etiqueta="Hora" requerido>
            <CampoHora
              value={procedimiento?.horaDisposicion ?? ""}
              onChange={(v) => setProcedimiento(procedimiento && { ...procedimiento, horaDisposicion: v })}
            />
          </Campo>
          {esMixto ? (
            <>
              <Campo etiqueta="Autoridad receptora — mayores de edad" requerido>
                <input
                  className={claseInput}
                  value={datos.autoridadReceptoraAdultos ?? ""}
                  onChange={(e) => set({ autoridadReceptoraAdultos: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Autoridad receptora — menores de edad" requerido>
                <input
                  className={claseInput}
                  value={datos.autoridadReceptoraMenores ?? ""}
                  onChange={(e) => set({ autoridadReceptoraMenores: e.target.value })}
                />
              </Campo>
            </>
          ) : (
            <Campo etiqueta="Autoridad receptora" requerido>
              <input
                className={claseInput}
                value={datos.autoridadReceptora}
                onChange={(e) => set({ autoridadReceptora: e.target.value })}
              />
            </Campo>
          )}
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
