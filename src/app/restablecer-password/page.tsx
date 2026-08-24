"use client";

import { Suspense, useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

function ContenidoRestablecer() {
  const parametros = useSearchParams();
  const router = useRouter();
  const token = parametros.get("token");

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!token) {
      setError("El enlace de recuperación no incluye un token válido.");
      return;
    }
    if (nuevaPassword !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (nuevaPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCargando(true);
    try {
      await api.post("/auth/restablecer-password", { token, nuevaPassword }, { conAuth: false });
      setExito(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  if (!token) {
    return (
      <>
        <h2 className="font-display text-2xl text-institucional-950">Enlace inválido</h2>
        <p className="mt-3 font-sans text-sm text-institucional-700">
          Este enlace no incluye un token de recuperación. Solicita uno nuevo.
        </p>
        <Link
          href="/olvide-password"
          className="mt-8 inline-block font-sans text-sm font-medium text-acento hover:underline"
        >
          Solicitar enlace de recuperación
        </Link>
      </>
    );
  }

  if (exito) {
    return (
      <>
        <h2 className="font-display text-2xl text-institucional-950">Contraseña actualizada</h2>
        <p className="mt-3 font-sans text-sm text-institucional-700">
          Ya puedes iniciar sesión con tu nueva contraseña. Te vamos a redirigir en un momento…
        </p>
        <Link href="/login" className="mt-8 inline-block font-sans text-sm font-medium text-acento hover:underline">
          Ir a iniciar sesión ahora
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 className="font-display text-2xl text-institucional-950">Crea una nueva contraseña</h2>
      <p className="mt-1 font-sans text-sm text-institucional-700">
        Debe tener al menos 8 caracteres.
      </p>

      <form onSubmit={manejarEnvio} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="nuevaPassword" className="block font-sans text-sm font-medium text-institucional-900">
            Nueva contraseña
          </label>
          <input
            id="nuevaPassword"
            name="nuevaPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmacion" className="block font-sans text-sm font-medium text-institucional-900">
            Confirma la contraseña
          </label>
          <input
            id="confirmacion"
            name="confirmacion"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
            placeholder="••••••••"
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
          {cargando ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </>
  );
}

export default function PaginaRestablecerPassword() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-institucional-50 px-8 py-14">
      <div className="mx-auto w-full max-w-sm">
        <Suspense fallback={<p className="font-sans text-sm text-institucional-700">Cargando…</p>}>
          <ContenidoRestablecer />
        </Suspense>
      </div>
    </div>
  );
}
