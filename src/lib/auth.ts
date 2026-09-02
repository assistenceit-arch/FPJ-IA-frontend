// Corrección 2026-09-03 (auditoría de seguridad de la PWA): antes, el
// token JWT vivía en una cookie escrita y leída directamente por
// JavaScript del navegador (document.cookie) -- eso significa que, si
// alguna vez apareciera una vulnerabilidad de inyección de código
// (XSS) en cualquier parte de la aplicación, un atacante podría robar
// la sesión completa de cualquier usuario, incluidos administradores,
// con un simple `document.cookie`. No se encontró ningún vector de XSS
// real en la auditoría, pero esta es una protección de fondo contra
// cualquiera que pudiera aparecer en el futuro.
//
// Ahora, el backend emite el token como una cookie HttpOnly (ver
// cookie-sesion.util.ts del backend) -- invisible para JavaScript del
// navegador, solo el servidor (tanto el de NestJS como proxy.ts de
// Next.js) puede leerla y escribirla. Esto significa que este archivo
// ya NO puede (ni necesita) leer, guardar o borrar el token
// directamente: el navegador se encarga de enviarlo automáticamente en
// cada petición (gracias a `credentials: "include"`, ver api.ts), y el
// propio servidor la crea (al iniciar sesión) o la borra (al cerrar
// sesión).

import { API_URL } from "./api";

// Adenda 2026-08-24 (sin cambios en esta corrección): cierra la sesión
// pidiéndole al backend que borre la cookie -- ya no es algo que el
// navegador pueda hacer por sí solo (tampoco puede borrar una cookie
// HttpOnly, mismo motivo por el que no puede leerla).
export async function cerrarSesion(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Silencioso a propósito: aunque la petición falle (ej. sin
    // conexión), seguimos adelante y redirigimos a /login de todas
    // formas -- la cookie expira sola en un máximo de 8 horas incluso
    // si este borrado explícito no se completó.
  }
}
