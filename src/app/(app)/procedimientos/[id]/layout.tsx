"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  ActuacionesProcedimiento,
  EstadoBloque,
  FuncionarioActuante,
  LugarProcedimiento,
  Procedimiento,
} from "@/lib/tipos";
import {
  estadoActuaciones,
  estadoDocumentos,
  estadoElementos,
  estadoFuncionario,
  estadoIntervinientes,
  estadoLugar,
  estadoRelato,
  PUNTO_ESTADO,
} from "@/lib/estados";

interface ItemBloque {
  slug: string;
  numero: number;
  titulo: string;
  estado: EstadoBloque;
}

interface CapturadoResumen {
  id: string;
  tipoInterviniente: "CAPTURADO" | "APREHENDIDO";
  usoEsposas: boolean | null;
  justificacionEsposas: string | null;
}

export default function LayoutProcedimiento({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const [bloques, setBloques] = useState<ItemBloque[] | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstados() {
      // Cada bloque se consulta de forma independiente y tolerante a
      // fallos: si un módulo todavía no tiene datos (o su endpoint aún
      // está en construcción), no debe romper la navegación de los demás.
      const [funcionario, lugar, capturados, actuaciones, procedimiento, documentos] = await Promise.all([
        api.get<FuncionarioActuante | null>(`/procedimientos/${id}/funcionario-actuante`).catch(() => null),
        api.get<LugarProcedimiento | null>(`/procedimientos/${id}/lugar-procedimiento`).catch(() => null),
        api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`).catch(() => null),
        api.get<ActuacionesProcedimiento | null>(`/procedimientos/${id}/actuaciones-procedimiento`).catch(() => null),
        api.get<Procedimiento>(`/procedimientos/${id}`).catch(() => null),
        api.get<unknown[]>(`/procedimientos/${id}/documentos`).catch(() => null),
      ]);

      // El total de elementos incautados se calcula sumando los de cada
      // interviniente (no hay un endpoint agregado a nivel de
      // procedimiento). Si no hay intervinientes todavía, queda en null
      // (= "vacío"), igual que Intervinientes.
      let cantidadElementos: number | null = null;
      if (capturados && capturados.length > 0) {
        const listas = await Promise.all(
          capturados.map((c) =>
            api.get<unknown[]>(`/procedimientos/${id}/capturados/${c.id}/elementos`).catch(() => []),
          ),
        );
        cantidadElementos = listas.reduce((total, lista) => total + lista.length, 0);
      } else if (capturados && capturados.length === 0) {
        cantidadElementos = 0;
      }

      if (cancelado) return;

      setBloques([
        { slug: "funcionario", numero: 1, titulo: "Funcionario y compañero", estado: estadoFuncionario(funcionario) },
        {
          slug: "intervinientes",
          numero: 2,
          titulo: "Intervinientes",
          estado: estadoIntervinientes(capturados?.length ?? null),
        },
        { slug: "lugar", numero: 3, titulo: "Lugar del procedimiento", estado: estadoLugar(lugar) },
        { slug: "elementos", numero: 4, titulo: "Elementos incautados", estado: estadoElementos(cantidadElementos) },
        {
          slug: "actuaciones",
          numero: 5,
          titulo: "Actuaciones procedimentales",
          estado: estadoActuaciones(
            actuaciones,
            procedimiento,
            (capturados ?? []).filter((c) => c.tipoInterviniente === "APREHENDIDO"),
          ),
        },
        { slug: "relato", numero: 6, titulo: "Relato de los hechos", estado: estadoRelato(actuaciones) },
        {
          slug: "documentos",
          numero: 7,
          titulo: "Documentos",
          estado: estadoDocumentos(documentos?.length ?? null),
        },
      ]);
    }

    void cargarEstados();
    return () => {
      cancelado = true;
    };
    // Recalcula cada vez que cambia de bloque, para reflejar guardados recientes.
  }, [id, pathname]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Link href="/procedimientos" className="font-sans text-sm text-institucional-700 hover:underline">
          ← Mis procedimientos
        </Link>
        <nav className="mt-4 space-y-1 rounded-lg border border-institucional-100 bg-white p-2 shadow-sm">
          {(bloques ?? []).map((bloque) => {
            const activo = pathname.endsWith(`/${bloque.slug}`);
            const punto = PUNTO_ESTADO[bloque.estado];
            return (
              <Link
                key={bloque.slug}
                href={`/procedimientos/${id}/${bloque.slug}`}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 font-sans text-sm transition-colors ${
                  activo
                    ? "bg-institucional-950 text-institucional-50"
                    : "text-institucional-900 hover:bg-institucional-50"
                }`}
              >
                <span aria-hidden>{punto.emoji}</span>
                <span className="flex-1">
                  <span className={activo ? "text-institucional-100/60" : "text-institucional-700"}>
                    {bloque.numero}.{" "}
                  </span>
                  {bloque.titulo}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
