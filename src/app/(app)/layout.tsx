"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cerrarSesion } from "@/lib/auth";
import { api } from "@/lib/api";
import { UsuarioProvider, useUsuarioActual } from "@/lib/usuario-context";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <UsuarioProvider>
      <ContenidoLayout>{children}</ContenidoLayout>
    </UsuarioProvider>
  );
}

function ContenidoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario } = useUsuarioActual();
  const esAdministrador = usuario?.rol === "ADMINISTRADOR";

  // Adenda 2026-09-06, a solicitud del usuario: aviso dentro de la app
  // (nunca por correo, así lo pidió explícitamente) de cuántos pagos
  // están pendientes de verificar -- visible desde cualquier pantalla
  // para un administrador, junto al enlace al panel, sin tener que
  // entrar a revisarlo para enterarse de que hay algo pendiente.
  const [pagosPendientes, setPagosPendientes] = useState(0);

  useEffect(() => {
    if (!esAdministrador) return;
    let cancelado = false;
    api
      .get<unknown[]>("/admin/pagos/pendientes")
      .then((lista) => {
        if (!cancelado) setPagosPendientes(lista.length);
      })
      .catch(() => {});
    // Se revisa de nuevo cada 60 segundos mientras la sesión esté
    // abierta, para que el aviso se mantenga al día sin recargar.
    const intervalo = setInterval(() => {
      api
        .get<unknown[]>("/admin/pagos/pendientes")
        .then((lista) => {
          if (!cancelado) setPagosPendientes(lista.length);
        })
        .catch(() => {});
    }, 60000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [esAdministrador]);

  async function manejarCierreSesion() {
    await cerrarSesion();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-institucional-50">
      <header className="border-b border-institucional-100 bg-institucional-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5">
          <Link href="/procedimientos" aria-label="Ir a Mis procedimientos" className="flex items-center">
            <Image
              src="/marca/escudo.webp"
              alt="PJ | Gestión Digital"
              width={227}
              height={200}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4 font-sans text-sm text-institucional-100/80">
            {esAdministrador && (
              <Link
                href="/admin"
                className="relative rounded-md border border-institucional-700 px-3 py-1.5 text-institucional-50 transition-colors hover:bg-institucional-800"
              >
                Panel de administración
                {pagosPendientes > 0 && (
                  <span
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-estado-error font-sans text-xs font-bold text-white"
                    title={`${pagosPendientes} pago(s) pendiente(s) de verificar`}
                  >
                    {pagosPendientes > 9 ? "9+" : pagosPendientes}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/mi-cuenta"
              className="rounded-md border border-institucional-700 px-3 py-1.5 text-institucional-50 transition-colors hover:bg-institucional-800"
            >
              Mi cuenta
            </Link>
            {usuario?.correo && <span className="hidden sm:inline">{usuario.correo}</span>}
            <button
              onClick={manejarCierreSesion}
              className="rounded-md border border-institucional-700 px-3 py-1.5 text-institucional-50 transition-colors hover:bg-institucional-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
