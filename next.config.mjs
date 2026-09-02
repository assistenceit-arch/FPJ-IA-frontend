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
//
// Corrección 2026-09-03 (bug real encontrado en pruebas): "script-src
// 'self'" sin excepciones bloqueaba por completo el modo de desarrollo
// (`npm run dev`) -- Next.js/Turbopack inyecta pequeños scripts en
// línea propios para la recarga automática en caliente, y la política
// los bloqueaba, rompiendo la aplicación entera en el navegador (no
// tenía nada que ver con las credenciales del login, aunque lo
// pareciera). La protección real de esta cabecera solo importa en
// PRODUCCIÓN -- en desarrollo local no hay ningún atacante real del
// que protegerse, así que se relaja únicamente ahí.
// Corrección 2026-09-03 (segundo bug real encontrado, esta vez en
// producción): incluso con un build de producción real, Next.js con
// Turbopack sigue inyectando pequeños scripts propios en línea
// directamente en el HTML (parte de su propio funcionamiento interno
// -- no algo que este proyecto agregó), con un hash distinto en cada
// carga de página. La forma "perfecta" de permitir esto de forma
// segura usa códigos únicos por petición (nonces), pero es un cambio
// más delicado que requiere pruebas cuidadosas en vivo -- mientras
// tanto, se permite 'unsafe-inline' para scripts en TODOS los
// ambientes (no solo desarrollo), manteniendo todas las demás
// protecciones intactas (sigue bloqueando iframes ajenos, objetos
// externos, restringe a dónde puede enviarse un formulario, etc.).
const esProduccion = process.env.NODE_ENV === "production";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (esProduccion ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // Corrección 2026-09-03 (tercer bug real encontrado, esta vez en el
// servidor de pruebas): "connect-src 'self' https:" bloqueaba por
// completo las llamadas del frontend al backend ahí -- ese servidor no
// tiene dominio propio ni HTTPS real (se accede directo por IP), así
// que el frontend (puerto 3001) llamando al backend (puerto 3000) es
// una conexión HTTP normal entre dos orígenes distintos, y la política
// solo permitía HTTPS para destinos que no fueran el propio origen. En
// producción esto nunca se nota (ahí todo pasa por el mismo dominio
// con HTTPS real, vía Caddy) -- pero como el servidor de pruebas debe
// poder probar la aplicación igual de bien, se permite también HTTP.
"connect-src 'self' http: https:" + (esProduccion ? "" : " ws:"),
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
