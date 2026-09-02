import { cerrarSesion } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  cuerpo: unknown;

  constructor(status: number, mensaje: string, cuerpo: unknown) {
    super(mensaje);
    this.status = status;
    this.cuerpo = cuerpo;
  }
}

interface OpcionesApi extends RequestInit {
  conAuth?: boolean;
}

/**
 * Cliente HTTP mínimo para hablar con el backend de FPJ IA.
 * Normaliza los errores en una única forma (ApiError), incluyendo el
 * caso especial 409 "aclaracionRequerida" que usa el FPJ-5.
 *
 * Corrección 2026-09-03 (auditoría de seguridad de la PWA): ya no lee
 * el token ni arma el header Authorization a mano -- el navegador
 * envía la cookie de sesión (HttpOnly, invisible para este código)
 * automáticamente en cada petición gracias a `credentials: "include"`.
 * `conAuth` se conserva por compatibilidad de la firma (algunos
 * llamadores todavía lo pasan explícitamente), pero ya no cambia el
 * comportamiento real -- la cookie viaja siempre que exista, sea cual
 * sea su valor.
 */
export async function apiFetch<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const { conAuth = true, headers, ...resto } = opciones;

  // Si el body es FormData (ej. subir un archivo), NO se fija
  // Content-Type: application/json ni "application/json" a secas —
  // el navegador arma el multipart/form-data con el boundary correcto
  // solo si el header Content-Type lo dejamos que lo ponga fetch.
  const esFormData = typeof FormData !== "undefined" && resto.body instanceof FormData;

  const headersFinales: Record<string, string> = {
    ...(esFormData ? {} : { "Content-Type": "application/json" }),
    ...(headers as Record<string, string>),
  };

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    headers: headersFinales,
    credentials: "include",
  });

  // Sesión vencida o inválida: forzar login de nuevo.
  if (respuesta.status === 401 && conAuth) {
    void cerrarSesion();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const contentType = respuesta.headers.get("content-type") ?? "";
  const cuerpo = contentType.includes("application/json") ? await respuesta.json() : null;

  if (!respuesta.ok) {
    const mensaje =
      (cuerpo as { message?: string })?.message ?? `Error ${respuesta.status} al llamar ${ruta}`;
    throw new ApiError(respuesta.status, mensaje, cuerpo);
  }

  return cuerpo as T;
}

export const api = {
  get: <T>(ruta: string, opciones?: OpcionesApi) => apiFetch<T>(ruta, { ...opciones, method: "GET" }),
  post: <T>(ruta: string, body?: unknown, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  // Para endpoints que reciben un archivo (multipart/form-data), ej.
  // registrar el pago con el comprobante adjunto.
  postFormData: <T>(ruta: string, formData: FormData, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "POST", body: formData }),
  put: <T>(ruta: string, body?: unknown, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(ruta: string, body?: unknown, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(ruta: string, opciones?: OpcionesApi) => apiFetch<T>(ruta, { ...opciones, method: "DELETE" }),
};
