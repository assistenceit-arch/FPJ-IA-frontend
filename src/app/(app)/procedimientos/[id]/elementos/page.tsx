"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { DELITO_ARMAS, DELITO_ESTUPEFACIENTES, DELITO_HURTO } from "@/lib/delitos";

interface VictimaResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
}

interface CapturadoResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
}

interface Elemento {
  id: string;
  tipoElemento: "SUSTANCIA" | "DINERO" | "CELULAR" | "ARMA" | "OTRO";
  descripcionBase: string;
  ubicacionHallazgo: string | null;
  direccionIncautacion: string;
}

const claseInput =
  "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

// Adenda 2026-08-14: valor especial para el selector de "Interviniente"
// del formulario -- cuando se elige, el elemento se guarda sin
// capturadoId (ver ElementosColectivosController en el backend).
const SIN_INDIVIDUALIZAR = "__SIN_INDIVIDUALIZAR__";

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
  // Adenda 2026-08-14: elementos "sin individualizar" -- hallados en un
  // lugar común (ej. interior de un vehículo con varios ocupantes) sin
  // poder atribuirse a una persona específica, pero que dieron lugar a
  // la captura de todos los intervinientes del procedimiento.
  const [elementosColectivos, setElementosColectivos] = useState<Elemento[]>([]);
  const [victimas, setVictimas] = useState<VictimaResumen[]>([]);
  const [delito, setDelito] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  async function cargarTodo() {
    const [personas, procedimiento, colectivos, victimasDelProcedimiento] = await Promise.all([
      api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`),
      api.get<{ delito: string }>(`/procedimientos/${id}`),
      api.get<Elemento[]>(`/procedimientos/${id}/elementos-colectivos`),
      // Adenda 2026-08-21 (módulo Hurto): víctimas, para poder vincular
      // cada elemento hurtado a la víctima correspondiente.
      api.get<VictimaResumen[]>(`/procedimientos/${id}/victimas`).catch(() => []),
    ]);
    setIntervinientes(personas);
    setDelito(procedimiento.delito);
    setElementosColectivos(colectivos);
    setVictimas(victimasDelProcedimiento);
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

  async function eliminarElementoColectivo(elementoId: string) {
    if (!confirm("¿Eliminar este elemento colectivo?")) return;
    try {
      await api.delete(`/procedimientos/${id}/elementos-colectivos/${elementoId}`);
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
            Cada elemento se asocia a un capturado/aprehendido específico, o queda "sin individualizar"
            cuando no es posible atribuirlo a uno en particular (ej. hallado en un lugar común).
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
            Primero registra al menos un capturado/aprehendido
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
          delito={delito}
          victimas={victimas}
          onCancelar={() => setMostrarFormulario(false)}
          onCreado={async () => {
            setMostrarFormulario(false);
            await cargarTodo();
          }}
        />
      )}

      <div className="mt-6 space-y-6">
        {elementosColectivos.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-institucional-950">
              Sin individualizar{" "}
              <span className="ml-1 rounded-full bg-acento/15 px-2 py-0.5 align-middle font-sans text-xs font-semibold text-acento">
                colectivo
              </span>
            </h2>
            <p className="mt-1 font-sans text-xs text-institucional-700">
              Hallados en un lugar común (ej. interior de un vehículo), sin poder atribuirse a uno
              de los capturados/aprehendidos en particular.
            </p>
            <ul className="mt-2 divide-y divide-institucional-100 rounded-lg border border-institucional-100 bg-white shadow-sm">
              {elementosColectivos.map((el) => (
                <li key={el.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
                      {el.tipoElemento}
                    </p>
                    <p className="mt-0.5 font-sans text-sm text-institucional-950">{el.descripcionBase}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarElementoColectivo(el.id)}
                    className="shrink-0 font-sans text-xs text-estado-error hover:underline"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
  delito,
  victimas,
  onCancelar,
  onCreado,
}: {
  procedimientoId: string;
  intervinientes: CapturadoResumen[];
  delito: string;
  victimas: VictimaResumen[];
  onCancelar: () => void;
  onCreado: () => void;
}) {
  const esArmas = delito === DELITO_ARMAS;
  // Adenda 2026-08-21 (módulo Hurto): campos exclusivos de este delito.
  const esHurto = delito === DELITO_HURTO;
  const [victimaId, setVictimaId] = useState("");
  const [recuperado, setRecuperado] = useState<"" | "SI" | "NO">("");
  const [recuperadoPor, setRecuperadoPor] = useState("");
  const [capturadoId, setCapturadoId] = useState(intervinientes[0]?.id ?? "");
  const [tipoElemento, setTipoElemento] = useState<"SUSTANCIA" | "DINERO" | "CELULAR" | "ARMA" | "OTRO">(
    esArmas ? "ARMA" : "SUSTANCIA",
  );
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
  // Adenda 2026-08-12: módulo de Porte Ilegal de Armas de Fuego.
  const [tipoArma, setTipoArma] = useState<"PISTOLA" | "REVOLVER" | "ESCOPETA" | "FUSIL" | "HECHIZA">("PISTOLA");
  const [modelo, setModelo] = useState("");
  const [calibre, setCalibre] = useState("");
  const [cachaMaterial, setCachaMaterial] = useState("");
  const [cachaColor, setCachaColor] = useState("");
  const [serial, setSerial] = useState("");
  const [estadoSerial, setEstadoSerial] = useState<
    "LEGIBLE" | "NO_PRESENTA" | "BORRADO" | "ALTERADO" | "NO_LEGIBLE" | ""
  >("");
  const [estadoArma, setEstadoArma] = useState<"BUEN_ESTADO" | "REGULAR_ESTADO" | "MAL_ESTADO">("BUEN_ESTADO");
  const [cantidadMuniciones, setCantidadMuniciones] = useState("");
  const [calibreMunicion, setCalibreMunicion] = useState("");
  const [cantidadCargadores, setCantidadCargadores] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    if (tipoElemento === "ARMA" && estadoSerial === "") {
      setError("Indica el estado del serial del arma — esta verificación es obligatoria.");
      return;
    }
    if (esHurto && recuperado === "SI" && !recuperadoPor.trim()) {
      setError("Indica por quién fue recuperado el bien (Policía, víctima o comunidad).");
      return;
    }
    setCargando(true);
    try {
      const cuerpo: Record<string, unknown> = {
        tipoElemento,
        ubicacionHallazgo: ubicacionHallazgo || undefined,
        direccionIncautacion,
      };
      if (esHurto) {
        Object.assign(cuerpo, {
          victimaId: victimaId || undefined,
          recuperado: recuperado === "" ? undefined : recuperado === "SI",
          recuperadoPor: recuperado === "SI" ? recuperadoPor.trim() : undefined,
        });
      }
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
      } else if (tipoElemento === "ARMA") {
        Object.assign(cuerpo, {
          tipoArma,
          marca: marca || undefined,
          modelo: modelo || undefined,
          calibre: calibre || undefined,
          color: color || undefined,
          cachaMaterial: cachaMaterial || undefined,
          cachaColor: cachaColor || undefined,
          serial: estadoSerial === "LEGIBLE" ? serial || undefined : undefined,
          estadoSerial,
          estadoArma,
          cantidadMuniciones: cantidadMuniciones ? Number(cantidadMuniciones) : undefined,
          calibreMunicion: calibreMunicion || undefined,
          cantidadCargadores: cantidadCargadores ? Number(cantidadCargadores) : undefined,
        });
      } else {
        Object.assign(cuerpo, { descripcionManual });
      }

      const ruta =
        capturadoId === SIN_INDIVIDUALIZAR
          ? `/procedimientos/${procedimientoId}/elementos-colectivos`
          : `/procedimientos/${procedimientoId}/capturados/${capturadoId}/elementos`;
      await api.post(ruta, cuerpo);
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
        <Campo etiqueta="Capturado/Aprehendido" requerido>
          <select className={claseInput} value={capturadoId} onChange={(e) => setCapturadoId(e.target.value)}>
            {intervinientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.primerNombre} {p.primerApellido}
              </option>
            ))}
            <option value={SIN_INDIVIDUALIZAR}>— Sin individualizar (colectivo) —</option>
          </select>
        </Campo>
        <Campo etiqueta="Tipo de elemento" requerido>
          <select
            className={claseInput}
            value={tipoElemento}
            onChange={(e) => setTipoElemento(e.target.value as typeof tipoElemento)}
          >
            {delito === DELITO_ESTUPEFACIENTES && <option value="SUSTANCIA">Sustancia</option>}
            {esArmas && <option value="ARMA">Arma de fuego</option>}
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

      {tipoElemento === "ARMA" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Tipo de arma" requerido>
            <select
              className={claseInput}
              value={tipoArma}
              onChange={(e) => setTipoArma(e.target.value as typeof tipoArma)}
            >
              <option value="PISTOLA">Pistola</option>
              <option value="REVOLVER">Revólver</option>
              <option value="ESCOPETA">Escopeta</option>
              <option value="FUSIL">Fusil</option>
              <option value="HECHIZA">Hechiza o artesanal</option>
            </select>
          </Campo>
          <Campo etiqueta="Estado del arma" requerido>
            <select
              className={claseInput}
              value={estadoArma}
              onChange={(e) => setEstadoArma(e.target.value as typeof estadoArma)}
            >
              <option value="BUEN_ESTADO">En buen estado</option>
              <option value="REGULAR_ESTADO">En regular estado</option>
              <option value="MAL_ESTADO">En mal estado</option>
            </select>
          </Campo>
          <Campo etiqueta="Marca">
            <input
              className={claseInput}
              placeholder="No suele aplicar a armas hechizas"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Modelo">
            <input className={claseInput} value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </Campo>
          <Campo etiqueta="Calibre">
            <input className={claseInput} value={calibre} onChange={(e) => setCalibre(e.target.value)} />
          </Campo>
          <Campo etiqueta="Color">
            <input className={claseInput} value={color} onChange={(e) => setColor(e.target.value)} />
          </Campo>
          <Campo etiqueta="Material de la cacha o empuñadura">
            <input
              className={claseInput}
              placeholder="Ej. madera, plástica…"
              value={cachaMaterial}
              onChange={(e) => setCachaMaterial(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Color de la cacha o empuñadura">
            <input className={claseInput} value={cachaColor} onChange={(e) => setCachaColor(e.target.value)} />
          </Campo>
          <Campo etiqueta="Estado del serial" requerido>
            <select
              className={claseInput}
              value={estadoSerial}
              onChange={(e) => setEstadoSerial(e.target.value as typeof estadoSerial)}
            >
              <option value="" disabled>
                Selecciona una opción…
              </option>
              <option value="LEGIBLE">Legible</option>
              <option value="NO_PRESENTA">No presenta</option>
              <option value="BORRADO">Borrado</option>
              <option value="ALTERADO">Alterado</option>
              <option value="NO_LEGIBLE">No legible</option>
            </select>
          </Campo>
          {estadoSerial === "LEGIBLE" && (
            <Campo etiqueta="Número de serial" requerido>
              <input className={claseInput} value={serial} onChange={(e) => setSerial(e.target.value)} />
            </Campo>
          )}
          <Campo etiqueta="Cantidad de municiones halladas">
            <input
              type="number"
              min={0}
              className={claseInput}
              value={cantidadMuniciones}
              onChange={(e) => setCantidadMuniciones(e.target.value)}
            />
          </Campo>
          {Number(cantidadMuniciones) > 0 && (
            <Campo etiqueta="Calibre de la munición">
              <input
                className={claseInput}
                placeholder="No asumas que es el mismo del arma — pregúntalo"
                value={calibreMunicion}
                onChange={(e) => setCalibreMunicion(e.target.value)}
              />
            </Campo>
          )}
          <Campo etiqueta="Cantidad de cargadores/proveedores hallados">
            <input
              type="number"
              min={0}
              className={claseInput}
              placeholder="Ej. no aplica a revólveres"
              value={cantidadCargadores}
              onChange={(e) => setCantidadCargadores(e.target.value)}
            />
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

      {esHurto && (
        <div className="rounded-md border border-institucional-100 bg-institucional-50 p-4">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
            Datos propios de Hurto
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Víctima a la que se le hurtó (si aplica)">
              <select className={claseInput} value={victimaId} onChange={(e) => setVictimaId(e.target.value)}>
                <option value="">Sin víctima identificada / no aplica</option>
                {victimas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.primerNombre} {v.primerApellido}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="¿Fue recuperado?">
              <select
                className={claseInput}
                value={recuperado}
                onChange={(e) => setRecuperado(e.target.value as typeof recuperado)}
              >
                <option value="">Sin determinar</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </Campo>
            {recuperado === "SI" && (
              <Campo etiqueta="¿Por quién?" requerido>
                <input
                  required
                  className={claseInput}
                  placeholder="Ej. Policía, la propia víctima, con ayuda de la comunidad"
                  value={recuperadoPor}
                  onChange={(e) => setRecuperadoPor(e.target.value)}
                />
              </Campo>
            )}
          </div>
        </div>
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
