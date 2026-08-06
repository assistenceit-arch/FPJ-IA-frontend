"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { obtenerToken } from "@/lib/auth";

interface CapturadoResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
  tipoInterviniente: "CAPTURADO" | "APREHENDIDO";
}

interface ElementoResumen {
  id: string;
  tipoElemento: "SUSTANCIA" | "DINERO" | "CELULAR" | "OTRO";
  descripcionBase: string;
}

interface DocumentoGenerado {
  id: string;
  tipoDocumento: string; // FPJ5 | FPJ6 | ACTA | FPJ7 | FPJ8
  capturadoId: string | null;
  elementoId: string | null;
  fechaGeneracion: string;
  estado: string;
}

const ETIQUETA_TIPO_ELEMENTO: Record<ElementoResumen["tipoElemento"], string> = {
  SUSTANCIA: "Sustancia",
  DINERO: "Dinero",
  CELULAR: "Celular",
  OTRO: "Otro",
};

const ETIQUETA_TIPO_DOCUMENTO: Record<string, string> = {
  ACTA: "Acta de Incautación",
  FPJ6: "FPJ-6 — Acta de Derechos",
  FPJ5: "FPJ-5 — Informe de Captura",
  FPJ7: "FPJ-7 — Rótulo EMP/EF",
  FPJ8: "FPJ-8 — Cadena de Custodia",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

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
  children,
}: {
  cargando: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

export default function BloqueDocumentos() {
  const { id } = useParams<{ id: string }>();
  const [intervinientes, setIntervinientes] = useState<CapturadoResumen[]>([]);
  const [elementosPorPersona, setElementosPorPersona] = useState<Record<string, ElementoResumen[]>>({});
  const [generados, setGenerados] = useState<DocumentoGenerado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botonCargando, setBotonCargando] = useState<string | null>(null);

  // Flujo de aclaraciones del FPJ-5 (WF-M2/CORE): puede pedir varias
  // rondas de preguntas antes de poder generar el documento.
  const [preguntaFpj5, setPreguntaFpj5] = useState<string | null>(null);
  const [respuestaFpj5, setRespuestaFpj5] = useState("");
  const [aclaracionesFpj5, setAclaracionesFpj5] = useState<string[]>([]);
  const [generandoFpj5, setGenerandoFpj5] = useState(false);

  async function cargarTodo() {
    const [personas, docs] = await Promise.all([
      api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`),
      api.get<DocumentoGenerado[]>(`/procedimientos/${id}/documentos`),
    ]);
    setIntervinientes(personas);
    setGenerados(docs);
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
    try {
      const token = obtenerToken();
      const respuesta = await fetch(`${API_URL}/documentos/${documentoId}/descargar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!respuesta.ok) {
        setError("El documento se generó, pero no fue posible descargarlo automáticamente.");
        return;
      }
      const blob = await respuesta.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreSugerido;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("El documento se generó, pero no fue posible descargarlo automáticamente.");
    }
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
      const doc = await api.post<DocumentoGenerado>(
        `/procedimientos/${id}/capturados/${capturado.id}/documentos/${endpoint}`,
      );
      await cargarTodo();
      await descargar(doc.id, nombreArchivo(tipoDocumento, `${capturado.primerNombre}_${capturado.primerApellido}`));
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
      const doc = await api.post<DocumentoGenerado>(
        `/procedimientos/${id}/elementos/${elemento.id}/documentos/${endpoint}`,
      );
      await cargarTodo();
      await descargar(doc.id, nombreArchivo(tipoDocumento, `${nombrePersona}_${elemento.descripcionBase}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible generar el documento.");
    } finally {
      setBotonCargando(null);
    }
  }

  async function intentarGenerarFpj5(lista: string[]) {
    setError(null);
    try {
      const doc = await api.post<DocumentoGenerado>(`/procedimientos/${id}/documentos/fpj5-informe-captura`, {
        aclaraciones: lista,
      });
      setGenerandoFpj5(false);
      setPreguntaFpj5(null);
      setAclaracionesFpj5([]);
      await cargarTodo();
      await descargar(doc.id, nombreArchivo("FPJ5"));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const cuerpo = err.cuerpo as { aclaracionRequerida?: boolean; pregunta?: string } | null;
        if (cuerpo?.aclaracionRequerida && cuerpo.pregunta) {
          setPreguntaFpj5(cuerpo.pregunta);
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "No fue posible generar el FPJ-5.");
      setGenerandoFpj5(false);
      setPreguntaFpj5(null);
    }
  }

  function iniciarFpj5() {
    setGenerandoFpj5(true);
    setAclaracionesFpj5([]);
    void intentarGenerarFpj5([]);
  }

  function enviarAclaracionFpj5() {
    if (!respuestaFpj5.trim()) return;
    const nuevas = [...aclaracionesFpj5, respuestaFpj5.trim()];
    setAclaracionesFpj5(nuevas);
    setRespuestaFpj5("");
    void intentarGenerarFpj5(nuevas);
  }

  function cancelarFpj5() {
    setGenerandoFpj5(false);
    setPreguntaFpj5(null);
    setAclaracionesFpj5([]);
    setRespuestaFpj5("");
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  const elementosConDueno = intervinientes.flatMap((p) =>
    (elementosPorPersona[p.id] ?? []).map((e) => ({ elemento: e, persona: p })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-institucional-950">7. Documentos</h1>
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

      <Seccion titulo="Acta de Incautación" descripcion="Uno por cada interviniente que tenga elementos incautados a su cargo.">
        {intervinientes.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay intervinientes registrados.</p>
        ) : (
          intervinientes.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {p.primerNombre} {p.primerApellido}
              </span>
              <BotonGenerar
                cargando={botonCargando === `ACTA-${p.id}`}
                onClick={() => generarPorCapturado("acta-incautacion", "ACTA", p)}
              >
                Generar y descargar
              </BotonGenerar>
            </div>
          ))
        )}
      </Seccion>

      <Seccion titulo="FPJ-6 — Acta de Derechos" descripcion="Uno por cada interviniente (Capturado o Aprehendido).">
        {intervinientes.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay intervinientes registrados.</p>
        ) : (
          intervinientes.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {p.primerNombre} {p.primerApellido}
              </span>
              <BotonGenerar
                cargando={botonCargando === `FPJ6-${p.id}`}
                onClick={() => generarPorCapturado("fpj6-acta-derechos", "FPJ6", p)}
              >
                Generar y descargar
              </BotonGenerar>
            </div>
          ))
        )}
      </Seccion>

      <Seccion titulo="FPJ-5 — Informe de Captura" descripcion="Uno solo por todo el procedimiento. La narración de los hechos se redacta automáticamente; si al sistema le falta información, te lo va a preguntar aquí mismo antes de generar el documento.">
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
      </Seccion>

      <Seccion titulo="FPJ-7 — Rótulo EMP/EF" descripcion="Uno por cada elemento incautado.">
        {elementosConDueno.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Aún no hay elementos incautados registrados.</p>
        ) : (
          elementosConDueno.map(({ elemento, persona }) => (
            <div key={elemento.id} className="flex items-center justify-between rounded-md border border-institucional-100 px-3 py-2">
              <span className="font-sans text-sm text-institucional-950">
                {ETIQUETA_TIPO_ELEMENTO[elemento.tipoElemento]} — {elemento.descripcionBase}
                <span className="text-institucional-700"> ({persona.primerNombre} {persona.primerApellido})</span>
              </span>
              <BotonGenerar
                cargando={botonCargando === `FPJ7-${elemento.id}`}
                onClick={() =>
                  generarPorElemento("fpj7-rotulo", "FPJ7", elemento, `${persona.primerNombre}_${persona.primerApellido}`)
                }
              >
                Generar y descargar
              </BotonGenerar>
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
                <span className="text-institucional-700"> ({persona.primerNombre} {persona.primerApellido})</span>
              </span>
              <BotonGenerar
                cargando={botonCargando === `FPJ8-${elemento.id}`}
                onClick={() =>
                  generarPorElemento("fpj8-cadena-custodia", "FPJ8", elemento, `${persona.primerNombre}_${persona.primerApellido}`)
                }
              >
                Generar y descargar
              </BotonGenerar>
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
