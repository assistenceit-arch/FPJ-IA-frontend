"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, ApiError } from "@/lib/api";

interface RespuestaVerificacion {
  usuario: { id: string; correo: string; rol: string };
}

interface RespuestaCredenciales {
  requiere2FA: boolean;
  correo: string;
  mensaje: string;
}

export default function PaginaLogin() {
  const router = useRouter();
  const [paso, setPaso] = useState<"credenciales" | "codigo">("credenciales");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeCodigo, setMensajeCodigo] = useState<string | null>(null);

  // Adenda 2026-08-24: login en dos pasos -- este primer paso ya no
  // recibe un token, solo confirma que las credenciales son correctas
  // y dispara el envío del código de verificación por correo.
  async function manejarEnvioCredenciales(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const respuesta = await api.post<RespuestaCredenciales>(
        "/auth/login",
        { correo, password: contrasena },
        { conAuth: false },
      );
      setMensajeCodigo(respuesta.mensaje);
      setPaso("codigo");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(err.message || "Correo o contraseña incorrectos.");
      } else {
        setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  }

  async function manejarEnvioCodigo(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      // Corrección 2026-09-03 (auditoría de seguridad de la PWA): el
      // token ya no viene en el cuerpo de esta respuesta -- el backend
      // lo envía como cookie HttpOnly (invisible para este código, y
      // por eso mismo más segura). El navegador ya la guardó solo, en
      // cuanto llegó la respuesta (gracias a `credentials: "include"`,
      // ver api.ts) -- aquí solo queda redirigir.
      await api.post<RespuestaVerificacion>(
        "/auth/verificar-2fa",
        { correo, codigo },
        { conAuth: false },
      );
      router.push("/procedimientos");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Código incorrecto.");
      } else {
        setError(err instanceof Error ? err.message : "No fue posible verificar el código.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Adenda 2026-08-25 (segundo ajuste): a solicitud del usuario tras
          ver la primera versión en un iPhone real -- el desenfoque
          (backdrop-blur) sobre la imagen de fondo la dejaba borrosa e
          irreconocible, justo lo contrario de lo que se quería. Se
          reemplaza por un diseño más simple y sin traslape: la imagen
          nítida arriba (banner), el formulario sólido abajo -- sin
          transparencia ni desenfoque, cada uno en su propio espacio.
          Exclusivo de celular; el panel de escritorio no se toca. */}
      <div className="relative h-[32vh] w-full overflow-hidden lg:hidden">
        <Image
          src="/marca/hero-login.webp"
          alt="Gestión y Documentación Operativa"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Panel de marca (solo escritorio) — imagen sola, sin texto encima */}
      <div className="relative hidden overflow-hidden bg-institucional-950 lg:block">
        <Image
          src="/marca/hero-login.webp"
          alt="Gestión y Documentación Operativa"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 0px"
          className="object-cover"
        />
      </div>

      {/* Formulario */}
      <div className="flex flex-col justify-start bg-institucional-50 px-8 pb-10 pt-6 sm:px-14 lg:justify-center lg:py-14">
        <div className="mx-auto w-full max-w-sm">
          {paso === "credenciales" ? (
            <>
              <h2 className="font-display text-2xl text-institucional-950">Iniciar sesión</h2>
              <p className="mt-1 font-sans text-sm text-institucional-700">
                Ingresa con tu cuenta institucional.
              </p>

              <form onSubmit={manejarEnvioCredenciales} className="mt-8 space-y-5" noValidate>
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

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="contrasena"
                      className="block font-sans text-sm font-medium text-institucional-900"
                    >
                      Contraseña
                    </label>
                    <Link href="/olvide-password" className="font-sans text-xs text-acento hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
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
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl text-institucional-950">Verifica tu identidad</h2>
              <p className="mt-1 font-sans text-sm text-institucional-700">
                {mensajeCodigo ?? `Te enviamos un código de verificación a ${correo}.`}
              </p>

              <form onSubmit={manejarEnvioCodigo} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="codigo" className="block font-sans text-sm font-medium text-institucional-900">
                    Código de verificación
                  </label>
                  <input
                    id="codigo"
                    name="codigo"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    className="mt-1.5 block w-full rounded-md border border-institucional-100 bg-white px-3 py-2.5 text-center font-sans text-2xl tracking-[0.4em] text-institucional-950 shadow-sm outline-none focus:border-acento"
                    placeholder="000000"
                  />
                  <p className="mt-1.5 font-sans text-xs text-institucional-700">Vence en 10 minutos.</p>
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
                  {cargando ? "Verificando…" : "Verificar y continuar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaso("credenciales");
                    setCodigo("");
                    setError(null);
                  }}
                  className="w-full text-center font-sans text-sm text-institucional-700 hover:underline"
                >
                  ← Volver a intentar con otra cuenta
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
