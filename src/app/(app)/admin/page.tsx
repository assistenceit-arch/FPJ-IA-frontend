"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { payloadToken } from "@/lib/auth";
import { descargarArchivo } from "@/lib/descargarArchivo";

interface ConfiguracionPagos {
  valorEstandar: string | number;
  valorComplejo: string | number;
}

interface PagoPendiente {
  id: string;
  valor: string | number;
  createdAt: string;
  procedimiento: {
    id: string;
    numeroInterno: string | null;
    tipoProcedimiento: string;
    usuario: { nombres: string; apellidos: string; correo: string };
  };
}

interface ProcedimientoAdmin {
  id: string;
  numeroInterno: string | null;
  tipoProcedimiento: string;
  estado: string;
  exoneradoPago: boolean;
  fechaCreacion: string;
  usuario: { nombres: string; apellidos: string; correo: string };
  pago: { estadoPago: string } | null;
}

interface UsuarioAdmin {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo: string;
  rol: "FUNCIONARIO" | "ADMINISTRADOR";
  activo: boolean;
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
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  // Pagos pendientes
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [descargandoComprobante, setDescargandoComprobante] = useState<string | null>(null);

  // Procedimientos / exoneración
  const [busqueda, setBusqueda] = useState("");
  const [procedimientos, setProcedimientos] = useState<ProcedimientoAdmin[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [exonerando, setExonerando] = useState<string | null>(null);

  // Usuarios / roles
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);

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

  async function cargarUsuarios() {
    try {
      const lista = await api.get<UsuarioAdmin[]>("/admin/usuarios");
      setUsuarios(lista);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar los usuarios.");
    }
  }

  async function buscarProcedimientos(evento?: FormEvent) {
    evento?.preventDefault();
    setBuscando(true);
    setError(null);
    try {
      const query = busqueda.trim() ? `?busqueda=${encodeURIComponent(busqueda.trim())}` : "";
      const lista = await api.get<ProcedimientoAdmin[]>(`/admin/procedimientos${query}`);
      setProcedimientos(lista);
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
      await buscarProcedimientos();
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
                  </p>
                  <p className="font-sans text-xs text-institucional-700">
                    {p.procedimiento.usuario.nombres} {p.procedimiento.usuario.apellidos} (
                    {p.procedimiento.usuario.correo}) · {formatearValor(p.valor)} · registrado el{" "}
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
        <form onSubmit={buscarProcedimientos} className="flex gap-2">
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
      </Seccion>

      {/* ── Usuarios / roles ── */}
      <Seccion titulo="Usuarios y roles">
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-institucional-100 p-3">
              <div>
                <p className="font-sans text-sm font-medium text-institucional-950">
                  {u.nombres} {u.apellidos}
                </p>
                <p className="font-sans text-xs text-institucional-700">{u.correo}</p>
              </div>
              <select
                value={u.rol}
                disabled={cambiandoRol === u.id}
                onChange={(e) => cambiarRol(u, e.target.value as "FUNCIONARIO" | "ADMINISTRADOR")}
                className="rounded-md border border-institucional-100 bg-white px-3 py-1.5 font-sans text-xs text-institucional-950 outline-none focus:border-acento disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="FUNCIONARIO">Funcionario</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>
          ))}
        </div>
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
