"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { Testigo } from "@/lib/tipos";

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

const CLAVES_GUARDABLES = [
  "primerNombre",
  "segundoNombre",
  "primerApellido",
  "segundoApellido",
  "tipoDocumento",
  "numeroDocumento",
  "expedicionDocumento",
  "genero",
  "paisNacimiento",
  "departamentoNacimiento",
  "municipioNacimiento",
  "profesionOficio",
  "estadoCivil",
  "direccion",
  "telefono",
  "correo",
] as const;

export default function EditarTestigo() {
  const { id, testigoId } = useParams<{ id: string; testigoId: string }>();
  const [cargando, setCargando] = useState(true);
  const [persona, setPersona] = useState<Testigo | null>(null);
  const [noAportaFechaNacimiento, setNoAportaFechaNacimiento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    api
      .get<Testigo>(`/procedimientos/${id}/testigos/${testigoId}`)
      .then((t) => {
        if (cancelado) return;
        setPersona(t);
        setNoAportaFechaNacimiento(t.fechaNacimiento === null && t.edad !== null);
        setCargando(false);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "No fue posible cargar el testigo.");
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id, testigoId]);

  const guardarPersona = useCallback(
    async (datos: Testigo | null) => {
      if (!datos) return;
      const resto = soloClaves(datos, CLAVES_GUARDABLES);
      // fechaNacimiento y edadManual son mutuamente excluyentes, mismo
      // criterio que Capturado. Si no se aportó fecha, se envía la edad
      // digitada manualmente (puede quedar sin ninguna de las dos si el
      // funcionario aún no ha respondido nada).
      const nacimiento =
        datos.fechaNacimiento !== null
          ? { fechaNacimiento: datos.fechaNacimiento }
          : datos.edad !== null
            ? { edadManual: datos.edad }
            : {};
      try {
        await api.patch(`/procedimientos/${id}/testigos/${testigoId}`, { ...resto, ...nacimiento });
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar.");
        throw err;
      }
    },
    [id, testigoId],
  );
  const { estado } = useAutoguardado(persona, guardarPersona, { activo: !cargando });

  async function eliminarTestigo() {
    if (!confirm("¿Eliminar este testigo? Esta acción no se puede deshacer.")) return;
    setEliminando(true);
    try {
      await api.delete(`/procedimientos/${id}/testigos/${testigoId}`);
      window.location.href = `/procedimientos/${id}/testigos`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible eliminar.");
      setEliminando(false);
    }
  }

  if (cargando) return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;
  if (!persona) {
    return (
      <p role="alert" className="font-sans text-sm text-estado-error">
        {error ?? "Testigo no encontrado."}
      </p>
    );
  }

  const p = persona;
  const set = (cambios: Partial<Testigo>) => setPersona({ ...p, ...cambios });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/procedimientos/${id}/testigos`}
            className="font-sans text-sm text-institucional-700 hover:underline"
          >
            ← Testigos
          </Link>
          <h1 className="mt-1 font-display text-2xl text-institucional-950">
            {p.primerNombre} {p.primerApellido}
          </h1>
        </div>
        <IndicadorGuardado estado={estado} />
      </div>

      {error && (
        <p role="alert" className="font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <Seccion titulo="Identificación">
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
            onChange={(e) => set({ segundoNombre: e.target.value || null })}
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
            onChange={(e) => set({ segundoApellido: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Tipo de documento">
          <select
            className={claseInput}
            value={p.tipoDocumento ?? ""}
            onChange={(e) => set({ tipoDocumento: e.target.value || null })}
          >
            <option value="">Selecciona…</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
            <option value="OTRO">Otra</option>
          </select>
        </Campo>
        <Campo etiqueta="Número de documento">
          <input
            className={claseInput}
            value={p.numeroDocumento ?? ""}
            onChange={(e) => set({ numeroDocumento: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Lugar de expedición">
          <input
            className={claseInput}
            value={p.expedicionDocumento ?? ""}
            onChange={(e) => set({ expedicionDocumento: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Género">
          <select
            className={claseInput}
            value={p.genero ?? ""}
            onChange={(e) => set({ genero: e.target.value || null })}
          >
            <option value="">Selecciona…</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </Campo>
      </Seccion>

      <Seccion titulo="Nacimiento">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="block font-sans text-sm font-medium text-institucional-900">
              Fecha de nacimiento
            </span>
            <label className="flex items-center gap-2 font-sans text-xs text-institucional-700">
              <input
                type="checkbox"
                checked={noAportaFechaNacimiento}
                onChange={(e) => {
                  setNoAportaFechaNacimiento(e.target.checked);
                  if (e.target.checked) set({ fechaNacimiento: null });
                  else set({ edad: null });
                }}
              />
              No aporta fecha de nacimiento
            </label>
          </div>
          {noAportaFechaNacimiento ? (
            <input
              type="number"
              min={0}
              max={120}
              placeholder="Edad aproximada"
              className={`mt-1 ${claseInput}`}
              value={p.edad ?? ""}
              onChange={(e) => set({ edad: e.target.value ? Number(e.target.value) : null })}
            />
          ) : (
            <input
              type="date"
              className={`mt-1 ${claseInput}`}
              value={p.fechaNacimiento ? p.fechaNacimiento.slice(0, 10) : ""}
              onChange={(e) =>
                set({ fechaNacimiento: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })
              }
            />
          )}
        </div>
        <Campo etiqueta="País de nacimiento">
          <input
            className={claseInput}
            value={p.paisNacimiento ?? ""}
            onChange={(e) => set({ paisNacimiento: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Departamento de nacimiento">
          <input
            className={claseInput}
            value={p.departamentoNacimiento ?? ""}
            onChange={(e) => set({ departamentoNacimiento: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Municipio de nacimiento">
          <input
            className={claseInput}
            value={p.municipioNacimiento ?? ""}
            onChange={(e) => set({ municipioNacimiento: e.target.value || null })}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Datos personales y de contacto">
        <Campo etiqueta="Profesión u oficio">
          <input
            className={claseInput}
            value={p.profesionOficio ?? ""}
            onChange={(e) => set({ profesionOficio: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Estado civil">
          <input
            className={claseInput}
            value={p.estadoCivil ?? ""}
            onChange={(e) => set({ estadoCivil: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Dirección">
          <input
            className={claseInput}
            value={p.direccion ?? ""}
            onChange={(e) => set({ direccion: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input
            className={claseInput}
            value={p.telefono ?? ""}
            onChange={(e) => set({ telefono: e.target.value || null })}
          />
        </Campo>
        <Campo etiqueta="Correo electrónico">
          <input
            type="email"
            className={claseInput}
            value={p.correo ?? ""}
            onChange={(e) => set({ correo: e.target.value || null })}
          />
        </Campo>
      </Seccion>

      <button
        type="button"
        onClick={eliminarTestigo}
        disabled={eliminando}
        className="font-sans text-sm text-estado-error hover:underline disabled:opacity-60"
      >
        {eliminando ? "Eliminando…" : "Eliminar testigo"}
      </button>
    </div>
  );
}
