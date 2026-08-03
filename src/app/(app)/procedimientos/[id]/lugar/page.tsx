"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { LugarProcedimiento } from "@/lib/tipos";

const LUGAR_VACIO: LugarProcedimiento = {
  departamento: "",
  municipio: "",
  localidad: "",
  barrio: "",
  direccion: "",
  caracteristicas: "",
};

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

export default function BloqueLugar() {
  const { id } = useParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [lugar, setLugar] = useState<LugarProcedimiento>(LUGAR_VACIO);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<LugarProcedimiento | null>(`/procedimientos/${id}/lugar-procedimiento`)
      .then((l) => {
        if (cancelado) return;
        if (l) {
          setLugar({
            ...LUGAR_VACIO,
            ...soloClaves(l, ["departamento", "municipio", "localidad", "barrio", "direccion", "caracteristicas"]),
          });
        }
        setCargando(false);
      })
      .catch(() => setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardar = useCallback(
    async (datos: LugarProcedimiento) => {
      const requeridos = [datos.departamento, datos.municipio, datos.barrio, datos.direccion];
      if (!requeridos.every((v) => v && v.trim())) return;
      try {
        await api.put(`/procedimientos/${id}/lugar-procedimiento`, datos);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar el lugar.");
        throw err;
      }
    },
    [id],
  );
  const { estado: estadoGuardado } = useAutoguardado(lugar, guardar, { activo: !cargando });

  if (cargando) {
    return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">3. Lugar del procedimiento</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            La ubicación oficial donde ocurrieron los hechos. Alimenta automáticamente el FPJ-5, el
            Acta de Incautación, el FPJ-7 y el FPJ-8.
          </p>
        </div>
        <IndicadorGuardado estado={estadoGuardado} />
      </div>

      {error && (
        <p role="alert" className="mt-3 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <Campo etiqueta="Departamento" requerido>
          <input
            className={claseInput}
            value={lugar.departamento}
            onChange={(e) => setLugar({ ...lugar, departamento: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Municipio" requerido>
          <input
            className={claseInput}
            value={lugar.municipio}
            onChange={(e) => setLugar({ ...lugar, municipio: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Localidad / Comuna">
          <input
            className={claseInput}
            value={lugar.localidad ?? ""}
            onChange={(e) => setLugar({ ...lugar, localidad: e.target.value })}
          />
        </Campo>
        <Campo etiqueta="Barrio" requerido>
          <input
            className={claseInput}
            value={lugar.barrio}
            onChange={(e) => setLugar({ ...lugar, barrio: e.target.value })}
          />
        </Campo>
        <div className="sm:col-span-2">
          <Campo etiqueta="Dirección" requerido>
            <input
              className={claseInput}
              value={lugar.direccion}
              onChange={(e) => setLugar({ ...lugar, direccion: e.target.value })}
            />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo etiqueta="Características del lugar">
            <textarea
              rows={3}
              className={claseInput}
              value={lugar.caracteristicas ?? ""}
              onChange={(e) => setLugar({ ...lugar, caracteristicas: e.target.value })}
              placeholder="Ej. Zona comercial, alta afluencia de personas"
            />
          </Campo>
        </div>
      </div>

      <p className="mt-3 font-sans text-xs text-institucional-700">
        La zona se registrará automáticamente como <strong>URBANA</strong> en el FPJ-5.
      </p>
    </div>
  );
}
