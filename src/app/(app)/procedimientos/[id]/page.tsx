"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Procedimiento } from "@/lib/tipos";

export default function PaginaDetalleProcedimiento() {
  const { id } = useParams<{ id: string }>();
  const [procedimiento, setProcedimiento] = useState<Procedimiento | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Procedimiento>(`/procedimientos/${id}`)
      .then(setProcedimiento)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No fue posible cargar el procedimiento."));
  }, [id]);

  return (
    <div>
      <Link href="/procedimientos" className="font-sans text-sm text-institucional-700 hover:underline">
        ← Mis procedimientos
      </Link>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      {procedimiento && (
        <div className="mt-4">
          <h1 className="font-display text-2xl text-institucional-950">{procedimiento.numeroInterno}</h1>
          <p className="mt-1 font-sans text-sm text-institucional-700">{procedimiento.delito}</p>

          <div className="mt-8 rounded-lg border border-dashed border-institucional-100 bg-white px-6 py-10 text-center">
            <p className="font-display text-lg text-institucional-950">
              Formulario del procedimiento — próximamente
            </p>
            <p className="mx-auto mt-1 max-w-md font-sans text-sm text-institucional-700">
              Aquí vivirán los Bloques 1 a 6 (funcionarios, lugar, intervinientes, elementos y
              actuaciones), con navegación libre entre ellos y autoguardado — se construye en la
              siguiente ronda de esta misma fase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
