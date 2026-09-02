// Adenda 2026-08-24: monitoreo y alertas de errores. Next.js 13.4+
// llama automáticamente a esta función register() al arrancar,
// distinguiendo entre el runtime de Node.js normal (páginas renderizadas
// en el servidor) y el Edge Runtime (middleware.ts) -- cada uno necesita
// su propia inicialización de Sentry porque son entornos de ejecución
// distintos.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Adenda 2026-09-02 (Etapa 2 de la actualización de Next.js): captura
// errores que ocurren dentro de componentes de servidor anidados (React
// Server Components) -- sin este enlace, Sentry sigue capturando
// errores normales, pero se pierde este tipo específico.
export const onRequestError = Sentry.captureRequestError;
