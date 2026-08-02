import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPJ IA — Gestión Documental de Policía Judicial",
  description:
    "Plataforma inteligente de gestión documental de Policía Judicial. Automatiza la generación de FPJ-5, FPJ-6, FPJ-7, FPJ-8 y Acta de Incautación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
