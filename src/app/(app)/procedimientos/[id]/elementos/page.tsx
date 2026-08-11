"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface CapturadoResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
}

interface Elemento {
  id: string;
  tipoElemento: "SUSTANCIA" | "DINERO" | "CELULAR" | "OTRO";
  descripcionBase: string;
  ubicacionHallazgo: string | null;
  direccionIncautacion: string;
}

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

export default function BloqueElementos() {
  const { id } = useParams<{ id: string }>();
  const [intervinientes, setIntervinientes] = useState<CapturadoResumen[]>([]);
  const [elementosPorPersona, setElementosPorPersona] = useState<Record<string, Elemento[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  async function cargarTodo() {
    const personas = await api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`);
    setIntervinientes(personas);
    const listas = await Promise.all(
      personas.map((p) => api.get<Elemento[]>(`/procedimientos/${id}/capturados/${p.id}/elementos`)),
    );
    const mapa: Record<string, Elemento[]> = {};
    personas.forEach((p, i) => (mapa[p.id] = listas[i]));
    setElementosPorPersona(mapa);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo().catch((err) =>
      setError(err instanceof ApiError ? err.message : "No fue posible cargar los elementos."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function eliminarElemento(capturadoId: string, elementoId: string) {
    if (!confirm("¿Eliminar este elemento?")) return;
    try {
      await api.delete(`/procedimientos/${id}/capturados/${capturadoId}/elementos/${elementoId}`);
      await cargarTodo();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible eliminar el elemento.");
    }
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">4. Elementos incautados</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Cada elemento debe asociarse a un interviniente específico.
          </p>
        </div>
        {intervinientes.length > 0 && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
          >
            + Agregar elemento
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      {intervinientes.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-institucional-100 bg-white px-6 py-14 text-center">
          <p className="font-display text-lg text-institucional-950">
            Primero registra al menos un interviniente
          </p>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Los elementos incautados se asocian siempre a una persona (Bloque 2).
          </p>
        </div>
      )}

      {mostrarFormulario && (
        <FormularioNuevoElemento
          procedimientoId={id}
          intervinientes={intervinientes}
          onCancelar={() => setMostrarFormulario(false)}
          onCreado={async () => {
            setMostrarFormulario(false);
            await cargarTodo();
          }}
        />
      )}

      <div className="mt-6 space-y-6">
        {intervinientes.map((persona) => {
          const elementos = elementosPorPersona[persona.id] ?? [];
          return (
            <div key={persona.id}>
              <h2 className="font-display text-lg text-institucional-950">
                {persona.primerNombre} {persona.primerApellido}
              </h2>
              {elementos.length === 0 ? (
                <p className="mt-1 font-sans text-sm text-institucional-700">Sin elementos registrados.</p>
              ) : (
                <ul className="mt-2 divide-y divide-institucional-100 rounded-lg border border-institucional-100 bg-white shadow-sm">
                  {elementos.map((el) => (
                    <li key={el.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div>
                        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
                          {el.tipoElemento}
                        </p>
                        <p className="mt-0.5 font-sans text-sm text-institucional-950">{el.descripcionBase}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarElemento(persona.id, el.id)}
                        className="shrink-0 font-sans text-xs text-estado-error hover:underline"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormularioNuevoElemento({
  procedimientoId,
  intervinientes,
  onCancelar,
  onCreado,
}: {
  procedimientoId: string;
  intervinientes: CapturadoResumen[];
  onCancelar: () => void;
  onCreado: () => void;
}) {
  const [capturadoId, setCapturadoId] = useState(intervinientes[0]?.id ?? "");
  const [tipoElemento, setTipoElemento] = useState<"SUSTANCIA" | "DINERO" | "CELULAR" | "OTRO">("SUSTANCIA");
  const [ubicacionHallazgo, setUbicacionHallazgo] = useState("");
  const [direccionIncautacion, setDireccionIncautacion] = useState("");
  const [cantidadEmpaques, setCantidadEmpaques] = useState("");
  const [tipoEmpaque, setTipoEmpaque] = useState("");
  const [tipoSustancia, setTipoSustancia] = useState("");
  const [color, setColor] = useState("");
  const [caracteristicas, setCaracteristicas] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [denominaciones, setDenominaciones] = useState("");
  const [marca, setMarca] = useState("");
  const [imei, setImei] = useState("");
  const [descripcionManual, setDescripcionManual] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const cuerpo: Record<string, unknown> = {
        tipoElemento,
        ubicacionHallazgo: ubicacionHallazgo || undefined,
        direccionIncautacion,
      };
      if (tipoElemento === "SUSTANCIA") {
        Object.assign(cuerpo, {
          cantidadEmpaques: Number(cantidadEmpaques),
          tipoEmpaque,
          tipoSustancia,
          color,
          caracteristicas,
        });
      } else if (tipoElemento === "DINERO") {
        Object.assign(cuerpo, { valorTotal: Number(valorTotal), denominaciones });
      } else if (tipoElemento === "CELULAR") {
        Object.assign(cuerpo, { marca, color, imei: imei || undefined });
      } else {
        Object.assign(cuerpo, { descripcionManual });
      }

      await api.post(`/procedimientos/${procedimientoId}/capturados/${capturadoId}/elementos`, cuerpo);
      onCreado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible registrar el elemento.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="mt-6 space-y-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Interviniente" requerido>
          <select className={claseInput} value={capturadoId} onChange={(e) => setCapturadoId(e.target.value)}>
            {intervinientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.primerNombre} {p.primerApellido}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Tipo de elemento" requerido>
          <select
            className={claseInput}
            value={tipoElemento}
            onChange={(e) => setTipoElemento(e.target.value as typeof tipoElemento)}
          >
            <option value="SUSTANCIA">Sustancia</option>
            <option value="DINERO">Dinero</option>
            <option value="CELULAR">Celular</option>
            <option value="OTRO">Otro</option>
          </select>
        </Campo>
      </div>

      {tipoElemento === "SUSTANCIA" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Cantidad de empaques" requerido>
            <input
              type="number"
              min={1}
              required
              className={claseInput}
              value={cantidadEmpaques}
              onChange={(e) => setCantidadEmpaques(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Tipo de empaque" requerido>
            <input
              required
              className={claseInput}
              placeholder="Ej. bolsas plásticas, papeletas, frascos, cajas, pastillas…"
              value={tipoEmpaque}
              onChange={(e) => setTipoEmpaque(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Tipo de sustancia" requerido>
            <input
              required
              className={claseInput}
              placeholder="Ej. vegetal, pulverulenta, líquida, cristalina…"
              value={tipoSustancia}
              onChange={(e) => setTipoSustancia(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Color" requerido>
            <input required className={claseInput} value={color} onChange={(e) => setColor(e.target.value)} />
          </Campo>
          <Campo etiqueta="Características similares a" requerido>
            <input
              required
              className={claseInput}
              value={caracteristicas}
              onChange={(e) => setCaracteristicas(e.target.value)}
              placeholder="Ej. la marihuana"
            />
          </Campo>
        </div>
      )}

      {tipoElemento === "DINERO" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Valor total" requerido>
            <input
              type="number"
              min={0}
              required
              className={claseInput}
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Denominaciones" requerido>
            <input
              required
              className={claseInput}
              value={denominaciones}
              onChange={(e) => setDenominaciones(e.target.value)}
              placeholder="Ej. 2 billetes de $50.000..."
            />
          </Campo>
        </div>
      )}

      {tipoElemento === "CELULAR" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Marca" requerido>
            <input required className={claseInput} value={marca} onChange={(e) => setMarca(e.target.value)} />
          </Campo>
          <Campo etiqueta="Color" requerido>
            <input required className={claseInput} value={color} onChange={(e) => setColor(e.target.value)} />
          </Campo>
          <Campo etiqueta="IMEI (si es visible)">
            <input className={claseInput} value={imei} onChange={(e) => setImei(e.target.value)} />
          </Campo>
        </div>
      )}

      {tipoElemento === "OTRO" && (
        <Campo etiqueta="Descripción detallada del elemento" requerido>
          <textarea
            required
            rows={2}
            className={claseInput}
            value={descripcionManual}
            onChange={(e) => setDescripcionManual(e.target.value)}
          />
        </Campo>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Ubicación exacta de hallazgo">
          <input
            className={claseInput}
            value={ubicacionHallazgo}
            onChange={(e) => setUbicacionHallazgo(e.target.value)}
            placeholder="Ej. Bolsillo delantero derecho del pantalón"
          />
        </Campo>
        <Campo etiqueta="Dirección de incautación" requerido>
          <input
            required
            className={claseInput}
            value={direccionIncautacion}
            onChange={(e) => setDireccionIncautacion(e.target.value)}
          />
        </Campo>
      </div>

      {error && (
        <p role="alert" className="font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar elemento"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-md border border-institucional-100 px-4 py-2.5 font-sans text-sm text-institucional-900 transition-colors hover:bg-institucional-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
