"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cerrarSesion, payloadToken } from "@/lib/auth";

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [correo, setCorreo] = useState<string | null>(null);

  useEffect(() => {
    setCorreo(payloadToken()?.correo ?? null);
  }, []);

  function manejarCierreSesion() {
    cerrarSesion();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-institucional-50">
      <header className="border-b border-institucional-100 bg-institucional-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/procedimientos" className="font-display text-lg text-institucional-50">
            FPJ IA
          </Link>
          <div className="flex items-center gap-4 font-sans text-sm text-institucional-100/80">
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
