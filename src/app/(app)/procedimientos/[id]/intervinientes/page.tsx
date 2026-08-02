"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

interface CapturadoResumen {
  id: string;
  primerNombre: string;
  primerApellido: string;
  tipoInterviniente: "CAPTURADO" | "APREHENDIDO";
  edad: number;
  numeroDocumento: string | null;
  contactoNotificacion: unknown | null;
}

export default function BloqueIntervinientes() {
  const { id } = useParams<{ id: string }>();
  const [intervinientes, setIntervinientes] = useState<CapturadoResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`)
      .then(setIntervinientes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No fue posible cargar los intervinientes."));
  }, [id]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-institucional-950">2. Intervinientes</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Uno o varios capturados/aprehendidos asociados a este procedimiento.
          </p>
        </div>
        <Link
          href={`/procedimientos/${id}/intervinientes/nuevo`}
          className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
        >
          + Agregar interviniente
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      <div className="mt-6">
        {intervinientes === null && !error && (
          <p className="font-sans text-sm text-institucional-700">Cargando…</p>
        )}

        {intervinientes?.length === 0 && (
          <div className="rounded-lg border border-dashed border-institucional-100 bg-white px-6 py-14 text-center">
            <p className="font-display text-lg text-institucional-950">Aún no hay intervinientes</p>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Agrega al menos uno para poder continuar con el procedimiento.
            </p>
          </div>
        )}

        {intervinientes && intervinientes.length > 0 && (
          <ul className="divide-y divide-institucional-100 rounded-lg border border-institucional-100 bg-white shadow-sm">
            {intervinientes.map((persona) => (
              <li key={persona.id}>
                <Link
                  href={`/procedimientos/${id}/intervinientes/${persona.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-institucional-50"
                >
                  <div>
                    <p className="font-sans text-sm font-semibold text-institucional-950">
                      {persona.primerNombre} {persona.primerApellido}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-institucional-700">
                      {persona.tipoInterviniente === "APREHENDIDO" ? "Aprehendido" : "Capturado"} · {persona.edad}{" "}
                      años {persona.numeroDocumento ? `· ${persona.numeroDocumento}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!persona.contactoNotificacion && (
                      <span className="rounded-full bg-estado-pendiente/10 px-2.5 py-1 font-sans text-xs font-medium text-estado-pendiente">
                        Falta persona a informar
                      </span>
                    )}
                    <span aria-hidden className="text-institucional-700">
                      →
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
