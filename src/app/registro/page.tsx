"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function PaginaRegistro() {
  const [nombres, setNombres] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.post(
        "/auth/registro",
        { nombres, correo, telefono, password },
        { conAuth: false },
      );
      setExito(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible crear la cuenta.");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="grid min-h-screen place-items-center bg-institucional-50 px-8">
        <div className="mx-auto w-full max-w-sm text-center">
          <h2 className="font-display text-2xl text-institucional-950">Revisa tu correo</h2>
          <p className="mt-3 font-sans text-sm text-institucional-700">
            Enviamos un enlace de verificación a <strong>{correo}</strong>. Ábrelo para activar tu
            cuenta — el enlace vence en 24 horas.
          </p>
          <Link href="/login" className="mt-6 inline-block font-sans text-sm font-medium text-acento hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-institucional-50 px-8 py-14">
      <div className="mx-auto w-full max-w-sm">
        <h2 className="font-display text-2xl text-institucional-950">Crear cuenta</h2>
        <p className="mt-1 font-sans text-sm text-institucional-700">
          Regístrate con tu correo institucional. Te enviaremos un enlace para verificarlo.
        </p>

        <form onSubmit={manejarEnvio} className="mt-8 space-y-5" noValidate>
          <div>
            <label htmlFor="nombres" className="block font-sans text-sm font-medium text-institucional-900">
              Nombre completo
            </label>
            <input
              id="nombres"
              required
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
            />
          </div>

          <div>
            <label htmlFor="correo" className="block font-sans text-sm font-medium text-institucional-900">
              Correo institucional
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu.correo@policia.gov.co"
              className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block font-sans text-sm font-medium text-institucional-900">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-sans text-sm font-medium text-institucional-900">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 font-sans text-institucional-950 shadow-sm outline-none focus:border-acento"
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
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>

          <p className="text-center font-sans text-sm text-institucional-700">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-acento hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
