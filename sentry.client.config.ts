// Adenda 2026-08-24: monitoreo y alertas de errores, a solicitud del
// usuario. Esta configuración corre en el navegador. Sin
// NEXT_PUBLIC_SENTRY_DSN configurado, Sentry.init recibe dsn undefined
// y simplemente no reporta nada -- mismo criterio ya usado en el
// backend con SENTRY_DSN/SMTP_HOST (no fallar por falta de
// credenciales de un servicio externo opcional).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  // Para el volumen actual de la aplicación, capturar el 100% del
  // tráfico es razonable. Si el uso crece mucho, bajar este valor para
  // no agotar la cuota gratuita de Sentry demasiado rápido.
  tracesSampleRate: 1.0,
});
