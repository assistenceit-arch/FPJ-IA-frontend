import type { MetadataRoute } from "next";

// Adenda 2026-08-25: manifiesto de la PWA, a solicitud del usuario --
// permite instalar la aplicación en la pantalla de inicio del celular
// (Android e iOS), con ícono propio y sin la barra del navegador.
// Convención nativa de Next.js App Router: este archivo se sirve
// automáticamente en /manifest.webmanifest, no hace falta enlazarlo a
// mano en el <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PJ | Gestión Digital",
    short_name: "PJ Gestión",
    description:
      "Gestión documental para procedimientos de captura y aprehensión.",
    start_url: "/procedimientos",
    display: "standalone",
    background_color: "#04101F",
    theme_color: "#04101F",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/iconos/icono-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/iconos/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/iconos/icono-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/iconos/icono-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
