import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PJ | Gestión Digital — Gestión y Documentación Operativa",
  description:
    "Plataforma de gestión documental para procedimientos de captura y aprehensión. Un solo formulario genera FPJ-5, FPJ-6, FPJ-7, FPJ-8 y Acta de Incautación, siempre coherentes entre sí.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
