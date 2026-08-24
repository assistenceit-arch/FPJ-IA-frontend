// Adenda 2026-08-24: monitoreo y alertas de errores, a solicitud del
// usuario. Esta configuración corre en el servidor de Next.js (Node.js
// runtime -- páginas renderizadas en el servidor, route handlers).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 1.0,
});
