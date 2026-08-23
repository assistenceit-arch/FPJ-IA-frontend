"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cerrarSesion, payloadToken } from "@/lib/auth";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [correo, setCorreo] = useState<string | null>(null);
  const [esAdministrador, setEsAdministrador] = useState(false);

  useEffect(() => {
    const payload = payloadToken();
    setCorreo(payload?.correo ?? null);
    setEsAdministrador(payload?.rol === "ADMINISTRADOR");
  }, []);

  function manejarCierreSesion() {
    cerrarSesion();
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
                className="rounded-md border border-institucional-700 px-3 py-1.5 text-institucional-50 transition-colors hover:bg-institucional-800"
              >
                Panel de administración
              </Link>
            )}
            {correo && <span className="hidden sm:inline">{correo}</span>}
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
