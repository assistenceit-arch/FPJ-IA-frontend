"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Victima } from "@/lib/tipos";

type VictimaResumen = Pick<
  Victima,
  "id" | "primerNombre" | "primerApellido" | "edad" | "numeroDocumento"
>;

export default function ListaVictimas() {
  const { id } = useParams<{ id: string }>();
  const [victimas, setVictimas] = useState<VictimaResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<VictimaResumen[]>(`/procedimientos/${id}/victimas`)
      .then(setVictimas)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No fue posible cargar las víctimas."));
  }, [id]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/procedimientos/${id}/actuaciones`}
            className="font-sans text-sm text-institucional-700 hover:underline"
          >
            ← Actuaciones procedimentales
          </Link>
          <h1 className="mt-1 font-display text-2xl text-institucional-950">Víctimas de los hechos</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Sección 4 del FPJ 5. Una o varias víctimas asociadas a este procedimiento.
          </p>
        </div>
        <Link
          href={`/procedimientos/${id}/victimas/nuevo`}
          className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
        >
          + Agregar víctima
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <div className="mt-6">
        {victimas === null && !error && (
          <p className="font-sans text-sm text-institucional-700">Cargando…</p>
        )}

        {victimas?.length === 0 && (
          <div className="rounded-lg border border-dashed border-institucional-100 bg-white px-6 py-14 text-center">
            <p className="font-display text-lg text-institucional-950">Aún no hay víctimas</p>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Agrega al menos una, o vuelve a Actuaciones y marca &quot;No&quot; si no existen víctimas.
            </p>
          </div>
        )}

        {victimas && victimas.length > 0 && (
          <ul className="divide-y divide-institucional-100 rounded-lg border border-institucional-100 bg-white shadow-sm">
            {victimas.map((persona) => (
              <li key={persona.id}>
                <Link
                  href={`/procedimientos/${id}/victimas/${persona.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-institucional-50"
                >
                  <div>
                    <p className="font-sans text-sm font-semibold text-institucional-950">
                      {persona.primerNombre} {persona.primerApellido}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-institucional-700">
                      {persona.edad !== null ? `${persona.edad} años` : "Edad no aportada"}{" "}
                      {persona.numeroDocumento ? `· ${persona.numeroDocumento}` : ""}
                    </p>
                  </div>
                  <span aria-hidden className="text-institucional-700">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
