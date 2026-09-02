"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";

interface UsuarioActual {
  sub: string;
  correo: string;
  rol: string;
}

interface EstadoUsuario {
  usuario: UsuarioActual | null;
  cargando: boolean;
}

const UsuarioContext = createContext<EstadoUsuario>({ usuario: null, cargando: true });

/**
 * Corrección 2026-09-03 (auditoría de seguridad de la PWA): antes, el
 * correo y el rol del usuario se leían decodificando el token JWT
 * directamente en el navegador (payloadToken(), en el auth.ts viejo) --
 * eso dejó de ser posible porque el token ahora vive en una cookie
 * HttpOnly, invisible para JavaScript (ver el motivo completo en
 * cookie-sesion.util.ts del backend). Este contexto reemplaza esa
 * lectura local por una sola consulta a GET /auth/perfil (el backend
 * decodifica el token del lado del servidor, donde sí puede leerlo, y
 * devuelve solo los datos que la interfaz necesita mostrar) -- se
 * consulta una única vez al montar el layout autenticado, y se
 * comparte con toda la aplicación desde aquí, en vez de que cada
 * página vuelva a preguntar por su cuenta.
 */
export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    api
      .get<UsuarioActual>("/auth/perfil")
      .then((datos) => {
        if (!cancelado) setUsuario(datos);
      })
      .catch((err) => {
        // 401 ya lo maneja apiFetch (redirige a /login) -- aquí solo
        // evitamos que quede la pantalla cargando indefinidamente si
        // por algún motivo eso no ocurriera.
        if (!cancelado && !(err instanceof ApiError && err.status === 401)) {
          setUsuario(null);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return <UsuarioContext.Provider value={{ usuario, cargando }}>{children}</UsuarioContext.Provider>;
}

export function useUsuarioActual(): EstadoUsuario {
  return useContext(UsuarioContext);
}
