// Adenda 2026-08-24: monitoreo y alertas de errores. Next.js 13.4+
// llama automáticamente a esta función register() al arrancar,
// distinguiendo entre el runtime de Node.js normal (páginas renderizadas
// en el servidor) y el Edge Runtime (middleware.ts) -- cada uno necesita
// su propia inicialización de Sentry porque son entornos de ejecución
// distintos.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
