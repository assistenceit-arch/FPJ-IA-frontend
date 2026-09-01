"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  DELITO_ARMAS,
  DELITO_ESTUPEFACIENTES,
  DELITO_HURTO,
  DELITO_RECEPTACION,
  DELITO_USO_DOCUMENTO_FALSO,
  DELITO_FALSEDAD_PERSONAL,
  DELITO_TRAFICO_MONEDA_FALSA,
} from "@/lib/delitos";

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

// Adenda 2026-09-01: detalle completo de un elemento -- se consulta
// solo al abrir la edición (la lista normal solo necesita el resumen
// de arriba). Incluye los 5 posibles detalles anidados (según el tipo,
// solo UNO de ellos viene con datos, los demás llegan null).
interface ElementoDetalle extends Elemento {
  observaciones: string | null;
  victimaId: string | null;
  recuperado: boolean | null;
  recuperadoPor: string | null;
  fuenteVerificacionHurto: string | null;
  nombreAplicativo: string | null;
  numeroReporteAplicativo: string | null;
  numeroDenuncia: string | null;
  entidadDenuncia: string | null;
  fechaDenuncia: string | null;
  denuncianteNombre: string | null;
  denuncianteDocumento: string | null;
  denuncianteTelefono: string | null;
  contextoExhibicion: string | null;
  criteriosSospecha: string | null;
  detalleSustancia: {
    cantidadEmpaques: number;
    tipoEmpaque: string;
    tipoSustancia: string;
    color: string;
    caracteristicas: string;
  } | null;
  detalleDinero: { valorTotal: number | string; denominaciones: string } | null;
  detalleCelular: { marca: string; color: string; imei: string | null } | null;
  detalleArma: {
    tipoArma: string;
    marca: string | null;
    calibre: string | null;
    color: string | null;
    cachaMaterial: string | null;
    cachaColor: string | null;
    serial: string | null;
    estadoSerial: string;
    estadoArma: string;
    cantidadMuniciones: number | null;
    calibreMunicion: string | null;
    cantidadCargadores: number | null;
  } | null;
  detalleOtro: { descripcionManual: string } | null;
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
  // Adenda 2026-09-01: bug real reportado tras prueba en vivo -- este
  // bloque se marcaba en verde automáticamente sin haber registrado
  // ningún elemento. Este campo distingue "sin contestar todavía" de
  // "el funcionario confirmó que no hay elementos" (ver comentario en
  // schema.prisma del backend).
  const [sinElementos, setSinElementos] = useState<boolean | null>(null);
  const [guardandoSinElementos, setGuardandoSinElementos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  // Adenda 2026-09-01: elemento que se está editando -- null cuando el
  // formulario está en modo "crear uno nuevo". Se guarda junto con si
  // pertenece a una persona (capturadoId) o es colectivo, ya que la
  // ruta de la API es distinta para cada caso.
  const [elementoEditando, setElementoEditando] = useState<{
    detalle: ElementoDetalle;
    capturadoId: string | null;
  } | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState<string | null>(null);

  async function iniciarEdicion(capturadoId: string | null, elementoId: string) {
    setCargandoEdicion(elementoId);
    setError(null);
    try {
      const ruta =
        capturadoId === null
          ? `/procedimientos/${id}/elementos-colectivos/${elementoId}`
          : `/procedimientos/${id}/capturados/${capturadoId}/elementos/${elementoId}`;
      const detalle = await api.get<ElementoDetalle>(ruta);
      setElementoEditando({ detalle, capturadoId });
      setMostrarFormulario(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar el elemento para editarlo.");
    } finally {
      setCargandoEdicion(null);
    }
  }

  async function cargarTodo() {
    const [personas, procedimiento, colectivos, victimasDelProcedimiento] = await Promise.all([
      api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`),
      api.get<{ delito: string; sinElementosIncautados: boolean | null }>(`/procedimientos/${id}`),
      api.get<Elemento[]>(`/procedimientos/${id}/elementos-colectivos`),
      // Adenda 2026-08-21 (módulo Hurto): víctimas, para poder vincular
      // cada elemento hurtado a la víctima correspondiente.
      api.get<VictimaResumen[]>(`/procedimientos/${id}/victimas`).catch(() => []),
    ]);
    setIntervinientes(personas);
    setDelito(procedimiento.delito);
    setSinElementos(procedimiento.sinElementosIncautados);
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

  const totalElementosRegistrados =
    elementosColectivos.length + Object.values(elementosPorPersona).reduce((total, lista) => total + lista.length, 0);

  async function confirmarSinElementos() {
    setGuardandoSinElementos(true);
    setError(null);
    try {
      await api.patch(`/procedimientos/${id}`, { sinElementosIncautados: true });
      setSinElementos(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible guardar esta confirmación.");
    } finally {
      setGuardandoSinElementos(false);
    }
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
          <h1 className="font-display text-2xl text-institucional-950">5. Elementos incautados</h1>
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

      {/* Adenda 2026-09-01: bug real reportado tras prueba en vivo -- este
          bloque se marcaba en verde automáticamente al crear el
          procedimiento, sin haber registrado ningún elemento. Hay
          procedimientos legítimos sin elementos incautados -- este aviso
          permite al funcionario confirmarlo explícitamente, en vez de que
          el sistema lo asuma por defecto. */}
      {intervinientes.length > 0 && totalElementosRegistrados === 0 && sinElementos !== true && (
        <div className="mt-6 rounded-md border border-acento/30 bg-acento/10 px-4 py-3">
          <p className="font-sans text-sm text-institucional-900">
            Aún no has registrado ningún elemento incautado. Si este procedimiento efectivamente no tiene
            elementos incautados, confírmalo aquí para marcar el bloque como completo.
          </p>
          <button
            type="button"
            onClick={confirmarSinElementos}
            disabled={guardandoSinElementos}
            className="mt-3 rounded-md border border-institucional-800 px-3 py-1.5 font-sans text-sm font-semibold text-institucional-900 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardandoSinElementos ? "Guardando…" : "No hay elementos incautados en este procedimiento"}
          </button>
        </div>
      )}

      {intervinientes.length > 0 && totalElementosRegistrados === 0 && sinElementos === true && (
        <div className="mt-6 rounded-md border border-institucional-100 bg-institucional-50 px-4 py-3">
          <p className="font-sans text-sm text-institucional-900">
            ✅ Confirmaste que este procedimiento no tiene elementos incautados. Si te equivocaste, solo
            registra un elemento con el botón de arriba y esta confirmación se actualizará automáticamente.
          </p>
        </div>
      )}

      {mostrarFormulario && (
        <FormularioNuevoElemento
          procedimientoId={id}
          intervinientes={intervinientes}
          delito={delito}
          victimas={victimas}
          elementoEditando={elementoEditando}
          onCancelar={() => {
            setMostrarFormulario(false);
            setElementoEditando(null);
          }}
          onCreado={async () => {
            setMostrarFormulario(false);
            setElementoEditando(null);
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
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => iniciarEdicion(null, el.id)}
                      disabled={cargandoEdicion === el.id}
                      className="font-sans text-xs text-institucional-800 hover:underline disabled:opacity-50"
                    >
                      {cargandoEdicion === el.id ? "Cargando…" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarElementoColectivo(el.id)}
                      className="font-sans text-xs text-estado-error hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
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
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(persona.id, el.id)}
                          disabled={cargandoEdicion === el.id}
                          className="font-sans text-xs text-institucional-800 hover:underline disabled:opacity-50"
                        >
                          {cargandoEdicion === el.id ? "Cargando…" : "Editar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarElemento(persona.id, el.id)}
                          className="font-sans text-xs text-estado-error hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
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
  elementoEditando,
  onCancelar,
  onCreado,
}: {
  procedimientoId: string;
  intervinientes: CapturadoResumen[];
  delito: string;
  victimas: VictimaResumen[];
  elementoEditando: { detalle: ElementoDetalle; capturadoId: string | null } | null;
  onCancelar: () => void;
  onCreado: () => void;
}) {
  const editando = elementoEditando?.detalle ?? null;
  const detalleTipado =
    editando?.detalleSustancia ??
    editando?.detalleDinero ??
    editando?.detalleCelular ??
    editando?.detalleArma ??
    editando?.detalleOtro ??
    null;
  const esArmas = delito === DELITO_ARMAS;
  // Adenda 2026-08-21 (módulo Hurto): campos exclusivos de este delito.
  const esHurto = delito === DELITO_HURTO;
  const [victimaId, setVictimaId] = useState(editando?.victimaId ?? "");
  const [recuperado, setRecuperado] = useState<"" | "SI" | "NO">(
    editando?.recuperado === true ? "SI" : editando?.recuperado === false ? "NO" : "",
  );
  const [recuperadoPor, setRecuperadoPor] = useState(editando?.recuperadoPor ?? "");
  // Adenda 2026-08-23 (módulo Receptación): campos exclusivos de este
  // delito.
  const esReceptacion = delito === DELITO_RECEPTACION;
  const [fuenteVerificacionHurto, setFuenteVerificacionHurto] = useState<"" | "APLICATIVO" | "DENUNCIA">(
    (editando?.fuenteVerificacionHurto as "APLICATIVO" | "DENUNCIA" | undefined) ?? "",
  );
  const [nombreAplicativo, setNombreAplicativo] = useState(editando?.nombreAplicativo ?? "");
  const [numeroReporteAplicativo, setNumeroReporteAplicativo] = useState(
    editando?.numeroReporteAplicativo ?? "",
  );
  const [numeroDenuncia, setNumeroDenuncia] = useState(editando?.numeroDenuncia ?? "");
  const [entidadDenuncia, setEntidadDenuncia] = useState(editando?.entidadDenuncia ?? "");
  const [fechaDenuncia, setFechaDenuncia] = useState(
    editando?.fechaDenuncia ? editando.fechaDenuncia.slice(0, 10) : "",
  );
  const [denuncianteNombre, setDenuncianteNombre] = useState(editando?.denuncianteNombre ?? "");
  const [denuncianteDocumento, setDenuncianteDocumento] = useState(editando?.denuncianteDocumento ?? "");
  const [denuncianteTelefono, setDenuncianteTelefono] = useState(editando?.denuncianteTelefono ?? "");
  // Adenda 2026-08-23 (delitos contra la fe pública: Uso de Documento
  // Falso, Falsedad Personal, Tráfico de Moneda Falsa): campos
  // compartidos entre los tres.
  const esFePublica =
    delito === DELITO_USO_DOCUMENTO_FALSO ||
    delito === DELITO_FALSEDAD_PERSONAL ||
    delito === DELITO_TRAFICO_MONEDA_FALSA;
  const [contextoExhibicion, setContextoExhibicion] = useState(editando?.contextoExhibicion ?? "");
  const [criteriosSospecha, setCriteriosSospecha] = useState(editando?.criteriosSospecha ?? "");
  const [capturadoId, setCapturadoId] = useState(
    editando
      ? elementoEditando!.capturadoId ?? SIN_INDIVIDUALIZAR
      : intervinientes[0]?.id ?? "",
  );
  const [tipoElemento, setTipoElemento] = useState<"SUSTANCIA" | "DINERO" | "CELULAR" | "ARMA" | "OTRO">(
    editando?.tipoElemento ?? (esArmas ? "ARMA" : "SUSTANCIA"),
  );
  const [ubicacionHallazgo, setUbicacionHallazgo] = useState(editando?.ubicacionHallazgo ?? "");
  const [direccionIncautacion, setDireccionIncautacion] = useState(editando?.direccionIncautacion ?? "");
  // Adenda 2026-08-26: observación puntual sobre el elemento, a
  // solicitud del usuario -- mismo patrón que esposas/lesiones (Sí/No +
  // texto libre condicional). El backend ya tenía todo listo desde
  // hace tiempo (campo `observaciones` en ElementoIncautado, con la
  // leyenda "Sin observaciones." como valor por defecto en el Acta de
  // Incautación) -- solo faltaba exponerlo en este formulario.
  const [tieneObservacionElemento, setTieneObservacionElemento] = useState<boolean | null>(
    editando ? Boolean(editando.observaciones) : null,
  );
  const [observacionElemento, setObservacionElemento] = useState(editando?.observaciones ?? "");
  const [cantidadEmpaques, setCantidadEmpaques] = useState(
    editando?.detalleSustancia ? String(editando.detalleSustancia.cantidadEmpaques) : "",
  );
  const [tipoEmpaque, setTipoEmpaque] = useState(editando?.detalleSustancia?.tipoEmpaque ?? "");
  const [tipoSustancia, setTipoSustancia] = useState(editando?.detalleSustancia?.tipoSustancia ?? "");
  const [color, setColor] = useState(
    editando?.detalleSustancia?.color ?? editando?.detalleCelular?.color ?? editando?.detalleArma?.color ?? "",
  );
  const [caracteristicas, setCaracteristicas] = useState(editando?.detalleSustancia?.caracteristicas ?? "");
  const [valorTotal, setValorTotal] = useState(
    editando?.detalleDinero ? String(editando.detalleDinero.valorTotal) : "",
  );
  const [denominaciones, setDenominaciones] = useState(editando?.detalleDinero?.denominaciones ?? "");
  const [marca, setMarca] = useState(
    editando?.detalleCelular?.marca ?? editando?.detalleArma?.marca ?? "",
  );
  const [imei, setImei] = useState(editando?.detalleCelular?.imei ?? "");
  const [descripcionManual, setDescripcionManual] = useState(editando?.detalleOtro?.descripcionManual ?? "");
  // Adenda 2026-08-12: módulo de Porte Ilegal de Armas de Fuego.
  const [tipoArma, setTipoArma] = useState<"PISTOLA" | "REVOLVER" | "ESCOPETA" | "FUSIL" | "HECHIZA">(
    (editando?.detalleArma?.tipoArma as "PISTOLA" | "REVOLVER" | "ESCOPETA" | "FUSIL" | "HECHIZA" | undefined) ??
      "PISTOLA",
  );
  const [modelo, setModelo] = useState("");
  const [calibre, setCalibre] = useState(editando?.detalleArma?.calibre ?? "");
  const [cachaMaterial, setCachaMaterial] = useState(editando?.detalleArma?.cachaMaterial ?? "");
  const [cachaColor, setCachaColor] = useState(editando?.detalleArma?.cachaColor ?? "");
  const [serial, setSerial] = useState(editando?.detalleArma?.serial ?? "");
  const [estadoSerial, setEstadoSerial] = useState<
    "LEGIBLE" | "NO_PRESENTA" | "BORRADO" | "ALTERADO" | "NO_LEGIBLE" | ""
  >(
    (editando?.detalleArma?.estadoSerial as
      | "LEGIBLE"
      | "NO_PRESENTA"
      | "BORRADO"
      | "ALTERADO"
      | "NO_LEGIBLE"
      | undefined) ?? "",
  );
  const [estadoArma, setEstadoArma] = useState<"BUEN_ESTADO" | "REGULAR_ESTADO" | "MAL_ESTADO">(
    (editando?.detalleArma?.estadoArma as "BUEN_ESTADO" | "REGULAR_ESTADO" | "MAL_ESTADO" | undefined) ??
      "BUEN_ESTADO",
  );
  const [cantidadMuniciones, setCantidadMuniciones] = useState(
    editando?.detalleArma?.cantidadMuniciones !== null && editando?.detalleArma?.cantidadMuniciones !== undefined
      ? String(editando.detalleArma.cantidadMuniciones)
      : "",
  );
  const [calibreMunicion, setCalibreMunicion] = useState(editando?.detalleArma?.calibreMunicion ?? "");
  const [cantidadCargadores, setCantidadCargadores] = useState(
    editando?.detalleArma?.cantidadCargadores !== null && editando?.detalleArma?.cantidadCargadores !== undefined
      ? String(editando.detalleArma.cantidadCargadores)
      : "",
  );
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
    if (esReceptacion) {
      if (fuenteVerificacionHurto === "") {
        setError("Indica cómo se estableció que el elemento tiene reporte de hurto.");
        return;
      }
      if (fuenteVerificacionHurto === "APLICATIVO" && !nombreAplicativo.trim()) {
        setError("Indica el nombre del aplicativo consultado.");
        return;
      }
      if (fuenteVerificacionHurto === "DENUNCIA" && (!numeroDenuncia.trim() || !entidadDenuncia.trim())) {
        setError("Indica el número de la denuncia y la entidad ante la cual fue presentada.");
        return;
      }
    }
    if (esFePublica && (!contextoExhibicion.trim() || !criteriosSospecha.trim())) {
      setError("Indica el contexto y los criterios de sospecha para este elemento.");
      return;
    }
    if (tieneObservacionElemento === null) {
      setError("Indica si hay alguna observación respecto a este elemento.");
      return;
    }
    if (tieneObservacionElemento && !observacionElemento.trim()) {
      setError("Escribe la observación, o marca \"No\" si no hay ninguna.");
      return;
    }
    setCargando(true);
    try {
      const cuerpo: Record<string, unknown> = {
        // Adenda 2026-09-01: al editar, el tipo de elemento no se
        // puede cambiar (ver ActualizarElementoDto en el backend) --
        // se omite del cuerpo para no chocar con la validación
        // (forbidNonWhitelisted).
        ...(editando ? {} : { tipoElemento }),
        ubicacionHallazgo: ubicacionHallazgo || undefined,
        direccionIncautacion,
        // Al marcar "No" se deja sin enviar -- el backend ya muestra
        // "Sin observaciones." como valor por defecto en el Acta de
        // Incautación cuando este campo llega vacío.
        observaciones: tieneObservacionElemento ? observacionElemento.trim() : undefined,
      };
      if (esHurto) {
        Object.assign(cuerpo, {
          victimaId: victimaId || undefined,
          recuperado: recuperado === "" ? undefined : recuperado === "SI",
          recuperadoPor: recuperado === "SI" ? recuperadoPor.trim() : undefined,
        });
      }
      if (esReceptacion) {
        Object.assign(cuerpo, {
          victimaId: victimaId || undefined,
          fuenteVerificacionHurto,
          nombreAplicativo:
            fuenteVerificacionHurto === "APLICATIVO" ? nombreAplicativo.trim() : undefined,
          numeroReporteAplicativo:
            fuenteVerificacionHurto === "APLICATIVO"
              ? numeroReporteAplicativo.trim() || undefined
              : undefined,
          numeroDenuncia: fuenteVerificacionHurto === "DENUNCIA" ? numeroDenuncia.trim() : undefined,
          entidadDenuncia: fuenteVerificacionHurto === "DENUNCIA" ? entidadDenuncia.trim() : undefined,
          fechaDenuncia:
            fuenteVerificacionHurto === "DENUNCIA" && fechaDenuncia
              ? `${fechaDenuncia}T00:00:00.000Z`
              : undefined,
          denuncianteNombre:
            fuenteVerificacionHurto === "DENUNCIA" ? denuncianteNombre.trim() || undefined : undefined,
          denuncianteDocumento:
            fuenteVerificacionHurto === "DENUNCIA" ? denuncianteDocumento.trim() || undefined : undefined,
          denuncianteTelefono:
            fuenteVerificacionHurto === "DENUNCIA" ? denuncianteTelefono.trim() || undefined : undefined,
        });
      }
      if (esFePublica) {
        Object.assign(cuerpo, {
          contextoExhibicion: contextoExhibicion.trim(),
          criteriosSospecha: criteriosSospecha.trim(),
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

      if (editando) {
        const ruta =
          elementoEditando!.capturadoId === null
            ? `/procedimientos/${procedimientoId}/elementos-colectivos/${editando.id}`
            : `/procedimientos/${procedimientoId}/capturados/${elementoEditando!.capturadoId}/elementos/${editando.id}`;
        await api.patch(ruta, cuerpo);
      } else {
        const ruta =
          capturadoId === SIN_INDIVIDUALIZAR
            ? `/procedimientos/${procedimientoId}/elementos-colectivos`
            : `/procedimientos/${procedimientoId}/capturados/${capturadoId}/elementos`;
        await api.post(ruta, cuerpo);
      }
      onCreado();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `No fue posible ${editando ? "guardar los cambios del" : "registrar el"} elemento.`,
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="mt-6 space-y-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm"
    >
      <h2 className="font-display text-lg text-institucional-950">
        {editando ? "Editar elemento" : "Nuevo elemento"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Capturado/Aprehendido" requerido>
          <select
            className={claseInput}
            value={capturadoId}
            onChange={(e) => setCapturadoId(e.target.value)}
            disabled={Boolean(editando)}
          >
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
            disabled={Boolean(editando)}
          >
            {delito === DELITO_ESTUPEFACIENTES && <option value="SUSTANCIA">Sustancia</option>}
            {esArmas && <option value="ARMA">Arma de fuego</option>}
            <option value="DINERO">Dinero</option>
            <option value="CELULAR">Celular</option>
            <option value="OTRO">Otro</option>
          </select>
          {editando && (
            <p className="mt-1 font-sans text-xs text-institucional-700">
              El tipo de elemento no se puede cambiar al editar — si te equivocaste de tipo, elimina este
              elemento y regístralo de nuevo con el tipo correcto.
            </p>
          )}
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

      {esReceptacion && (
        <div className="rounded-md border border-institucional-100 bg-institucional-50 p-4">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
            Datos propios de Receptación
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Víctima original del hurto (si se identificó)">
              <select className={claseInput} value={victimaId} onChange={(e) => setVictimaId(e.target.value)}>
                <option value="">Sin víctima identificada / no aplica</option>
                {victimas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.primerNombre} {v.primerApellido}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="¿Cómo se estableció que tiene reporte de hurto?" requerido>
              <select
                required
                className={claseInput}
                value={fuenteVerificacionHurto}
                onChange={(e) => setFuenteVerificacionHurto(e.target.value as typeof fuenteVerificacionHurto)}
              >
                <option value="">Selecciona…</option>
                <option value="APLICATIVO">Consulta en aplicativo policial</option>
                <option value="DENUNCIA">Denuncia presentada por un tercero</option>
              </select>
            </Campo>
          </div>

          {fuenteVerificacionHurto === "APLICATIVO" && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre del aplicativo consultado" requerido>
                <input
                  required
                  className={claseInput}
                  value={nombreAplicativo}
                  onChange={(e) => setNombreAplicativo(e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Número de reporte encontrado (si está disponible)">
                <input
                  className={claseInput}
                  value={numeroReporteAplicativo}
                  onChange={(e) => setNumeroReporteAplicativo(e.target.value)}
                />
              </Campo>
            </div>
          )}

          {fuenteVerificacionHurto === "DENUNCIA" && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Número de la denuncia" requerido>
                  <input
                    required
                    className={claseInput}
                    value={numeroDenuncia}
                    onChange={(e) => setNumeroDenuncia(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Entidad ante la cual fue presentada" requerido>
                  <input
                    required
                    className={claseInput}
                    value={entidadDenuncia}
                    onChange={(e) => setEntidadDenuncia(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Fecha de la denuncia">
                  <input
                    type="date"
                    className={claseInput}
                    value={fechaDenuncia}
                    onChange={(e) => setFechaDenuncia(e.target.value)}
                  />
                </Campo>
              </div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
                Datos de quien presentó la denuncia (si los aportó — no es necesariamente la víctima)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombre">
                  <input
                    className={claseInput}
                    value={denuncianteNombre}
                    onChange={(e) => setDenuncianteNombre(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Documento">
                  <input
                    className={claseInput}
                    value={denuncianteDocumento}
                    onChange={(e) => setDenuncianteDocumento(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Teléfono">
                  <input
                    className={claseInput}
                    value={denuncianteTelefono}
                    onChange={(e) => setDenuncianteTelefono(e.target.value)}
                  />
                </Campo>
              </div>
            </div>
          )}
        </div>
      )}

      {esFePublica && (
        <div className="rounded-md border border-institucional-100 bg-institucional-50 p-4">
          <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-wide text-institucional-700">
            Datos propios de este delito
          </p>
          <div className="space-y-4">
            <Campo
              etiqueta={
                delito === DELITO_TRAFICO_MONEDA_FALSA
                  ? "¿En qué contexto se interceptó?"
                  : "¿Por qué motivo le fue exhibido/presentado?"
              }
              requerido
            >
              <textarea
                required
                rows={2}
                className={claseInput}
                placeholder={
                  delito === DELITO_TRAFICO_MONEDA_FALSA
                    ? "Ej. la persona lo estaba usando para pagar una transacción"
                    : "Ej. control de identidad, requerimiento durante otro procedimiento"
                }
                value={contextoExhibicion}
                onChange={(e) => setContextoExhibicion(e.target.value)}
              />
            </Campo>
            <Campo
              etiqueta={
                delito === DELITO_FALSEDAD_PERSONAL
                  ? "¿Qué actividades de corroboración se realizaron?"
                  : "¿Qué criterios hicieron sospechar de la falsedad?"
              }
              requerido
            >
              <textarea
                required
                rows={2}
                className={claseInput}
                value={criteriosSospecha}
                onChange={(e) => setCriteriosSospecha(e.target.value)}
              />
            </Campo>
          </div>
        </div>
      )}

      <Campo etiqueta="¿Hay alguna observación respecto a este elemento?" requerido>
        <div className="mt-1 flex gap-3">
          {[true, false].map((valor) => (
            <button
              type="button"
              key={String(valor)}
              onClick={() => setTieneObservacionElemento(valor)}
              className={`rounded-md border px-3 py-2 font-sans text-sm transition-colors ${
                tieneObservacionElemento === valor
                  ? "border-acento bg-acento-light text-acento-hover"
                  : "border-institucional-100 text-institucional-700 hover:bg-institucional-50"
              }`}
            >
              {valor ? "Sí" : "No"}
            </button>
          ))}
        </div>
      </Campo>
      {tieneObservacionElemento && (
        <Campo etiqueta="Observación" requerido>
          <textarea
            required
            rows={2}
            className={claseInput}
            placeholder="Deja aquí la constancia que consideres pertinente sobre este elemento"
            value={observacionElemento}
            onChange={(e) => setObservacionElemento(e.target.value)}
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
          {cargando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar elemento"}
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
