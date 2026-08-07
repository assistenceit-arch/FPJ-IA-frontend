"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { guardarToken } from "@/lib/auth";

interface RespuestaLogin {
  token?: string;
  access_token?: string;
  accessToken?: string;
}

export default function PaginaLogin() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const respuesta = await api.post<RespuestaLogin>(
        "/auth/login",
        { correo, password: contrasena },
        { conAuth: false },
      );
      const token = respuesta.token ?? respuesta.access_token ?? respuesta.accessToken;
      if (!token) {
        throw new Error("El servidor no devolvió un token de sesión.");
      }
      guardarToken(token);
      router.push("/procedimientos");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Panel institucional */}
      <div className="relative hidden overflow-hidden bg-institucional-950 px-16 py-14 text-institucional-50 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent, transparent 68px, currentColor 68px, currentColor 69px)",
          }}
        />
        <div className="relative">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-institucional-100/70">
            Policía Judicial · FPJ IA
          </p>
          <h1 className="mt-6 max-w-md font-display text-4xl leading-tight text-institucional-50">
            Un solo formulario. Cinco documentos oficiales, siempre coherentes entre sí.
          </h1>
        </div>
        <div className="relative space-y-3 border-t border-institucional-700/60 pt-6 font-sans text-sm text-institucional-100/70">
          <p>Acta de Incautación · FPJ-5 · FPJ-6 · FPJ-7 · FPJ-8</p>
          <p className="text-institucional-100/50">
            La información se captura una única vez y se reutiliza automáticamente en cada documento.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-col justify-center bg-institucional-50 px-8 py-14 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-2xl text-institucional-950">Iniciar sesión</h2>
          <p className="mt-1 font-sans text-sm text-institucional-700">
            Ingresa con tu cuenta institucional.
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
                placeholder="tu.correo@policia.gov.co"
              />
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block font-sans text-sm font-medium text-institucional-900"
              >
                Contraseña
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
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
              {cargando ? "Ingresando…" : "Ingresar"}
            </button>

            <p className="text-center font-sans text-sm text-institucional-700">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="font-medium text-acento hover:underline">
                Crear cuenta
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
