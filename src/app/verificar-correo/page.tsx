"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

function ContenidoVerificacion() {
  const parametros = useSearchParams();
  const token = parametros.get("token");
  const [estado, setEstado] = useState<"verificando" | "exito" | "error">("verificando");
  const [mensaje, setMensaje] = useState("");
  // React (modo desarrollo) ejecuta los efectos dos veces seguidas al
  // montar un componente (Strict Mode), para detectar efectos
  // secundarios mal escritos. Como verificar el correo consume el token
  // (una vez usado, deja de ser válido), la segunda ejecución fallaba y
  // esa era la respuesta que quedaba visible en pantalla, aunque la
  // primera sí hubiera verificado correctamente. Esta ref evita que la
  // petición se repita dentro del mismo montaje.
  const yaEjecutado = useRef(false);

  useEffect(() => {
    if (yaEjecutado.current) return;
    yaEjecutado.current = true;

    if (!token) {
      setEstado("error");
      setMensaje("El enlace de verificación no incluye un token válido.");
      return;
    }
    api
      .get<{ mensaje: string }>(`/auth/verificar-correo?token=${encodeURIComponent(token)}`, {
        conAuth: false,
      })
      .then((respuesta) => {
        setEstado("exito");
        setMensaje(respuesta.mensaje);
      })
      .catch((err) => {
        setEstado("error");
        setMensaje(err instanceof ApiError ? err.message : "No fue posible verificar el correo.");
      });
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <h2 className="font-display text-2xl text-institucional-950">Verificación de correo</h2>

      {estado === "verificando" && (
        <p className="mt-3 font-sans text-sm text-institucional-700">Verificando…</p>
      )}
      {estado === "exito" && (
        <p className="mt-3 font-sans text-sm text-estado-completo">{mensaje}</p>
      )}
      {estado === "error" && (
        <p className="mt-3 font-sans text-sm text-estado-error">{mensaje}</p>
      )}

      <Link href="/login" className="mt-6 inline-block font-sans text-sm font-medium text-acento hover:underline">
        Ir a iniciar sesión
      </Link>
    </div>
  );
}

export default function PaginaVerificarCorreo() {
  return (
    <div className="grid min-h-screen place-items-center bg-institucional-50 px-8">
      <Suspense fallback={<p className="font-sans text-sm text-institucional-700">Cargando…</p>}>
        <ContenidoVerificacion />
      </Suspense>
    </div>
  );
}
