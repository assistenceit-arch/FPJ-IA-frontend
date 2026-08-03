"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import { CampoHora } from "@/components/CampoHora";

interface Capturado {
  id: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  expedicionDocumento: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  edad: number;
  genero: string;
  tipoInterviniente: "CAPTURADO" | "APREHENDIDO";
  estadoCivil: string | null;
  ocupacion: string | null;
  correo: string | null;
  direccion: string | null;
  telefono: string | null;
  senalesParticulares: string | null;
  descripcionFisicaVestimenta: string | null;
  nombrePadres: string | null;
  telefonoPadres: string | null;
  nombreAcudiente: string | null;
  parentescoAcudiente: string | null;
  telefonoAcudiente: string | null;
  participacionHechos: string | null;
  comportamientoAbordaje: string | null;
  identificacionPlena: boolean;
  formaIdentificacion: string | null;
}

interface ContactoNotificacion {
  nombre?: string;
  telefono?: string;
  comunicacionExitosa: boolean;
  horaComunicacion?: string;
  justificacionNoComunicacion?: string;
}

const CONTACTO_VACIO: ContactoNotificacion = { comunicacionExitosa: true };

function Campo({
  etiqueta,
  requerido,
  children,
}: {
  etiqueta: string;
  requerido?: boolean;
  children: React.ReactNode;
}) {
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

const claseInput =
  "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg text-institucional-950">{titulo}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function EditarInterviniente() {
  const { id, capturadoId } = useParams<{ id: string; capturadoId: string }>();
  const [cargando, setCargando] = useState(true);
  const [persona, setPersona] = useState<Capturado | null>(null);
  const [contacto, setContacto] = useState<ContactoNotificacion>(CONTACTO_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      api.get<Capturado>(`/procedimientos/${id}/capturados/${capturadoId}`),
      api
        .get<ContactoNotificacion | null>(`/procedimientos/${id}/capturados/${capturadoId}/contacto-notificacion`)
        .catch(() => null),
    ])
      .then(([p, c]) => {
        if (cancelado) return;
        setPersona(p);
        if (c) {
          setContacto(
            soloClaves(c, [
              "nombre",
              "telefono",
              "comunicacionExitosa",
              "horaComunicacion",
              "justificacionNoComunicacion",
            ]),
          );
        }
        setCargando(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar el interviniente.");
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id, capturadoId]);

  const guardarPersona = useCallback(
    async (datos: Capturado | null) => {
      if (!datos) return;
      const resto = soloClaves(datos, [
        "primerNombre",
        "segundoNombre",
        "primerApellido",
        "segundoApellido",
        "tipoDocumento",
        "numeroDocumento",
        "expedicionDocumento",
        "lugarNacimiento",
        "genero",
        "estadoCivil",
        "ocupacion",
        "correo",
        "direccion",
        "telefono",
        "senalesParticulares",
        "descripcionFisicaVestimenta",
        "nombrePadres",
        "telefonoPadres",
        "nombreAcudiente",
        "parentescoAcudiente",
        "telefonoAcudiente",
        "participacionHechos",
        "comportamientoAbordaje",
        "identificacionPlena",
        "formaIdentificacion",
      ]);
      // fechaNacimiento y edadManual son mutuamente excluyentes (opción
      // "No aporta fecha de nacimiento"); nunca se envían los dos juntos.
      const nacimiento =
        datos.fechaNacimiento === null
          ? { edadManual: datos.edad }
          : { fechaNacimiento: datos.fechaNacimiento };
      try {
        await api.patch(`/procedimientos/${id}/capturados/${capturadoId}`, { ...resto, ...nacimiento });
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar.");
        throw err;
      }
    },
    [id, capturadoId],
  );
  const { estado: estadoPersona } = useAutoguardado(persona, guardarPersona, { activo: !cargando });

  const guardarContacto = useCallback(
    async (datos: ContactoNotificacion) => {
      if (datos.comunicacionExitosa === false && !datos.justificacionNoComunicacion?.trim()) return;
      await api.put(`/procedimientos/${id}/capturados/${capturadoId}/contacto-notificacion`, datos);
    },
    [id, capturadoId],
  );
  const { estado: estadoContacto } = useAutoguardado(contacto, guardarContacto, { activo: !cargando });

  async function eliminarInterviniente() {
    if (!confirm("¿Eliminar este interviniente? Esta acción no se puede deshacer.")) return;
    setEliminando(true);
    try {
      await api.delete(`/procedimientos/${id}/capturados/${capturadoId}`);
      window.location.href = `/procedimientos/${id}/intervinientes`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible eliminar.");
      setEliminando(false);
    }
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;
  if (!persona) {
    return (
      <p role="alert" className="font-sans text-sm text-estado-error">
        {error ?? "Interviniente no encontrado."}
      </p>
    );
  }

  const p = persona;
  const set = (cambios: Partial<Capturado>) => setPersona({ ...p, ...cambios });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/procedimientos/${id}/intervinientes`}
            className="font-sans text-sm text-institucional-700 hover:underline"
          >
            ← Intervinientes
          </Link>
          <h1 className="mt-1 font-display text-2xl text-institucional-950">
            {p.primerNombre} {p.primerApellido}
          </h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            {p.tipoInterviniente === "APREHENDIDO" ? "Aprehendido" : "Capturado"} · {p.edad} años (
            {p.fechaNacimiento === null ? "edad aportada manualmente" : "calculado automáticamente"})
          </p>
        </div>
        <IndicadorGuardado estado={estadoPersona} />
      </div>

      {error && (
        <p role="alert" className="font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <Seccion titulo="Identificación">
        <Campo etiqueta="Tipo de documento">
          <select
            className={claseInput}
            value={p.tipoDocumento ?? ""}
            onChange={(e) => set({ tipoDocumento: e.target.value })}
          >
            <option value="">Selecciona…</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
            <option value="NINGUNO">No porta documento</option>
          </select>
        </Campo>
        <Campo etiqueta="Número de documento">
          <input
            className={claseInput}
            value={p.numeroDocumento ?? ""}
            onChange={(e) => set({ numeroDocumento: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Lugar de expedición">
          <input
            className={claseInput}
            value={p.expedicionDocumento ?? ""}
            onChange={(e) => set({ expedicionDocumento: e.target.value })}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Información personal">
        <Campo etiqueta="Primer nombre" requerido>
          <input
            className={claseInput}
            value={p.primerNombre}
            onChange={(e) => set({ primerNombre: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Segundo nombre">
          <input
            className={claseInput}
            value={p.segundoNombre ?? ""}
            onChange={(e) => set({ segundoNombre: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Primer apellido" requerido>
          <input
            className={claseInput}
            value={p.primerApellido}
            onChange={(e) => set({ primerApellido: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Segundo apellido">
          <input
            className={claseInput}
            value={p.segundoApellido ?? ""}
            onChange={(e) => set({ segundoApellido: e.target.value })}
          />
        </Campo>
        <div className="sm:col-span-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-sans text-sm font-medium text-institucional-900">
              Fecha de nacimiento
              {p.fechaNacimiento !== null && <span className="text-estado-error"> *</span>}
            </span>
            <label className="flex items-center gap-2 font-sans text-xs text-institucional-700">
              <input
                type="checkbox"
                checked={p.fechaNacimiento === null}
                onChange={(e) => {
                  if (e.target.checked) {
                    set({ fechaNacimiento: null });
                  } else {
                    set({ fechaNacimiento: "" });
                  }
                }}
              />
              No aporta
            </label>
          </div>
          {p.fechaNacimiento === null ? (
            <input
              type="number"
              min={0}
              max={120}
              placeholder="Edad aproximada, ej. 16"
              className={claseInput}
              value={p.edad}
              onChange={(e) => set({ edad: Number(e.target.value) })}
            />
          ) : (
            <input
              type="date"
              className={claseInput}
              value={p.fechaNacimiento.slice(0, 10)}
              onChange={(e) => set({ fechaNacimiento: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })}
            />
          )}
        </div>
        <Campo etiqueta="Lugar de nacimiento">
          <input
            className={claseInput}
            value={p.lugarNacimiento ?? ""}
            onChange={(e) => set({ lugarNacimiento: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Género" requerido>
          <select className={claseInput} value={p.genero} onChange={(e) => set({ genero: e.target.value })}>
            <option>Masculino</option>
            <option>Femenino</option>
          </select>
        </Campo>
        <Campo etiqueta="Estado civil">
          <input
            className={claseInput}
            value={p.estadoCivil ?? ""}
            onChange={(e) => set({ estadoCivil: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Ocupación u oficio">
          <input
            className={claseInput}
            value={p.ocupacion ?? ""}
            onChange={(e) => set({ ocupacion: e.target.value })}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Información de contacto">
        <Campo etiqueta="Dirección">
          <input
            className={claseInput}
            value={p.direccion ?? ""}
            onChange={(e) => set({ direccion: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input
            className={claseInput}
            value={p.telefono ?? ""}
            onChange={(e) => set({ telefono: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Correo electrónico">
          <input
            type="email"
            className={claseInput}
            value={p.correo ?? ""}
            onChange={(e) => set({ correo: e.target.value })}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Descripción física y vestimenta">
        <div className="sm:col-span-2">
          <Campo etiqueta="Descripción física y de vestimenta del interviniente">
            <textarea
              rows={2}
              className={claseInput}
              value={p.descripcionFisicaVestimenta ?? ""}
              onChange={(e) => set({ descripcionFisicaVestimenta: e.target.value })}
              placeholder="Contextura, estatura aproximada, color de piel, cabello, prendas que vestía, etc."
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Señales particulares">
        <div className="sm:col-span-2">
          <Campo etiqueta="Señales particulares visibles">
            <textarea
              rows={2}
              className={claseInput}
              value={p.senalesParticulares ?? ""}
              onChange={(e) => set({ senalesParticulares: e.target.value })}
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Información familiar">
        <Campo etiqueta="Nombre de los padres">
          <input
            className={claseInput}
            value={p.nombrePadres ?? ""}
            onChange={(e) => set({ nombrePadres: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Teléfono de los padres">
          <input
            className={claseInput}
            value={p.telefonoPadres ?? ""}
            onChange={(e) => set({ telefonoPadres: e.target.value })}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Participación en los hechos (Bloque 5/6)">
        <div className="sm:col-span-2">
          <Campo etiqueta="¿Qué hizo esta persona específicamente? (portaba, consumía, comercializaba, ocultaba...)">
            <textarea
              rows={2}
              className={claseInput}
              value={p.participacionHechos ?? ""}
              onChange={(e) => set({ participacionHechos: e.target.value })}
            />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Comportamiento durante el abordaje (colaboración, resistencia, intento de fuga...)">
            <textarea
              rows={2}
              className={claseInput}
              value={p.comportamientoAbordaje ?? ""}
              onChange={(e) => set({ comportamientoAbordaje: e.target.value })}
            />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="¿Se identificó plenamente?">
            <div className="mt-1 flex gap-3">
              {[true, false].map((valor) => (
                <button
                  type="button"
                  key={String(valor)}
                  onClick={() => set({ identificacionPlena: valor })}
                  className={`rounded-md border px-3 py-2 font-sans text-sm transition-colors ${
                    p.identificacionPlena === valor
                      ? "border-acento bg-acento-light text-acento-hover"
                      : "border-institucional-100 text-institucional-700 hover:bg-institucional-50"
                  }`}
                >
                  {valor ? "Sí" : "No"}
                </button>
              ))}
            </div>
          </Campo>
        </div>
        {p.identificacionPlena === false && (
          <div className="sm:col-span-2">
            <Campo etiqueta="¿Cómo se logró establecer la identidad?">
              <textarea
                rows={2}
                className={claseInput}
                value={p.formaIdentificacion ?? ""}
                onChange={(e) => set({ formaIdentificacion: e.target.value })}
              />
            </Campo>
          </div>
        )}
      </Seccion>

      {p.tipoInterviniente === "APREHENDIDO" && (
        <Seccion titulo="Acudiente (exclusivo para adolescentes)">
          <Campo etiqueta="Nombre del acudiente">
            <input
              className={claseInput}
              value={p.nombreAcudiente ?? ""}
              onChange={(e) => set({ nombreAcudiente: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Parentesco">
            <input
              className={claseInput}
              value={p.parentescoAcudiente ?? ""}
              onChange={(e) => set({ parentescoAcudiente: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Teléfono del acudiente">
            <input
              className={claseInput}
              value={p.telefonoAcudiente ?? ""}
              onChange={(e) => set({ telefonoAcudiente: e.target.value })}
            />
          </Campo>
        </Seccion>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-institucional-950">Persona a informar la captura/aprehensión</h2>
          <IndicadorGuardado estado={estadoContacto} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm sm:grid-cols-2">
          <Campo etiqueta="Nombre">
            <input
              className={claseInput}
              value={contacto.nombre ?? ""}
              onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input
              className={claseInput}
              value={contacto.telefono ?? ""}
              onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })}
            />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="¿Fue posible realizar la comunicación?" requerido>
              <div className="mt-1 flex gap-3">
                {[true, false].map((valor) => (
                  <button
                    type="button"
                    key={String(valor)}
                    onClick={() => setContacto({ ...contacto, comunicacionExitosa: valor })}
                    className={`rounded-md border px-3 py-2 font-sans text-sm transition-colors ${
                      contacto.comunicacionExitosa === valor
                        ? "border-acento bg-acento-light text-acento-hover"
                        : "border-institucional-100 text-institucional-700 hover:bg-institucional-50"
                    }`}
                  >
                    {valor ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </Campo>
          </div>
          {contacto.comunicacionExitosa ? (
            <Campo etiqueta="Hora de la comunicación">
              <CampoHora
                value={contacto.horaComunicacion ?? ""}
                onChange={(v) => setContacto({ ...contacto, horaComunicacion: v })}
              />
            </Campo>
          ) : (
            <div className="sm:col-span-2">
              <Campo etiqueta="Justificación" requerido>
                <textarea
                  rows={2}
                  className={claseInput}
                  value={contacto.justificacionNoComunicacion ?? ""}
                  onChange={(e) => setContacto({ ...contacto, justificacionNoComunicacion: e.target.value })}
                />
              </Campo>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={eliminarInterviniente}
        disabled={eliminando}
        className="font-sans text-xs text-estado-error hover:underline disabled:opacity-60"
      >
        {eliminando ? "Eliminando…" : "Eliminar este interviniente"}
      </button>
    </div>
  );
}
