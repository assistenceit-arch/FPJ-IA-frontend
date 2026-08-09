"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { payloadToken } from "@/lib/auth";
import { descargarArchivo } from "@/lib/descargarArchivo";

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

interface PagoPendiente {
  id: string;
  valor: string | number;
  createdAt: string;
  procedimiento: {
    id: string;
    numeroInterno: string | null;
    tipoProcedimiento: string;
    usuario: { nombres: string; apellidos: string; correo: string; telefono: string | null };
  };
}

interface ProcedimientoAdmin {
  id: string;
  numeroInterno: string | null;
  tipoProcedimiento: string;
  estado: string;
  exoneradoPago: boolean;
  fechaCreacion: string;
  usuario: { nombres: string; apellidos: string | null; correo: string };
  pago: { estadoPago: string } | null;
}

interface UsuarioAdmin {
  id: string;
  nombres: string;
  apellidos: string | null;
  identificacion: string | null;
  correo: string;
  telefono: string | null;
  rol: "FUNCIONARIO" | "ADMINISTRADOR";
  activo: boolean;
  correoVerificado: boolean;
}

interface Paginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
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

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-institucional-950">{titulo}</h2>
      {descripcion && <p className="mt-1 font-sans text-sm text-institucional-700">{descripcion}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Paginador({
  pagina,
  totalPaginas,
  onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-institucional-100 pt-3">
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
        className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Anterior
      </button>
      <span className="font-sans text-xs text-institucional-700">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas}
        className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente →
      </button>
    </div>
  );
}

