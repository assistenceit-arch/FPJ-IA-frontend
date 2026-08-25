// Adenda 2026-08-25: service worker mínimo para la PWA, a solicitud
// del usuario. Diseño deliberadamente conservador: cachea SOLO los
// archivos estáticos inmutables de Next.js (JS/CSS con huella de
// compilación en el nombre, íconos, imágenes de marca) para que la
// segunda carga sea más rápida -- NUNCA cachea la API ni las páginas
// HTML. Esta es una aplicación de formularios con datos que cambian
// todo el tiempo (estado de un procedimiento, días para eliminación
// por retención, etc.); cachear eso sería mostrarle al funcionario
// información desactualizada, que es peor que no tener PWA en
// absoluto. No hay soporte real de "modo offline" para diligenciar
// formularios -- eso sería una funcionalidad mucho más grande, no
// solicitada.

const CACHE_ESTATICOS = "pj-gestion-digital-estaticos-v1";

const RUTAS_CACHEABLES = [/^\/_next\/static\//, /^\/iconos\//, /^\/marca\//];

self.addEventListener("install", (evento) => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_ESTATICOS)
          .map((nombre) => caches.delete(nombre)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const url = new URL(evento.request.url);

  // Solo intercepta peticiones GET al mismo origen -- todo lo demás
  // (API en otro origen, POST/PATCH/DELETE) pasa directo a la red sin
  // que el service worker se meta.
  if (evento.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const esCacheable = RUTAS_CACHEABLES.some((patron) => patron.test(url.pathname));
  if (!esCacheable) {
    return; // páginas, manifest, etc. -- siempre a la red, nunca caché.
  }

  evento.respondWith(
    caches.open(CACHE_ESTATICOS).then(async (cache) => {
      const enCache = await cache.match(evento.request);
      if (enCache) return enCache;

      const respuestaRed = await fetch(evento.request);
      if (respuestaRed.ok) {
        cache.put(evento.request, respuestaRed.clone());
      }
      return respuestaRed;
    }),
  );
});
