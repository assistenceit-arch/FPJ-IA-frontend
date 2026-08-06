// El token se guarda en una cookie (no en localStorage) para que el
// middleware de Next.js pueda leerla en el servidor y proteger rutas
// completas antes de que la página llegue a renderizarse.
const NOMBRE_COOKIE = "fpj_ia_token";

// Coincide con la expiración real del token en el backend (8h,
// src/auth/auth.module.ts). Si eso cambia allá, hay que actualizarlo aquí.
const HORAS_EXPIRACION = 8;

export function guardarToken(token: string) {
  const expira = new Date(Date.now() + HORAS_EXPIRACION * 60 * 60 * 1000);
  document.cookie = `${NOMBRE_COOKIE}=${token}; expires=${expira.toUTCString()}; path=/; SameSite=Lax`;
}

export function obtenerToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${NOMBRE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function cerrarSesion() {
  document.cookie = `${NOMBRE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/** Decodifica el payload del JWT sin verificar la firma (solo para leer
 * datos en el cliente, ej. el correo o el rol a mostrar; la verificación
 * real siempre la hace el backend — cualquier endpoint sensible por rol
 * ya está protegido allá con @Roles, esto es solo para mostrar/ocultar
 * partes de la interfaz). */
export function payloadToken(): { sub: string; correo: string; rol: string } | null {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
