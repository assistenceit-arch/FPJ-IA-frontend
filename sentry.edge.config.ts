// Adenda 2026-08-24: monitoreo y alertas de errores, a solicitud del
// usuario. Esta configuración corre en el Edge Runtime -- necesaria
// específicamente porque este proyecto usa middleware.ts (protección
// de rutas por cookie de sesión), que corre en ese runtime distinto al
// del servidor Node.js normal.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 1.0,
});
