import { withSentryConfig } from "@sentry/nextjs";

// Corrección 2026-09-03 (auditoría de seguridad de la PWA): cabeceras
// HTTP de seguridad estándar, ausentes hasta ahora. Diseño
// deliberadamente conservador -- restringe lo de mayor impacto real
// (de dónde puede venir código ejecutable, si la app se puede incrustar
// en un iframe ajeno) sin arriesgar romper algo que hoy funciona (por
// eso `style-src` permite 'unsafe-inline', y `connect-src` no restringe
// a Sentry específicamente -- su dominio exacto de envío de errores
// puede variar). IMPORTANTE: revisar la consola del navegador después
// de desplegar por si algo queda bloqueado sin querer; ajustar la
// política según haga falta, no es un valor fijo para siempre.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Todas las rutas -- páginas, API interna de Next.js, y los
        // archivos estáticos de la PWA (manifiesto, service worker).
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // La aplicación no usa cámara, micrófono, ni ubicación --
            // se deshabilitan explícitamente, aunque nunca se pidan.
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
