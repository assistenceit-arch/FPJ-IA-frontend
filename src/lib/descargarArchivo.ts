import { API_URL } from "./api";

/**
 * Descarga un archivo binario protegido por sesión (el navegador no
 * puede simplemente navegar a la URL porque necesita las credenciales).
 * Se usa tanto para documentos generados (Bloque 7) como para el
 * comprobante de pago (Bloque 8).
 *
 * Corrección 2026-09-03 (auditoría de seguridad de la PWA): ya no lee
 * el token ni arma el header Authorization a mano -- el navegador
 * envía la cookie de sesión (HttpOnly) automáticamente gracias a
 * `credentials: "include"`.
 */
export async function descargarArchivo(ruta: string, nombreSugerido: string): Promise<boolean> {
  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, { credentials: "include" });
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
