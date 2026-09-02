import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Adenda 2026-08-24: monitoreo y alertas de errores, a solicitud del
// usuario. withSentryConfig es lo que hace que instrumentation-client.ts
// realmente se incluya en el paquete del navegador -- sin esto, solo
// las configuraciones de servidor/edge funcionarían.
export default withSentryConfig(nextConfig, {
  // silent evita logs ruidosos en cada build cuando no hay token de
  // subida de source maps configurado -- no es necesario para que
  // Sentry capture errores, solo para ver el código fuente original
  // (no minificado) en los reportes.
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Adenda 2026-09-02 (Etapa 2): se quitó la opción
  // `webpack: { treeshake: { removeDebugLogging: true } }` -- era
  // exclusiva del empaquetador viejo, y deja de tener efecto con
  // Turbopack (obligatorio desde Next.js 16). Solo era una optimización
  // menor de tamaño del paquete, no algo funcionalmente necesario.
});
