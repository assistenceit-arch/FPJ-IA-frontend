"use client";

// Adenda 2026-08-24: monitoreo y alertas de errores. Sin este archivo,
// los errores de renderizado de React (App Router) no se reportarían a
// Sentry -- las páginas normales sí quedan cubiertas por
// sentry.server.config.ts/sentry.client.config.ts, pero un error que
// tumba toda la aplicación (la raíz del árbol de componentes) necesita
// este manejador especial de Next.js.
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
