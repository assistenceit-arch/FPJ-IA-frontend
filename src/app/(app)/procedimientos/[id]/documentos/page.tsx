"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { descargarArchivo } from "@/lib/descargarArchivo";
import { useUsuarioActual } from "@/lib/usuario-context";

interface CapturadoResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
  tipoInterviniente: "CAPTURADO" | "APREHENDIDO";
}

interface ElementoResumen {
  id: string;
  tipoElemento: "SUSTANCIA" | "DINERO" | "CELULAR" | "ARMA" | "OTRO";
  descripcionBase: string;
}

interface DocumentoGenerado {
  id: string;
  tipoDocumento: string; // FPJ5 | FPJ6 | ACTA | ACTA_COLECTIVA | FPJ7 | FPJ8
  capturadoId: string | null;
  elementoId: string | null;
  fechaGeneracion: string;
  estado: string;
}

interface Pago {
  estadoPago: "Pendiente" | "Verificado" | "Rechazado";
}

const ETIQUETA_TIPO_ELEMENTO: Record<ElementoResumen["tipoElemento"], string> = {
  SUSTANCIA: "Sustancia",
  DINERO: "Dinero",
  CELULAR: "Celular",
  ARMA: "Arma de fuego",
  OTRO: "Otro",
};

const ETIQUETA_TIPO_DOCUMENTO: Record<string, string> = {
  ACTA: "Acta de Incautación",
  ACTA_COLECTIVA: "Acta de Incautación colectiva",
  FPJ6: "FPJ-6 — Acta de Derechos",
  FPJ5: "FPJ-5 — Informe de Captura",
  FPJ7: "FPJ-7 — Rótulo EMP/EF",
  FPJ8: "FPJ-8 — Cadena de Custodia",
};

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-institucional-950">{titulo}</h2>
      <p className="mt-1 font-sans text-sm text-institucional-700">{descripcion}</p>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function BotonGenerar({
  cargando,
  onClick,
  children = "Generar y descargar",
}: {
  cargando: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={cargando}
      onClick={onClick}
      className="rounded-md bg-acento px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {cargando ? "Generando…" : "Generar y descargar"}
    </button>
  );
}

function AccionDocumento({
  generado,
  cargando,
  edicionDesbloqueada,
  onGenerar,
  onDescargar,
  onEnviarCorreo,
}: {
  generado?: { id: string };
  cargando: boolean;
  edicionDesbloqueada: boolean;
  onGenerar: () => void;
  onDescargar: (documentoId: string) => void;
  onEnviarCorreo: (documentoId: string, correo: string) => Promise<void>;
}) {
  const { usuario } = useUsuarioActual();
  const [mostrarCorreo, setMostrarCorreo] = useState(false);
  const [correo, setCorreo] = useState("");
  const [correoTocado, setCorreoTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<"exito" | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Corrección 2026-09-03 (auditoría de seguridad de la PWA): antes,
  // payloadToken() daba el correo del usuario de forma instantánea y
  // síncrona (decodificando el token en el propio navegador) -- ahora
  // viene de una consulta al backend (useUsuarioActual), que resuelve
  // un instante después del primer render. Solo se usa como valor
  // inicial sugerido -- si el funcionario ya empezó a escribir una
  // dirección distinta, no se le sobrescribe lo que escribió.
  useEffect(() => {
    if (usuario?.correo && !correoTocado) {
      setCorreo(usuario.correo);
    }
  }, [usuario, correoTocado]);

  async function manejarEnvio() {
    if (!generado || !correo.trim()) return;
    setEnviando(true);
    setResultado(null);
    setErrorEnvio(null);
    try {
      await onEnviarCorreo(generado.id, correo.trim());
      setResultado("exito");
      setMostrarCorreo(false);
    } catch (err) {
      // Corrección 2026-08-26: antes se mostraba siempre el mismo texto
      // genérico ("verifica el correo"), sin importar la causa real --
      // reportado por el usuario como confuso, porque el correo que
      // escribía normalmente sí estaba bien: la causa real casi siempre
      // es que el servidor no tiene SMTP configurado, no un problema
      // con la dirección de correo.
      setErrorEnvio(
        err instanceof ApiError ? err.message : "No fue posible enviar el documento.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (generado) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-institucional-100 px-2.5 py-1 font-sans text-xs font-medium text-institucional-800">
            Ya generado
          </span>
          <button
            type="button"
            onClick={() => onDescargar(generado.id)}
            className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50"
          >
            Descargar
          </button>
          <button
            type="button"
            onClick={() => {
              setMostrarCorreo((v) => !v);
              setResultado(null);
              setErrorEnvio(null);
            }}
            className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50"
          >
            Enviar por correo
          </button>
          {edicionDesbloqueada && (
            <button
              type="button"
              onClick={onGenerar}
              disabled={cargando}
              className="rounded-md bg-estado-error px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              title="Un administrador desbloqueó la edición de este procedimiento"
            >
              {cargando ? "Regenerando…" : "Regenerar"}
            </button>
          )}
        </div>
        {mostrarCorreo && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setCorreoTocado(true);
              }}
              placeholder="correo@institucion.gov.co"
              className="rounded-md border border-institucional-100 px-2.5 py-1.5 font-sans text-xs text-institucional-950 shadow-sm outline-none focus:border-acento"
            />
            <button
              type="button"
              onClick={manejarEnvio}
              disabled={enviando || !correo.trim()}
              className="rounded-md bg-acento px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar"}
            </button>
          </div>
        )}
        {resultado === "exito" && (
          <p className="font-sans text-xs text-estado-completo">Documento enviado correctamente.</p>
        )}
        {errorEnvio && <p className="font-sans text-xs text-estado-error">{errorEnvio}</p>}
      </div>
    );
  }
  return <BotonGenerar cargando={cargando} onClick={onGenerar} />;
}

