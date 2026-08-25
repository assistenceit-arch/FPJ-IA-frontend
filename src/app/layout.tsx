import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistroServiceWorker } from "@/components/RegistroServiceWorker";

export const metadata: Metadata = {
  title: "PJ | Gestión Digital — Gestión y Documentación Operativa",
  description:
    "Plataforma de gestión documental para procedimientos de captura y aprehensión. Un solo formulario genera FPJ-5, FPJ-6, FPJ-7, FPJ-8 y Acta de Incautación, siempre coherentes entre sí.",
  // Adenda 2026-08-25: PWA -- iOS no lee manifest.webmanifest para el
  // ícono de instalación ni para el modo "standalone", necesita estas
  // etiquetas propias de Apple además del manifiesto estándar.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PJ Gestión",
  },
  icons: {
    icon: "/iconos/icono-512.png",
    apple: "/iconos/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#04101F",
  width: "device-width",
  initialScale: 1,
  // Adenda 2026-08-25: máximo 1 (sin zoom) es una elección deliberada
  // para que se sienta como una app nativa en modo instalado -- el
  // formulario ya usa tamaños de fuente legibles sin necesidad de
  // zoom manual.
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <RegistroServiceWorker />
      </body>
    </html>
  );
}