function formatearValor(valor: string | number): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(numero)) return String(valor);
  return numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function PanelAdministracion() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Configuración de valores
  const [valorEstandar, setValorEstandar] = useState("");
  const [valorComplejo, setValorComplejo] = useState("");
  const [nequiHabilitado, setNequiHabilitado] = useState(false);
  const [nequiNumero, setNequiNumero] = useState("");
  const [cuentaHabilitada, setCuentaHabilitada] = useState(false);
  const [cuentaBanco, setCuentaBanco] = useState("");
  const [cuentaTipo, setCuentaTipo] = useState("Ahorros");
  const [cuentaNumero, setCuentaNumero] = useState("");
  const [tarjetaHabilitada, setTarjetaHabilitada] = useState(false);
  const [tarjetaInstrucciones, setTarjetaInstrucciones] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoCorreo, setContactoCorreo] = useState("");
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  // Pagos pendientes
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [descargandoComprobante, setDescargandoComprobante] = useState<string | null>(null);

  // Procedimientos / exoneración
  const [busqueda, setBusqueda] = useState("");
  const [procedimientos, setProcedimientos] = useState<ProcedimientoAdmin[]>([]);
  const [paginaProcedimientos, setPaginaProcedimientos] = useState(1);
  const [totalPaginasProcedimientos, setTotalPaginasProcedimientos] = useState(1);
  const [buscando, setBuscando] = useState(false);
  const [exonerando, setExonerando] = useState<string | null>(null);

  // Usuarios / roles / bloqueo
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [totalPaginasUsuarios, setTotalPaginasUsuarios] = useState(1);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);
  const [cambiandoEstado, setCambiandoEstado] = useState<string | null>(null);

  // Crear usuario
  const [nuevoNombres, setNuevoNombres] = useState("");
  const [nuevoApellidos, setNuevoApellidos] = useState("");
  const [nuevaIdentificacion, setNuevaIdentificacion] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState<"FUNCIONARIO" | "ADMINISTRADOR">("FUNCIONARIO");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  useEffect(() => {
    const payload = payloadToken();
    if (payload?.rol !== "ADMINISTRADOR") {
      setAutorizado(false);
      return;
    }
    setAutorizado(true);
  }, []);

  async function cargarConfiguracion() {
    try {
      const config = await api.get<ConfiguracionPagos | null>("/configuracion-pagos");
      if (config) {
        setValorEstandar(String(config.valorEstandar));
        setValorComplejo(String(config.valorComplejo));
        setNequiHabilitado(config.nequiHabilitado);
        setNequiNumero(config.nequiNumero ?? "");
        setCuentaHabilitada(config.cuentaHabilitada);
        setCuentaBanco(config.cuentaBanco ?? "");
        setCuentaTipo(config.cuentaTipo ?? "Ahorros");
        setCuentaNumero(config.cuentaNumero ?? "");
        setTarjetaHabilitada(config.tarjetaHabilitada);
        setTarjetaInstrucciones(config.tarjetaInstrucciones ?? "");
        setContactoTelefono(config.contactoTelefono ?? "");
        setContactoCorreo(config.contactoCorreo ?? "");
      }
    } catch {
      // sin configuración todavía — se deja en blanco, el admin la crea
    }
  }

  async function cargarPagosPendientes() {
    try {
      const lista = await api.get<PagoPendiente[]>("/admin/pagos/pendientes");
      setPagosPendientes(lista);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar los pagos pendientes.");
    }
  }

  async function cargarUsuarios(pagina = paginaUsuarios) {
    try {
      const respuesta = await api.get<Paginado<UsuarioAdmin>>(`/admin/usuarios?pagina=${pagina}`);
      setUsuarios(respuesta.datos);
      setPaginaUsuarios(respuesta.pagina);
      setTotalPaginasUsuarios(respuesta.totalPaginas);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar los usuarios.");
    }
  }

  async function buscarProcedimientos(evento?: FormEvent, pagina = 1) {
    evento?.preventDefault();
    setBuscando(true);
    setError(null);
    try {
      const parametros = new URLSearchParams({ pagina: String(pagina) });
      if (busqueda.trim()) parametros.set("busqueda", busqueda.trim());
      const respuesta = await api.get<Paginado<ProcedimientoAdmin>>(`/admin/procedimientos?${parametros}`);
      setProcedimientos(respuesta.datos);
      setPaginaProcedimientos(respuesta.pagina);
      setTotalPaginasProcedimientos(respuesta.totalPaginas);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible buscar procedimientos.");
    } finally {
      setBuscando(false);
    }
  }

  useEffect(() => {
    if (autorizado !== true) return;
    cargarConfiguracion();
    cargarPagosPendientes();
    cargarUsuarios();
    buscarProcedimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado]);

  async function guardarConfiguracion(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardandoConfig(true);
    try {
      await api.put("/configuracion-pagos", {
        valorEstandar: Number(valorEstandar),
        valorComplejo: Number(valorComplejo),
        nequiHabilitado,
        nequiNumero: nequiNumero.trim() || undefined,
        cuentaHabilitada,
        cuentaBanco: cuentaBanco.trim() || undefined,
        cuentaTipo: cuentaTipo.trim() || undefined,
        cuentaNumero: cuentaNumero.trim() || undefined,
        tarjetaHabilitada,
        tarjetaInstrucciones: tarjetaInstrucciones.trim() || undefined,
        contactoTelefono: contactoTelefono.trim() || undefined,
        contactoCorreo: contactoCorreo.trim() || undefined,
      });
      setMensaje("Valores de pago actualizados.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible guardar la configuración.");
    } finally {
      setGuardandoConfig(false);
    }
  }

  async function verificarPagoPendiente(procedimientoId: string, estadoPago: "Verificado" | "Rechazado") {
    setError(null);
    setProcesando(`${procedimientoId}-${estadoPago}`);
    try {
      await api.patch(`/procedimientos/${procedimientoId}/pago/verificar`, { estadoPago });
      await cargarPagosPendientes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible actualizar el pago.");
    } finally {
      setProcesando(null);
    }
  }

  async function descargarComprobantePendiente(procedimientoId: string) {
    setDescargandoComprobante(procedimientoId);
    const ok = await descargarArchivo(
      `/procedimientos/${procedimientoId}/pago/comprobante`,
      `comprobante-${procedimientoId}`,
    );
    if (!ok) setError("No fue posible descargar el comprobante.");
    setDescargandoComprobante(null);
  }

  async function alternarExoneracion(procedimiento: ProcedimientoAdmin) {
    setError(null);
    setExonerando(procedimiento.id);
    try {
      await api.patch(`/admin/procedimientos/${procedimiento.id}/exoneracion`, {
        exonerado: !procedimiento.exoneradoPago,
      });
      await buscarProcedimientos(undefined, paginaProcedimientos);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible actualizar la exoneración.");
    } finally {
      setExonerando(null);
    }
  }

  async function cambiarRol(usuario: UsuarioAdmin, rol: "FUNCIONARIO" | "ADMINISTRADOR") {
    if (rol === usuario.rol) return;
    setError(null);
    setCambiandoRol(usuario.id);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/rol`, { rol });
      await cargarUsuarios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cambiar el rol.");
    } finally {
      setCambiandoRol(null);
    }
  }

  async function cambiarEstadoUsuario(usuario: UsuarioAdmin) {
    setError(null);
    setCambiandoEstado(usuario.id);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/estado`, { activo: !usuario.activo });
      await cargarUsuarios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cambiar el estado del usuario.");
    } finally {
      setCambiandoEstado(null);
    }
  }

  async function crearUsuario(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCreandoUsuario(true);
    try {
      await api.post("/usuarios", {
        nombres: nuevoNombres,
        apellidos: nuevoApellidos,
        identificacion: nuevaIdentificacion,
        correo: nuevoCorreo,
        password: nuevaPassword,
        rol: nuevoRol,
      });
      setMensaje(`Usuario ${nuevoCorreo} creado.`);
      setNuevoNombres("");
      setNuevoApellidos("");
      setNuevaIdentificacion("");
      setNuevoCorreo("");
      setNuevaPassword("");
      setNuevoRol("FUNCIONARIO");
      await cargarUsuarios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible crear el usuario.");
    } finally {
      setCreandoUsuario(false);
    }
  }

  if (autorizado === null) {
    return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;
  }

  if (autorizado === false) {
    return (
      <div className="rounded-lg border border-institucional-100 bg-white p-6 text-center shadow-sm">
        <p className="font-sans text-sm text-institucional-800">
          Esta sección es exclusiva para administradores.
        </p>
        <button
          onClick={() => router.push("/procedimientos")}
          className="mt-4 rounded-md bg-acento px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
        >
          Volver a mis procedimientos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push("/procedimientos")}
          className="mb-3 font-sans text-sm text-institucional-700 hover:underline"
        >
          ← Volver a mis procedimientos
        </button>
        <h1 className="font-display text-2xl text-institucional-950">Panel de administración</h1>
        <p className="mt-1 font-sans text-sm text-institucional-700">
          Configuración de pagos, verificación centralizada, exoneraciones y gestión de usuarios.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-estado-error/10 px-3 py-2.5 font-sans text-sm text-estado-error">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-md bg-estado-completo/10 px-3 py-2.5 font-sans text-sm text-estado-completo">
          {mensaje}
        </p>
      )}

      {/* ── Configuración de valores ── */}
      <Seccion titulo="Valores del servicio" descripcion="Se aplican automáticamente al registrar un pago, según el tipo de procedimiento.">
        <form onSubmit={guardarConfiguracion} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Procedimiento estándar" requerido>
            <input
              required
              type="number"
              min={0}
              className={claseInput}
              value={valorEstandar}
              onChange={(e) => setValorEstandar(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Procedimiento complejo" requerido>
            <input
              required
              type="number"
              min={0}
              className={claseInput}
              value={valorComplejo}
              onChange={(e) => setValorComplejo(e.target.value)}
            />
          </Campo>

          <div className="sm:col-span-2 border-t border-institucional-100 pt-4">
            <h3 className="font-display text-base text-institucional-950">Métodos de pago</h3>
            <p className="mt-1 font-sans text-xs text-institucional-700">
              Habilita cada método con el interruptor y edita sus datos. Solo los habilitados se
              muestran al funcionario en el Bloque 8.
            </p>
          </div>

          {/* Nequi */}
          <div className="sm:col-span-2 rounded-md border border-institucional-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-medium text-institucional-950">Nequi</span>
              <button
                type="button"
                onClick={() => setNequiHabilitado((v) => !v)}
                className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                  nequiHabilitado
                    ? "bg-estado-completo text-white"
                    : "bg-institucional-100 text-institucional-700"
                }`}
              >
                {nequiHabilitado ? "Habilitado" : "Deshabilitado"}
              </button>
            </div>
            {nequiHabilitado && (
              <div className="mt-3">
                <Campo etiqueta="Número">
                  <input
                    className={claseInput}
                    placeholder="300 000 0000"
                    value={nequiNumero}
                    onChange={(e) => setNequiNumero(e.target.value)}
                  />
                </Campo>
              </div>
            )}
          </div>

          {/* Cuenta bancaria */}
          <div className="sm:col-span-2 rounded-md border border-institucional-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-medium text-institucional-950">Cuenta bancaria</span>
              <button
                type="button"
                onClick={() => setCuentaHabilitada((v) => !v)}
                className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                  cuentaHabilitada
                    ? "bg-estado-completo text-white"
                    : "bg-institucional-100 text-institucional-700"
                }`}
              >
                {cuentaHabilitada ? "Habilitado" : "Deshabilitado"}
              </button>
            </div>
            {cuentaHabilitada && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Campo etiqueta="Banco">
                  <input
                    className={claseInput}
                    placeholder="Bancolombia"
                    value={cuentaBanco}
                    onChange={(e) => setCuentaBanco(e.target.value)}
                  />
                </Campo>
                <Campo etiqueta="Tipo de cuenta">
                  <select
                    className={claseInput}
                    value={cuentaTipo}
                    onChange={(e) => setCuentaTipo(e.target.value)}
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </Campo>
                <Campo etiqueta="Número de cuenta">
                  <input
                    className={claseInput}
                    value={cuentaNumero}
                    onChange={(e) => setCuentaNumero(e.target.value)}
                  />
                </Campo>
              </div>
            )}
          </div>

          {/* Tarjeta débito/crédito */}
          <div className="sm:col-span-2 rounded-md border border-institucional-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-medium text-institucional-950">
                Tarjeta débito o crédito
              </span>
              <button
                type="button"
                onClick={() => setTarjetaHabilitada((v) => !v)}
                className={`rounded-full px-3 py-1 font-sans text-xs font-semibold transition-colors ${
                  tarjetaHabilitada
                    ? "bg-estado-completo text-white"
                    : "bg-institucional-100 text-institucional-700"
                }`}
              >
                {tarjetaHabilitada ? "Habilitado" : "Deshabilitado"}
              </button>
            </div>
            {tarjetaHabilitada && (
              <div className="mt-3">
                <Campo etiqueta="Instrucciones (opcional)">
                  <textarea
                    rows={2}
                    className={claseInput}
                    placeholder="Ej. enlace de pago, o indicaciones para pagar con tarjeta en la estación…"
                    value={tarjetaInstrucciones}
                    onChange={(e) => setTarjetaInstrucciones(e.target.value)}
                  />
                </Campo>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 border-t border-institucional-100 pt-4">
            <h3 className="font-display text-base text-institucional-950">
              Los funcionarios te podrán contactar a
            </h3>
            <p className="mt-1 font-sans text-xs text-institucional-700">
              Se muestran en el Bloque 8 de procedimientos complejos, tras adjuntar el comprobante,
              por si un asesor no se ha comunicado en 15 minutos.
            </p>
          </div>
          <Campo etiqueta="Teléfono de contacto">
            <input
              className={claseInput}
              placeholder="300 000 0000"
              value={contactoTelefono}
              onChange={(e) => setContactoTelefono(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Correo de contacto">
            <input
              type="email"
              className={claseInput}
              placeholder="asesoria@fpjia.com"
              value={contactoCorreo}
              onChange={(e) => setContactoCorreo(e.target.value)}
            />
          </Campo>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={guardandoConfig}
              className="rounded-md bg-acento px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardandoConfig ? "Guardando…" : "Guardar valores"}
            </button>
          </div>
        </form>
      </Seccion>

      {/* ── Pagos pendientes ── */}
      <Seccion titulo="Pagos pendientes de verificación" descripcion="De todos los funcionarios, sin tener que entrar procedimiento por procedimiento.">
        {pagosPendientes.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">No hay pagos pendientes por revisar.</p>
        ) : (
          pagosPendientes.map((p) => (
            <div key={p.id} className="rounded-md border border-institucional-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-sans text-sm font-medium text-institucional-950">
                    {p.procedimiento.numeroInterno ?? p.procedimiento.id} — {p.procedimiento.tipoProcedimiento}
                    {p.procedimiento.tipoProcedimiento === "COMPLEJO" && (
                      <span className="ml-2 rounded-full bg-acento/15 px-2 py-0.5 text-xs font-semibold text-acento">
                        Requiere asesoría
                      </span>
                    )}
                  </p>
                  <p className="font-sans text-xs text-institucional-700">
                    {p.procedimiento.usuario.nombres} {p.procedimiento.usuario.apellidos} ·{" "}
                    {p.procedimiento.usuario.correo}
                    {p.procedimiento.usuario.telefono && ` · ${p.procedimiento.usuario.telefono}`} ·{" "}
                    {formatearValor(p.valor)} · registrado el{" "}
                    {new Date(p.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => descargarComprobantePendiente(p.procedimiento.id)}
                    disabled={descargandoComprobante === p.procedimiento.id}
                    className="rounded-md border border-institucional-100 px-3 py-1.5 font-sans text-xs text-institucional-800 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {descargandoComprobante === p.procedimiento.id ? "Descargando…" : "Ver comprobante"}
                  </button>
                  <button
                    type="button"
                    onClick={() => verificarPagoPendiente(p.procedimiento.id, "Verificado")}
                    disabled={procesando !== null}
                    className="rounded-md bg-estado-completo px-3 py-1.5 font-sans text-xs font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {procesando === `${p.procedimiento.id}-Verificado` ? "Aprobando…" : "Aprobar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => verificarPagoPendiente(p.procedimiento.id, "Rechazado")}
                    disabled={procesando !== null}
                    className="rounded-md border border-estado-error px-3 py-1.5 font-sans text-xs font-semibold text-estado-error transition-colors hover:bg-estado-error/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {procesando === `${p.procedimiento.id}-Rechazado` ? "Rechazando…" : "Rechazar"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </Seccion>

      {/* ── Procedimientos / exoneración ── */}
      <Seccion titulo="Exonerar procedimientos del pago" descripcion="Permite generar documentos sin pago verificado para un procedimiento puntual.">
        <form onSubmit={(e) => buscarProcedimientos(e, 1)} className="flex gap-2">
          <input
            className={claseInput}
            placeholder="Buscar por número interno (ej. EST-2026-000003)…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            type="submit"
            disabled={buscando}
            className="shrink-0 rounded-md border border-institucional-100 px-4 py-2 font-sans text-sm text-institucional-800 transition-colors hover:bg-institucional-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {procedimientos.length === 0 ? (
          <p className="font-sans text-sm text-institucional-700">Sin resultados.</p>
        ) : (
          <div className="space-y-2">
            {procedimientos.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-institucional-100 p-3">
                <div>
                  <p className="font-sans text-sm font-medium text-institucional-950">
                    {p.numeroInterno ?? p.id} — {p.tipoProcedimiento}
                    {p.exoneradoPago && (
                      <span className="ml-2 rounded-full bg-acento/15 px-2 py-0.5 text-xs font-semibold text-acento">
                        Exonerado
                      </span>
                    )}
                  </p>
                  <p className="font-sans text-xs text-institucional-700">
                    {p.usuario.nombres} {p.usuario.apellidos} · pago:{" "}
                    {p.pago ? p.pago.estadoPago : "sin registrar"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alternarExoneracion(p)}
                  disabled={exonerando === p.id}
                  className={`rounded-md px-3 py-1.5 font-sans text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    p.exoneradoPago
                      ? "border border-institucional-100 text-institucional-800 hover:bg-institucional-50"
                      : "bg-acento text-white hover:bg-acento-hover"
                  }`}
                >
                  {exonerando === p.id
                    ? "Guardando…"
                    : p.exoneradoPago
                      ? "Quitar exoneración"
                      : "Exonerar de pago"}
                </button>
              </div>
            ))}
          </div>
        )}
        <Paginador
          pagina={paginaProcedimientos}
          totalPaginas={totalPaginasProcedimientos}
          onCambiar={(pagina) => buscarProcedimientos(undefined, pagina)}
        />
      </Seccion>
      <Seccion titulo="Usuarios y roles" descripcion="Cambia el rol o bloquea el acceso de un usuario (por ejemplo, ante un uso irregular de la aplicación).">
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-institucional-100 p-3">
              <div>
                <p className="font-sans text-sm font-medium text-institucional-950">
                  {u.nombres} {u.apellidos}
                  {!u.activo && (
                    <span className="ml-2 rounded-full bg-estado-error/15 px-2 py-0.5 text-xs font-semibold text-estado-error">
                      Bloqueado
                    </span>
                  )}
                  {!u.correoVerificado && (
                    <span className="ml-2 rounded-full bg-estado-pendiente/15 px-2 py-0.5 text-xs font-semibold text-estado-pendiente">
                      Correo sin verificar
                    </span>
                  )}
                </p>
                <p className="font-sans text-xs text-institucional-700">
                  {u.correo}
                  {u.telefono && ` · ${u.telefono}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.rol}
                  disabled={cambiandoRol === u.id}
                  onChange={(e) => cambiarRol(u, e.target.value as "FUNCIONARIO" | "ADMINISTRADOR")}
                  className="rounded-md border border-institucional-100 bg-white px-3 py-1.5 font-sans text-xs text-institucional-950 outline-none focus:border-acento disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="FUNCIONARIO">Funcionario</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
                <button
                  type="button"
                  onClick={() => cambiarEstadoUsuario(u)}
                  disabled={cambiandoEstado === u.id}
                  className={`rounded-md px-3 py-1.5 font-sans text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    u.activo
                      ? "border border-estado-error text-estado-error hover:bg-estado-error/10"
                      : "bg-estado-completo text-white hover:opacity-90"
                  }`}
                >
                  {cambiandoEstado === u.id ? "Guardando…" : u.activo ? "Bloquear" : "Desbloquear"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <Paginador
          pagina={paginaUsuarios}
          totalPaginas={totalPaginasUsuarios}
          onCambiar={(pagina) => cargarUsuarios(pagina)}
        />
      </Seccion>

      {/* ── Crear usuario ── */}
      <Seccion titulo="Crear usuario" descripcion="Ahora solo un administrador puede crear cuentas nuevas.">
        <form onSubmit={crearUsuario} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombres" requerido>
            <input required className={claseInput} value={nuevoNombres} onChange={(e) => setNuevoNombres(e.target.value)} />
          </Campo>
          <Campo etiqueta="Apellidos" requerido>
            <input required className={claseInput} value={nuevoApellidos} onChange={(e) => setNuevoApellidos(e.target.value)} />
          </Campo>
          <Campo etiqueta="Identificación" requerido>
            <input required className={claseInput} value={nuevaIdentificacion} onChange={(e) => setNuevaIdentificacion(e.target.value)} />
          </Campo>
          <Campo etiqueta="Correo institucional" requerido>
            <input required type="email" className={claseInput} value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} />
          </Campo>
          <Campo etiqueta="Contraseña temporal" requerido>
            <input
              required
              type="password"
              minLength={8}
              className={claseInput}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Rol" requerido>
            <select
              className={claseInput}
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value as "FUNCIONARIO" | "ADMINISTRADOR")}
            >
              <option value="FUNCIONARIO">Funcionario</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </Campo>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creandoUsuario}
              className="rounded-md bg-acento px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creandoUsuario ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      </Seccion>
    </div>
  );
}
