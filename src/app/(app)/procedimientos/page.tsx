"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Procedimiento } from "@/lib/tipos";

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PaginaProcedimientos() {
  const [procedimientos, setProcedimientos] = useState<Procedimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Procedimiento[]>("/procedimientos")
      .then(setProcedimientos)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No fue posible cargar tus procedimientos."),
      );
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">Mis procedimientos</h1>
        </div>
        <Link
          href="/procedimientos/nuevo"
          className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
        >
          + Nuevo procedimiento
        </Link>
      </div>

      <div className="mt-8">
        {error && (
          <p role="alert" className="font-sans text-sm text-estado-error">
            {error}
          </p>
        )}

        {!error && procedimientos === null && (
          <p className="font-sans text-sm text-institucional-700">Cargando…</p>
        )}

        {procedimientos?.length === 0 && (
          <div className="rounded-lg border border-dashed border-institucional-100 bg-white px-6 py-14 text-center">
            <p className="font-display text-lg text-institucional-950">Aún no tienes procedimientos</p>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Crea el primero para empezar a diligenciar el formulario único.
            </p>
          </div>
        )}

        {procedimientos && procedimientos.length > 0 && (
          <ul className="divide-y divide-institucional-100 rounded-lg border border-institucional-100 bg-white shadow-sm">
            {procedimientos.map((proc) => (
              <li key={proc.id}>
                <Link
                  href={`/procedimientos/${proc.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-institucional-50"
                >
                  <div>
                    <p className="font-sans text-sm font-semibold text-institucional-950">
                      {proc.numeroInterno}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-institucional-700">
                      {proc.delito} · Captura: {formatearFecha(proc.fechaCaptura)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {proc.tipoProcedimiento === "COMPLEJO" && (
                      <span className="rounded-full bg-estado-pendiente/10 px-2.5 py-1 font-sans text-xs font-medium text-estado-pendiente">
                        Complejo
                      </span>
                    )}
                    <span className="rounded-full bg-institucional-100 px-2.5 py-1 font-sans text-xs font-medium text-institucional-800">
                      {proc.estado}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
