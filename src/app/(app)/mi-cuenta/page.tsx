"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { cerrarSesion, payloadToken } from "@/lib/auth";

const LONGITUD_MINIMA_MOTIVO = 10;

export default function PaginaMiCuenta() {
  const router = useRouter();
  const correo = payloadToken()?.correo ?? "";

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEliminacion() {
    if (motivo.trim().length < LONGITUD_MINIMA_MOTIVO) {
      setError(`Cuéntanos un poco más -- mínimo ${LONGITUD_MINIMA_MOTIVO} caracteres.`);
      return;
    }
    setError(null);
    setEliminando(true);
    try {
      await api.delete("/auth/mi-cuenta", { body: JSON.stringify({ motivo: motivo.trim() }) });
      cerrarSesion();
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible eliminar la cuenta.");
      setEliminando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-institucional-950">Mi cuenta</h1>
      {correo && <p className="mt-1 font-sans text-sm text-institucional-700">{correo}</p>}

      <div className="mt-10 rounded-lg border border-estado-error/30 bg-estado-error/5 p-6">
        <h2 className="font-sans text-base font-semibold text-institucional-950">Eliminar mi cuenta</h2>
        <p className="mt-2 font-sans text-sm text-institucional-700">
          Esta acción es permanente: perderás el acceso de inmediato y no podrás volver a iniciar sesión con
          esta cuenta. Los procedimientos que ya creaste no se eliminan -- quedan en el sistema, conforme a
          la política de conservación de la información.
        </p>

        {!mostrarConfirmacion ? (
          <button
            type="button"
            onClick={() => setMostrarConfirmacion(true)}
            className="mt-4 rounded-md border border-estado-error px-4 py-2 font-sans text-sm font-semibold text-estado-error transition-colors hover:bg-estado-error/10"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <label htmlFor="motivo" className="block font-sans text-sm font-medium text-institucional-900">
              Cuéntanos por qué quieres eliminar tu cuenta
            </label>
            <textarea
              id="motivo"
              required
              rows={3}
              minLength={LONGITUD_MINIMA_MOTIVO}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Tu respuesta nos ayuda a mejorar la plataforma"
              className="block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-sm text-institucional-950 shadow-sm outline-none focus:border-estado-error"
            />

            {error && (
              <p role="alert" className="font-sans text-sm text-estado-error">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={manejarEliminacion}
                disabled={eliminando}
                className="rounded-md bg-estado-error px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {eliminando ? "Eliminando…" : "Sí, eliminar mi cuenta definitivamente"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setMotivo("");
                  setError(null);
                }}
                disabled={eliminando}
                className="rounded-md border border-institucional-100 px-4 py-2 font-sans text-sm text-institucional-800 transition-colors hover:bg-institucional-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/procedimientos"
        className="mt-6 inline-block font-sans text-sm text-institucional-700 hover:underline"
      >
        ← Volver a Mis procedimientos
      </Link>
    </div>
  );
}
