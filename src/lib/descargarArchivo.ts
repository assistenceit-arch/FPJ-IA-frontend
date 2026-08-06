import { obtenerToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

/**
 * Descarga un archivo binario protegido por JWT (el navegador no puede
 * simplemente navegar a la URL porque necesita el header Authorization).
 * Se usa tanto para documentos generados (Bloque 7) como para el
 * comprobante de pago (Bloque 8).
 */
export async function descargarArchivo(ruta: string, nombreSugerido: string): Promise<boolean> {
  try {
    const token = obtenerToken();
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!respuesta.ok) return false;

    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreSugerido;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
