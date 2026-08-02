import { obtenerToken, cerrarSesion } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

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
 * Agrega el token JWT automáticamente (salvo que se pida lo contrario) y
 * normaliza los errores en una única forma (ApiError), incluyendo el caso
 * especial 409 "aclaracionRequerida" que usa el FPJ-5.
 */
export async function apiFetch<T>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const { conAuth = true, headers, ...resto } = opciones;

  const headersFinales: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (conAuth) {
    const token = obtenerToken();
    if (token) {
      headersFinales["Authorization"] = `Bearer ${token}`;
    }
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    headers: headersFinales,
  });

  // Sesión vencida o inválida: forzar login de nuevo.
  if (respuesta.status === 401 && conAuth) {
    cerrarSesion();
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
  put: <T>(ruta: string, body?: unknown, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(ruta: string, body?: unknown, opciones?: OpcionesApi) =>
    apiFetch<T>(ruta, { ...opciones, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(ruta: string, opciones?: OpcionesApi) => apiFetch<T>(ruta, { ...opciones, method: "DELETE" }),
};
