"use client";

import { useEffect } from "react";

// Adenda 2026-08-25: registro del service worker -- tiene que ser un
// componente cliente separado porque navigator.serviceWorker no existe
// en el servidor (Next.js renderiza layout.tsx también en el servidor).
export function RegistroServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencioso a propósito: si falla (ej. navegador sin soporte,
        // o corriendo sobre HTTP sin ser localhost), la aplicación debe
        // seguir funcionando exactamente igual, solo sin la ventaja de
        // caché de estáticos ni instalación como PWA.
      });
    }
  }, []);

  return null;
}
