// Adenda 2026-08-24, renombrado 2026-09-02 (Etapa 2 de la actualización
// de Next.js): monitoreo y alertas de errores, a solicitud del usuario.
// Este archivo corre en el navegador. Antes se llamaba
// sentry.client.config.ts -- se renombró a instrumentation-client.ts
// porque, con Turbopack (obligatorio desde Next.js 16), es la única
// convención que Next.js reconoce automáticamente; el nombre viejo deja
// de funcionar. Sin NEXT_PUBLIC_SENTRY_DSN configurado, Sentry.init
// recibe dsn undefined y simplemente no reporta nada -- mismo criterio
// ya usado en el backend con SENTRY_DSN/SMTP_HOST (no fallar por falta
// de credenciales de un servicio externo opcional).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  // Para el volumen actual de la aplicación, capturar el 100% del
  // tráfico es razonable. Si el uso crece mucho, bajar este valor para
  // no agotar la cuota gratuita de Sentry demasiado rápido.
  tracesSampleRate: 1.0,
});

// Adenda 2026-09-02 (Etapa 2 de la actualización de Next.js): con
// Turbopack, Sentry necesita este enlace explícito para poder rastrear
// cuándo el usuario navega de una página a otra dentro de la
// aplicación (antes lo detectaba automáticamente).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
