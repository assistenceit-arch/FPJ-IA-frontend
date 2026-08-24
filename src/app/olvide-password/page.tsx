"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function PaginaOlvidePassword() {
  const [correo, setCorreo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.post("/auth/olvide-password", { correo }, { conAuth: false });
      // Adenda 2026-08-24: el backend siempre responde con éxito, exista
      // o no la cuenta -- no se debe revelar qué correos están
      // registrados. El frontend simplemente confía en esa respuesta.
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-institucional-50 px-8 py-14">
      <div className="mx-auto w-full max-w-sm">
        {enviado ? (
          <>
            <h2 className="font-display text-2xl text-institucional-950">Revisa tu correo</h2>
            <p className="mt-3 font-sans text-sm text-institucional-700">
              Si <strong>{correo}</strong> está registrado, te enviamos un enlace para restablecer tu
              contraseña. El enlace vence en 1 hora.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block font-sans text-sm font-medium text-acento hover:underline"
            >
              ← Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl text-institucional-950">¿Olvidaste tu contraseña?</h2>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>

            <form onSubmit={manejarEnvio} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="correo" className="block font-sans text-sm font-medium text-institucional-900">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
                  placeholder="tu.correo@institucion.gov.co"
                />
              </div>

              {error && (
                <p role="alert" className="font-sans text-sm text-estado-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? "Enviando…" : "Enviar enlace de recuperación"}
              </button>

              <Link
                href="/login"
                className="block text-center font-sans text-sm text-institucional-700 hover:underline"
              >
                ← Volver a iniciar sesión
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
