"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { payloadToken } from "@/lib/auth";
import { descargarArchivo } from "@/lib/descargarArchivo";

interface Pago {
  id: string;
  procedimientoId: string;
  valor: string | number;
  comprobantePago: string | null;
  estadoPago: "Pendiente" | "Verificado" | "Rechazado";
  createdAt: string;
  updatedAt: string;
}

interface ConfiguracionPagos {
  valorEstandar: string | number;
  valorComplejo: string | number;
  nequiHabilitado: boolean;
  nequiNumero: string | null;
  cuentaHabilitada: boolean;
  cuentaBanco: string | null;
  cuentaTipo: string | null;
  cuentaNumero: string | null;
  tarjetaHabilitada: boolean;
  tarjetaInstrucciones: string | null;
  contactoTelefono: string | null;
  contactoCorreo: string | null;
}

interface ProcedimientoResumen {
  tipoProcedimiento: "ESTANDAR" | "COMPLEJO";
}

const claseInput =
  "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

const TIPOS_ACEPTADOS = ".jpg,.jpeg,.png,.webp,.pdf";

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

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-institucional-950">{titulo}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: Pago["estadoPago"] }) {
  const estilos: Record<Pago["estadoPago"], string> = {
    Pendiente: "bg-estado-pendiente/15 text-estado-pendiente",
    Verificado: "bg-estado-completo/15 text-estado-completo",
    Rechazado: "bg-estado-error/15 text-estado-error",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-sans text-xs font-semibold ${estilos[estado]}`}>
      {estado}
    </span>
  );
}

function formatearValor(valor: string | number): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function BloquePago() {
  const { id } = useParams<{ id: string }>();
  const [pago, setPago] = useState<Pago | null>(null);
  const [configuracion, setConfiguracion] = useState<ConfiguracionPagos | null>(null);
  const [procedimiento, setProcedimiento] = useState<ProcedimientoResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [esAdministrador, setEsAdministrador] = useState(false);

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const [observacion, setObservacion] = useState("");
  const [verificando, setVerificando] = useState<"Verificado" | "Rechazado" | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    setEsAdministrador(payloadToken()?.rol === "ADMINISTRADOR");
  }, []);

  async function cargar() {
    try {
      const [p, config, proc] = await Promise.all([
        api.get<Pago | null>(`/procedimientos/${id}/pago`),
        api.get<ConfiguracionPagos | null>(`/configuracion-pagos`).catch(() => null),
        api.get<ProcedimientoResumen>(`/procedimientos/${id}`).catch(() => null),
      ]);
      setPago(p);
      setConfiguracion(config);
      setProcedimiento(proc);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar el estado del pago.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function registrar() {
    setError(null);

    if (!comprobante) {
      setError("Debes adjuntar el comprobante de la transferencia.");
      return;
    }

    setRegistrando(true);
    try {
      const formData = new FormData();
      formData.append("comprobante", comprobante);

      await api.postFormData(`/procedimientos/${id}/pago`, formData);
      setComprobante(null);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible registrar el pago.");
    } finally {
      setRegistrando(false);
    }
  }

  async function verificar(estadoPago: "Verificado" | "Rechazado") {
    setError(null);
    setVerificando(estadoPago);
    try {
      await api.patch(`/procedimientos/${id}/pago/verificar`, {
        estadoPago,
        observacion: observacion.trim() || undefined,
      });
      setObservacion("");
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible actualizar el pago.");
    } finally {
      setVerificando(null);
    }
  }

  async function descargarComprobante() {
    setDescargando(true);
    const ok = await descargarArchivo(`/procedimientos/${id}/pago/comprobante`, `comprobante-pago-${id}`);
    if (!ok) setError("No fue posible descargar el comprobante.");
    setDescargando(false);
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;

  const necesitaRegistrar = !pago || pago.estadoPago === "Rechazado";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-institucional-950">8. Pago</h1>
        {procedimiento?.tipoProcedimiento === "COMPLEJO" ? (
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Una vez verificado el pago por un administrador, uno de nuestros asesores especializados
            tomará contacto con usted en el menor tiempo posible.
          </p>
        ) : (
          <p className="mt-1 font-sans text-sm text-institucional-700">
            El pago debe quedar <strong>Verificado</strong> por un administrador antes de poder generar
            documentos en el Bloque 7.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-estado-error/10 px-3 py-2.5 font-sans text-sm text-estado-error">{error}</p>
      )}

      {necesitaRegistrar && configuracion && (
        <Seccion titulo="Valor a pagar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className={`rounded-md border p-4 text-center transition-opacity ${
                procedimiento?.tipoProcedimiento === "ESTANDAR"
                  ? "border-acento bg-acento/10"
                  : "border-institucional-100 opacity-40"
              }`}
            >
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-institucional-700">
                Procedimiento estándar
              </p>
              <p
                className={`mt-1 font-display text-2xl ${
                  procedimiento?.tipoProcedimiento === "ESTANDAR" ? "text-acento" : "text-institucional-700"
                }`}
              >
                {formatearValor(configuracion.valorEstandar)}
              </p>
            </div>
            <div
              className={`rounded-md border p-4 text-center transition-opacity ${
                procedimiento?.tipoProcedimiento === "COMPLEJO"
                  ? "border-acento bg-acento/10"
                  : "border-institucional-100 opacity-40"
              }`}
            >
              <p className="font-sans text-xs font-medium uppercase tracking-wide text-institucional-700">
                Procedimiento complejo
              </p>
              <p
                className={`mt-1 font-display text-2xl ${
                  procedimiento?.tipoProcedimiento === "COMPLEJO" ? "text-acento" : "text-institucional-700"
                }`}
              >
                {formatearValor(configuracion.valorComplejo)}
              </p>
            </div>
          </div>
          <p className="font-sans text-xs text-institucional-700">
            Este procedimiento está clasificado como{" "}
            <strong>{procedimiento?.tipoProcedimiento === "COMPLEJO" ? "complejo" : "estándar"}</strong>, por
            lo que el valor a pagar es el resaltado arriba.
          </p>
        </Seccion>
      )}

      {necesitaRegistrar && (
        <Seccion titulo="¿Cómo pagar?">
          <p className="font-sans text-sm text-institucional-900">
            Por favor realizar el pago para la generación y descarga de los documentos del
            procedimiento utilizando cualquiera de los siguientes métodos:
          </p>

          <div className="space-y-2">
            {configuracion?.nequiHabilitado && (
              <div className="rounded-md border border-institucional-100 p-3">
                <p className="font-sans text-sm font-medium text-institucional-950">Nequi</p>
                <p className="font-sans text-sm text-institucional-800">{configuracion.nequiNumero}</p>
              </div>
            )}
            {configuracion?.cuentaHabilitada && (
              <div className="rounded-md border border-institucional-100 p-3">
                <p className="font-sans text-sm font-medium text-institucional-950">
                  Cuenta {configuracion.cuentaTipo ?? "Ahorros"} — {configuracion.cuentaBanco}
                </p>
                <p className="font-sans text-sm text-institucional-800">{configuracion.cuentaNumero}</p>
              </div>
            )}
            {configuracion?.tarjetaHabilitada && (
              <div className="rounded-md border border-institucional-100 p-3">
                <p className="font-sans text-sm font-medium text-institucional-950">
                  Tarjeta débito o crédito
                </p>
                {configuracion.tarjetaInstrucciones && (
                  <p className="font-sans text-sm text-institucional-800">
                    {configuracion.tarjetaInstrucciones}
                  </p>
                )}
              </div>
            )}
            {configuracion &&
              !configuracion.nequiHabilitado &&
              !configuracion.cuentaHabilitada &&
              !configuracion.tarjetaHabilitada && (
                <p className="font-sans text-sm text-institucional-700">
                  Aún no hay métodos de pago configurados. Consulta con un administrador.
                </p>
              )}
          </div>

          <p className="font-sans text-sm text-institucional-900">
            Si ya realizó el pago, por favor adjunte el comprobante y en breve un administrador
            verificará y, de ser correcto, aprobará la generación de los documentos.
          </p>
        </Seccion>
      )}

      {necesitaRegistrar && (
        <Seccion titulo={pago?.estadoPago === "Rechazado" ? "Adjuntar un nuevo comprobante" : "Adjuntar comprobante de pago"}>
          {pago?.estadoPago === "Rechazado" && (
            <p className="rounded-md bg-estado-error/10 px-3 py-2.5 font-sans text-sm text-estado-error">
              El comprobante anterior fue rechazado. Adjunta uno nuevo.
            </p>
          )}
          <Campo etiqueta="Comprobante de la transferencia (imagen o PDF)" requerido>
            <input
              type="file"
              accept={TIPOS_ACEPTADOS}
              className={claseInput}
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 font-sans text-xs text-institucional-700">
              Debe verse claramente la fecha, el número de referencia y el valor del movimiento — el
              administrador revisa esos datos directamente en el archivo. JPG, PNG, WEBP o PDF —
              máximo 10 MB.
            </p>
          </Campo>
          <button
            type="button"
            onClick={registrar}
            disabled={registrando || !comprobante}
            className="rounded-md bg-acento px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registrando ? "Subiendo…" : "Adjuntar comprobante"}
          </button>
        </Seccion>
      )}

      {pago && !necesitaRegistrar && (
        <Seccion titulo="Estado del pago">
          <BadgeEstado estado={pago.estadoPago} />
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-sans text-xs text-institucional-700">Valor</dt>
              <dd className="font-sans text-sm text-institucional-950">{formatearValor(pago.valor)}</dd>
            </div>
            <div>
              <dt className="font-sans text-xs text-institucional-700">Registrado el</dt>
              <dd className="font-sans text-sm text-institucional-950">
                {new Date(pago.createdAt).toLocaleString("es-CO")}
              </dd>
            </div>
            {pago.comprobantePago && (
              <div className="sm:col-span-2">
                <dt className="font-sans text-xs text-institucional-700">Comprobante adjunto</dt>
                <dd className="mt-1">
                  <button
                    type="button"
                    onClick={descargarComprobante}
                    disabled={descargando}
                    className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {descargando ? "Descargando…" : "Descargar / ver comprobante"}
                  </button>
                </dd>
              </div>
            )}
          </dl>

          {procedimiento?.tipoProcedimiento === "COMPLEJO" && (configuracion?.contactoTelefono || configuracion?.contactoCorreo) && (
            <p className="rounded-md bg-institucional-100 px-3 py-2.5 font-sans text-sm text-institucional-800">
              En caso de que un asesor no te haya contactado transcurridos 15 minutos de tu pago, por
              favor llama al{" "}
              {configuracion.contactoTelefono && <strong>{configuracion.contactoTelefono}</strong>}
              {configuracion.contactoTelefono && configuracion.contactoCorreo && " o escribe a "}
              {configuracion.contactoCorreo && <strong>{configuracion.contactoCorreo}</strong>}.
            </p>
          )}
        </Seccion>
      )}

      {pago && pago.estadoPago === "Pendiente" && esAdministrador && (
        <Seccion titulo="Verificar pago (solo administradores)">
          <Campo etiqueta="Observación">
            <textarea
              rows={2}
              className={claseInput}
              placeholder="Opcional — motivo si vas a rechazar, o cualquier nota"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </Campo>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={verificando !== null}
              onClick={() => verificar("Verificado")}
              className="rounded-md bg-estado-completo px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verificando === "Verificado" ? "Aprobando…" : "Aprobar pago"}
            </button>
            <button
              type="button"
              disabled={verificando !== null}
              onClick={() => verificar("Rechazado")}
              className="rounded-md border border-estado-error px-4 py-2 font-sans text-sm font-semibold text-estado-error transition-colors hover:bg-estado-error/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verificando === "Rechazado" ? "Rechazando…" : "Rechazar pago"}
            </button>
          </div>
        </Seccion>
      )}

      {pago && pago.estadoPago === "Pendiente" && !esAdministrador && (
        <p className="rounded-md bg-institucional-100 px-3 py-2.5 font-sans text-xs text-institucional-800">
          El comprobante está registrado y pendiente de verificación por un administrador.
        </p>
      )}
    </div>
  );
}
