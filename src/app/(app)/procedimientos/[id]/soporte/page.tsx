"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

// Adenda 2026-09-07, a solicitud del usuario: Bloque 9 -- "Soporte".
// Puramente informativo (sin ningún dato que el funcionario diligencie
// aquí), muestra el teléfono y correo de contacto que un administrador
// ya configura en el panel (misma fuente que ya se usa en el Bloque 7
// para procedimientos complejos -- GET /configuracion-pagos, accesible
// para cualquier funcionario, no solo administradores). Es
// deliberadamente el ÚNICO bloque que se puede consultar incluso
// cuando el procedimiento está bloqueado (por documentos generados, o
// por ser complejo sin pago verificado aún) -- ver layout.tsx, donde
// se excluye explícitamente de ambas restricciones.
interface ConfiguracionContacto {
  contactoTelefono: string | null;
  contactoCorreo: string | null;
}

export default function BloqueSoporte() {
  const { id } = useParams<{ id: string }>();
  const [configuracion, setConfiguracion] = useState<ConfiguracionContacto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    api
      .get<ConfiguracionContacto | null>(`/configuracion-pagos`)
      .catch(() => null)
      .then((datos) => {
        if (!cancelado) {
          setConfiguracion(datos);
          setCargando(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return (
    <div>
      <h1 className="font-display text-2xl text-institucional-950">9. Soporte</h1>
      <p className="mt-1 font-sans text-sm text-institucional-700">
        ¿Tienes alguna duda o inconveniente con la plataforma? Este es el canal directo con el
        equipo administrativo.
      </p>

      <div className="mt-6 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
        {cargando ? (
          <p className="font-sans text-sm text-institucional-700">Cargando…</p>
        ) : configuracion?.contactoTelefono || configuracion?.contactoCorreo ? (
          <div className="space-y-4">
            {configuracion.contactoTelefono && (
              <div>
                <p className="font-sans text-sm text-institucional-700">Línea de contacto</p>
                <p className="font-display text-xl text-institucional-950">
                  {configuracion.contactoTelefono}
                </p>
              </div>
            )}
            {configuracion.contactoCorreo && (
              <div>
                <p className="font-sans text-sm text-institucional-700">Correo electrónico</p>
                <a
                  href={`mailto:${configuracion.contactoCorreo}`}
                  className="font-display text-xl text-acento hover:underline"
                >
                  {configuracion.contactoCorreo}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="font-sans text-sm text-institucional-700">
            Aún no hay un canal de soporte configurado. Consulta con un administrador.
          </p>
        )}
      </div>
    </div>
  );
}