export default function BloqueDocumentos() {
  const { id } = useParams<{ id: string }>();
  const [intervinientes, setIntervinientes] = useState<CapturadoResumen[]>([]);
  const [elementosPorPersona, setElementosPorPersona] = useState<Record<string, ElementoResumen[]>>({});
  // Adenda 2026-08-14: elementos "sin individualizar" -- ver Bloque 4.
  const [elementosColectivos, setElementosColectivos] = useState<ElementoResumen[]>([]);
  const [generados, setGenerados] = useState<DocumentoGenerado[]>([]);
  const [pago, setPago] = useState<Pago | null>(null);
  const [exoneradoPago, setExoneradoPago] = useState(false);
  const [edicionDesbloqueada, setEdicionDesbloqueada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botonCargando, setBotonCargando] = useState<string | null>(null);

  // Flujo de aclaraciones del FPJ-5 (WF-M2/CORE): puede pedir varias
  // rondas de preguntas antes de poder generar el documento.
  const [preguntaFpj5, setPreguntaFpj5] = useState<string | null>(null);
  const [respuestaFpj5, setRespuestaFpj5] = useState("");
  const [generandoFpj5, setGenerandoFpj5] = useState(false);
  // El trabajo de la cola en segundo plano se identifica una sola vez
  // al crearlo -- las rondas de aclaración se responden sobre ESE
  // mismo trabajo (el backend acumula las respuestas), no se crea uno
  // nuevo por cada pregunta.
  const [trabajoFpj5Id, setTrabajoFpj5Id] = useState<string | null>(null);

  // Adenda 2026-08-29: cola de generación en segundo plano, a solicitud
  // del usuario -- tras confirmar con una prueba de carga real que
  // generar un documento pesado (1-2 minutos) podía dejar a otros
  // funcionarios esperando hasta 84 segundos por algo tan simple como
  // consultar su lista de procedimientos. En vez de esperar la
  // respuesta directa del servidor, ahora se crea un "trabajo", y se
  // pregunta cada 2 segundos si ya terminó -- el servidor responde de
  // inmediato en ambos casos, nunca se queda "colgado" esperando.
  interface ResultadoTrabajo {
    estado: "Completado" | "Fallido" | "RequiereAclaracion";
    documentoGeneradoId?: string;
    mensajeError?: string;
    preguntaAclaracion?: string;
    trabajoId: string;
  }

  async function esperarResultadoTrabajo(trabajoId: string): Promise<ResultadoTrabajo> {
    const INTERVALO_MS = 2000;
    for (;;) {
      const estado = await api.get<{
        id: string;
        estado: string;
        documentoGeneradoId?: string;
        mensajeError?: string;
        preguntaAclaracion?: string;
      }>(`/trabajos-generacion/${trabajoId}`);

      if (
        estado.estado === "Completado" ||
        estado.estado === "Fallido" ||
        estado.estado === "RequiereAclaracion"
      ) {
        return { ...estado, trabajoId } as ResultadoTrabajo;
      }
      // "Pendiente" o "Procesando" -- seguir esperando.
      await new Promise((resolve) => setTimeout(resolve, INTERVALO_MS));
    }
  }

  async function crearYEsperarTrabajo(
    tipoDocumento: string,
    opciones: { capturadoId?: string; elementoId?: string; aclaraciones?: string[] } = {},
  ): Promise<ResultadoTrabajo> {
    const { id: trabajoId } = await api.post<{ id: string; estado: string }>(
      `/procedimientos/${id}/trabajos-generacion`,
      { tipoDocumento, ...opciones },
    );
    return esperarResultadoTrabajo(trabajoId);
  }

  async function cargarTodo() {
    const [personas, docs, estadoPago, procedimiento, colectivos] = await Promise.all([
      api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`),
      api.get<DocumentoGenerado[]>(`/procedimientos/${id}/documentos`),
      api.get<Pago | null>(`/procedimientos/${id}/pago`).catch(() => null),
      api.get<{ edicionDesbloqueada: boolean; exoneradoPago: boolean }>(`/procedimientos/${id}`).catch(() => null),
      api.get<ElementoResumen[]>(`/procedimientos/${id}/elementos-colectivos`).catch(() => []),
    ]);
    setIntervinientes(personas);
    setGenerados(docs);
    setPago(estadoPago);
    setEdicionDesbloqueada(procedimiento?.edicionDesbloqueada ?? false);
    setExoneradoPago(procedimiento?.exoneradoPago ?? false);
    setElementosColectivos(colectivos);
    const listas = await Promise.all(
      personas.map((p) => api.get<ElementoResumen[]>(`/procedimientos/${id}/capturados/${p.id}/elementos`)),
    );
    const mapa: Record<string, ElementoResumen[]> = {};
    personas.forEach((p, i) => (mapa[p.id] = listas[i]));
    setElementosPorPersona(mapa);
    setCargando(false);
  }

  useEffect(() => {
    cargarTodo().catch((err) => {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar la información.");
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function descargar(documentoId: string, nombreSugerido: string) {
    const ok = await descargarArchivo(`/documentos/${documentoId}/descargar`, nombreSugerido);
    if (!ok) {
      setError("El documento se generó, pero no fue posible descargarlo automáticamente.");
    }
  }

  // Adenda 2026-08-26: alternativa a la descarga directa, a solicitud
  // del usuario -- útil sobre todo desde el celular.
  async function enviarPorCorreo(documentoId: string, correo: string) {
    await api.post(`/documentos/${documentoId}/enviar-correo`, { correo });
  }

  function nombreArchivo(tipoDocumento: string, referencia?: string) {
    const base = ETIQUETA_TIPO_DOCUMENTO[tipoDocumento]?.split(" — ")[0] ?? tipoDocumento;
    return `${base}${referencia ? `-${referencia}` : ""}.docx`.replace(/\s+/g, "_");
  }

  async function generarPorCapturado(endpoint: string, tipoDocumento: string, capturado: CapturadoResumen) {
    const claveBoton = `${tipoDocumento}-${capturado.id}`;
    setBotonCargando(claveBoton);
    setError(null);
    try {
      const resultado = await crearYEsperarTrabajo(tipoDocumento, { capturadoId: capturado.id });
      if (resultado.estado === "Fallido") {
        setError(resultado.mensajeError ?? "No fue posible generar el documento.");
        return;
      }
      await cargarTodo();
      if (resultado.documentoGeneradoId) {
        await descargar(
          resultado.documentoGeneradoId,
          nombreArchivo(tipoDocumento, `${capturado.primerNombre}_${capturado.primerApellido}`),
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible generar el documento.");
    } finally {
      setBotonCargando(null);
    }
  }

  // Adenda 2026-08-14: Acta de Incautación colectiva -- un solo
  // documento por procedimiento (igual que el FPJ-5), no por persona.
  async function generarActaColectiva() {
    setBotonCargando("ACTA_COLECTIVA");
    setError(null);
    try {
      const resultado = await crearYEsperarTrabajo("ACTA_COLECTIVA");
      if (resultado.estado === "Fallido") {
        setError(resultado.mensajeError ?? "No fue posible generar el documento.");
        return;
      }
      await cargarTodo();
      if (resultado.documentoGeneradoId) {
        await descargar(resultado.documentoGeneradoId, nombreArchivo("ACTA_COLECTIVA"));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible generar el documento.");
    } finally {
      setBotonCargando(null);
    }
  }

  async function generarPorElemento(
    endpoint: string,
    tipoDocumento: string,
    elemento: ElementoResumen,
    nombrePersona: string,
  ) {
    const claveBoton = `${tipoDocumento}-${elemento.id}`;
    setBotonCargando(claveBoton);
    setError(null);
    try {
      const resultado = await crearYEsperarTrabajo(tipoDocumento, { elementoId: elemento.id });
      if (resultado.estado === "Fallido") {
        setError(resultado.mensajeError ?? "No fue posible generar el documento.");
        return;
      }
      await cargarTodo();
      if (resultado.documentoGeneradoId) {
        await descargar(
          resultado.documentoGeneradoId,
          nombreArchivo(tipoDocumento, `${nombrePersona}_${elemento.descripcionBase}`),
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible generar el documento.");
    } finally {
      setBotonCargando(null);
    }
  }

  async function manejarResultadoFpj5(resultado: ResultadoTrabajo) {
    if (resultado.estado === "RequiereAclaracion") {
      setTrabajoFpj5Id(resultado.trabajoId);
      setPreguntaFpj5(resultado.preguntaAclaracion ?? null);
      return;
    }
    setGenerandoFpj5(false);
    setPreguntaFpj5(null);
    setTrabajoFpj5Id(null);
    if (resultado.estado === "Fallido") {
      setError(resultado.mensajeError ?? "No fue posible generar el FPJ-5.");
      return;
    }
    await cargarTodo();
    if (resultado.documentoGeneradoId) {
      await descargar(resultado.documentoGeneradoId, nombreArchivo("FPJ5"));
    }
  }

  function iniciarFpj5() {
    setGenerandoFpj5(true);
    setPreguntaFpj5(null);
    setError(null);
    crearYEsperarTrabajo("FPJ5")
      .then(manejarResultadoFpj5)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No fue posible generar el FPJ-5.");
        setGenerandoFpj5(false);
        setPreguntaFpj5(null);
      });
  }

  function enviarAclaracionFpj5() {
    if (!respuestaFpj5.trim() || !trabajoFpj5Id) return;
    const respuesta = respuestaFpj5.trim();
    const trabajoId = trabajoFpj5Id;
    setRespuestaFpj5("");
    setPreguntaFpj5(null); // vuelve a la vista de "generando..." mientras se reprocesa
    api
      .patch(`/trabajos-generacion/${trabajoId}/responder-aclaracion`, { respuesta })
      .then(() => esperarResultadoTrabajo(trabajoId))
      .then(manejarResultadoFpj5)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No fue posible continuar con la generación.");
        setGenerandoFpj5(false);
        setPreguntaFpj5(null);
        setTrabajoFpj5Id(null);
      });
  }

  function cancelarFpj5() {
    setGenerandoFpj5(false);
    setPreguntaFpj5(null);
    setRespuestaFpj5("");
    setTrabajoFpj5Id(null);
  }

  function buscarGenerado(
    tipoDocumento: string,
    opciones: { capturadoId?: string; elementoId?: string } = {},
  ) {
    return generados.find(
      (d) =>
        d.tipoDocumento === tipoDocumento &&
        (opciones.capturadoId === undefined || d.capturadoId === opciones.capturadoId) &&
        (opciones.elementoId === undefined || d.elementoId === opciones.elementoId),
    );
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  const elementosConDueno: { elemento: ElementoResumen; persona: CapturadoResumen | null }[] = [
    ...intervinientes.flatMap((p) => (elementosPorPersona[p.id] ?? []).map((e) => ({ elemento: e, persona: p }))),
    ...elementosColectivos.map((e) => ({ elemento: e, persona: null })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-institucional-950">8. Documentos</h1>
        <p className="mt-1 font-sans text-sm text-institucional-700">
          Genera y descarga los documentos oficiales a partir de la información diligenciada en los
          bloques anteriores. Cada documento se valida en el servidor — si falta algo, verás el motivo
          exacto aquí.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-estado-error/10 px-3 py-2.5 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      {pago?.estadoPago !== "Verificado" && !exoneradoPago && (
        <p className="rounded-md bg-estado-pendiente/10 px-3 py-2.5 font-sans text-sm text-estado-pendiente">
          {!pago && "Este procedimiento no tiene un pago registrado. "}
          {pago?.estadoPago === "Pendiente" && "El pago está registrado pero aún no ha sido verificado por un administrador. "}
          {pago?.estadoPago === "Rechazado" && "El pago fue rechazado — registra uno nuevo en el Bloque 7. "}
          No podrás generar documentos hasta que el pago quede <strong>Verificado</strong> (Bloque 7).
        </p>
      )}

      {(pago?.estadoPago === "Verificado" || exoneradoPago) && (
        <div className="rounded-md border-2 border-estado-completo bg-estado-completo/10 px-4 py-4">
          <p className="font-display text-lg font-bold text-estado-completo">
            Ya puede generar y descargar sus documentos
          </p>
          <p className="mt-3 font-sans text-sm font-bold uppercase tracking-wide text-institucional-950">
            Recuerde:
          </p>
          <p className="mt-1 font-sans text-base font-semibold leading-snug text-institucional-950">
            ⚠️ La exactitud y coherencia del contenido de estos documentos con los hechos del
            procedimiento debe ser verificada por el funcionario antes de su uso oficial. Esta
            responsabilidad es indelegable.
          </p>
          <p className="mt-2 font-sans text-base font-semibold leading-snug text-institucional-950">
            🖨️ Estos documentos deben imprimirse en tamaño <strong>Carta</strong> para que se ajusten
            correctamente a los estándares exigidos por las instituciones.
          </p>
        </div>
      )}

      <Seccion titulo="Acta de Incautación" descripcion="Uno por cada capturado/aprehendido que tenga elementos incautados a su cargo.">
        {intervinientes.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay capturados ni aprehendidos registrados.</p>
        ) : (
          intervinientes.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {p.primerNombre} {p.primerApellido}
              </span>
              <AccionDocumento
                edicionDesbloqueada={edicionDesbloqueada}
                generado={buscarGenerado("ACTA", { capturadoId: p.id })}
                cargando={botonCargando === `ACTA-${p.id}`}
                onGenerar={() => generarPorCapturado("acta-incautacion", "ACTA", p)}
                onDescargar={(docId) => descargar(docId, nombreArchivo("ACTA", `${p.primerNombre}_${p.primerApellido}`))}
                onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
              />
            </div>
          ))
        )}
      </Seccion>

      {elementosColectivos.length > 0 && (
        <Seccion
          titulo="Acta de Incautación colectiva"
          descripcion="Un solo documento por procedimiento, para los elementos sin individualizar — lista a todos los capturados/aprehendidos como firmantes."
        >
          <div className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
            <span className="font-sans text-sm text-institucional-950">
              {elementosColectivos.length} elemento{elementosColectivos.length === 1 ? "" : "s"} sin
              individualizar
            </span>
            <AccionDocumento
              edicionDesbloqueada={edicionDesbloqueada}
              generado={buscarGenerado("ACTA_COLECTIVA")}
              cargando={botonCargando === "ACTA_COLECTIVA"}
              onGenerar={generarActaColectiva}
              onDescargar={(docId) => descargar(docId, nombreArchivo("ACTA_COLECTIVA"))}
              onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
            />
          </div>
        </Seccion>
      )}

      <Seccion titulo="FPJ-6 — Acta de Derechos" descripcion="Uno por cada capturado o aprehendido.">
        {intervinientes.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay capturados ni aprehendidos registrados.</p>
        ) : (
          intervinientes.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {p.primerNombre} {p.primerApellido}
              </span>
              <AccionDocumento
                edicionDesbloqueada={edicionDesbloqueada}
                generado={buscarGenerado("FPJ6", { capturadoId: p.id })}
                cargando={botonCargando === `FPJ6-${p.id}`}
                onGenerar={() => generarPorCapturado("fpj6-acta-derechos", "FPJ6", p)}
                onDescargar={(docId) => descargar(docId, nombreArchivo("FPJ6", `${p.primerNombre}_${p.primerApellido}`))}
                onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
              />
            </div>
          ))
        )}
      </Seccion>

      <Seccion titulo="FPJ-5 — Informe de Captura" descripcion="Uno solo por todo el procedimiento. La narración de los hechos se redacta automáticamente; si al sistema le falta información, te lo va a preguntar aquí mismo antes de generar el documento.">
        {buscarGenerado("FPJ5") && !generandoFpj5 ? (
          <AccionDocumento
            edicionDesbloqueada={edicionDesbloqueada}
            generado={buscarGenerado("FPJ5")}
            cargando={false}
            onGenerar={iniciarFpj5}
            onDescargar={(docId) => descargar(docId, nombreArchivo("FPJ5"))}
            onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
          />
        ) : (
          <>
            {!generandoFpj5 && (
              <button
                type="button"
                onClick={iniciarFpj5}
                className="rounded-md bg-acento px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
              >
                Generar y descargar
              </button>
            )}

            {generandoFpj5 && !preguntaFpj5 && (
              <p className="font-sans text-sm text-institucional-700">Generando…</p>
            )}

            {preguntaFpj5 && (
              <div className="rounded-md bg-institucional-100 p-4">
                <p className="font-sans text-sm font-medium text-institucional-950">
                  El sistema necesita una aclaración antes de generar el FPJ-5:
                </p>
                <p className="mt-1 font-sans text-sm text-institucional-800">{preguntaFpj5}</p>
                <textarea
                  rows={3}
                  autoFocus
                  className="mt-3 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento"
                  value={respuestaFpj5}
                  onChange={(e) => setRespuestaFpj5(e.target.value)}
                  placeholder="Responde aquí para continuar…"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={enviarAclaracionFpj5}
                    disabled={!respuestaFpj5.trim()}
                    className="rounded-md bg-acento px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Enviar y continuar
                  </button>
                  <button
                    type="button"
                    onClick={cancelarFpj5}
                    className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Seccion>

      <Seccion titulo="FPJ-7 — Rótulo EMP/EF" descripcion="Uno por cada elemento incautado.">
        {elementosConDueno.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay elementos incautados registrados.</p>
        ) : (
          elementosConDueno.map(({ elemento, persona }) => (
            <div key={elemento.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {ETIQUETA_TIPO_ELEMENTO[elemento.tipoElemento]} — {elemento.descripcionBase}
                <span className="text-institucional-700">
                  {" "}
                  ({persona ? `${persona.primerNombre} ${persona.primerApellido}` : "sin individualizar"})
                </span>
              </span>
              <AccionDocumento
                edicionDesbloqueada={edicionDesbloqueada}
                generado={buscarGenerado("FPJ7", { elementoId: elemento.id })}
                cargando={botonCargando === `FPJ7-${elemento.id}`}
                onGenerar={() =>
                  generarPorElemento(
                    "fpj7-rotulo",
                    "FPJ7",
                    elemento,
                    persona ? `${persona.primerNombre}_${persona.primerApellido}` : "sin_individualizar",
                  )
                }
                onDescargar={(docId) =>
                  descargar(docId, nombreArchivo("FPJ7", `${persona?.primerNombre ?? "colectivo"}_${elemento.descripcionBase}`))
                }
                onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
              />
            </div>
          ))
        )}
      </Seccion>

      <Seccion titulo="FPJ-8 — Cadena de Custodia" descripcion="Uno por cada elemento incautado.">
        {elementosConDueno.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay elementos incautados registrados.</p>
        ) : (
          elementosConDueno.map(({ elemento, persona }) => (
            <div key={elemento.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {ETIQUETA_TIPO_ELEMENTO[elemento.tipoElemento]} — {elemento.descripcionBase}
                <span className="text-institucional-700">
                  {" "}
                  ({persona ? `${persona.primerNombre} ${persona.primerApellido}` : "sin individualizar"})
                </span>
              </span>
              <AccionDocumento
                edicionDesbloqueada={edicionDesbloqueada}
                generado={buscarGenerado("FPJ8", { elementoId: elemento.id })}
                cargando={botonCargando === `FPJ8-${elemento.id}`}
                onGenerar={() =>
                  generarPorElemento(
                    "fpj8-cadena-custodia",
                    "FPJ8",
                    elemento,
                    persona ? `${persona.primerNombre}_${persona.primerApellido}` : "sin_individualizar",
                  )
                }
                onDescargar={(docId) =>
                  descargar(docId, nombreArchivo("FPJ8", `${persona?.primerNombre ?? "colectivo"}_${elemento.descripcionBase}`))
                }
                onEnviarCorreo={(docId, correo) => enviarPorCorreo(docId, correo)}
              />
            </div>
          ))
        )}
      </Seccion>

      <Seccion titulo="Documentos generados" descripcion="Historial de todo lo generado en este procedimiento — puedes volver a descargar cualquiera sin regenerarlo.">
        {generados.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Todavía no se ha generado ningún documento.</p>
        ) : (
          generados.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {ETIQUETA_TIPO_DOCUMENTO[doc.tipoDocumento] ?? doc.tipoDocumento}
                <span className="ml-2 text-xs text-institucional-700">
                  {new Date(doc.fechaGeneracion).toLocaleString("es-CO")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => descargar(doc.id, nombreArchivo(doc.tipoDocumento))}
                className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50"
              >
                Descargar
              </button>
            </div>
          ))
        )}
      </Seccion>
    </div>
  );
}
