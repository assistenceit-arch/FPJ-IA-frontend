"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
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
  estadoPago,
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
  presentaLesiones: boolean | null;
  descripcionLesiones: string | null;
  trasladoCentroAsistencial: boolean | null;
  centroAsistencial: string | null;
  motivoTraslado: string | null;
}

export default function LayoutProcedimiento({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [bloques, setBloques] = useState<ItemBloque[] | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoPorPagoComplejo, setBloqueadoPorPagoComplejo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstados() {
      // Cada bloque se consulta de forma independiente y tolerante a
      // fallos: si un módulo todavía no tiene datos (o su endpoint aún
      // está en construcción), no debe romper la navegación de los demás.
      const [funcionario, lugar, capturados, actuaciones, procedimiento, documentos, pago] = await Promise.all([
        api.get<FuncionarioActuante | null>(`/procedimientos/${id}/funcionario-actuante`).catch(() => null),
        api.get<LugarProcedimiento | null>(`/procedimientos/${id}/lugar-procedimiento`).catch(() => null),
        api.get<CapturadoResumen[]>(`/procedimientos/${id}/capturados`).catch(() => null),
        api.get<ActuacionesProcedimiento | null>(`/procedimientos/${id}/actuaciones-procedimiento`).catch(() => null),
        api.get<Procedimiento>(`/procedimientos/${id}`).catch(() => null),
        api.get<unknown[]>(`/procedimientos/${id}/documentos`).catch(() => null),
        api.get<{ estadoPago: string } | null>(`/procedimientos/${id}/pago`).catch(() => null),
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

      // Adenda 2026-08-06: en cuanto hay al menos un documento generado,
      // el backend congela la edición de todos los datos base del
      // procedimiento (ver ProcedimientoAccesoService.verificarNoBloqueado).
      setBloqueado((documentos?.length ?? 0) > 0);

      // Adenda 2026-08-08: en un procedimiento COMPLEJO, los Bloques 1 a
      // 7 quedan deshabilitados hasta que un administrador verifique el
      // pago (o el procedimiento sea exonerado) — ver
      // ProcedimientoAccesoService.verificarPagoComplejoAprobado en el
      // backend, que es quien realmente hace cumplir esto.
      const esComplejoSinPagar =
        procedimiento?.tipoProcedimiento === "COMPLEJO" &&
        !procedimiento?.exoneradoPago &&
        pago?.estadoPago !== "Verificado";
      setBloqueadoPorPagoComplejo(esComplejoSinPagar);

      // Si el usuario está en un bloque que quedó deshabilitado (llegó
      // por URL directa, o el pago se rechazó mientras estaba ahí), se
      // lo redirige al Bloque 8 — el backend lo rechazaría de todas
      // formas, esto solo evita mostrarle un formulario inútil.
      if (esComplejoSinPagar && !pathname.endsWith("/pago")) {
        router.replace(`/procedimientos/${id}/pago`);
        return;
      }

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
            capturados ?? [],
          ),
        },
        { slug: "relato", numero: 6, titulo: "Relato de los hechos", estado: estadoRelato(actuaciones) },
        {
          slug: "documentos",
          numero: 7,
          titulo: "Documentos",
          estado: estadoDocumentos(documentos?.length ?? null),
        },
        {
          slug: "pago",
          numero: 8,
          titulo: "Pago",
          estado: estadoPago(pago, procedimiento?.exoneradoPago),
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
            const deshabilitado = bloqueadoPorPagoComplejo && bloque.slug !== "pago";

            if (deshabilitado) {
              return (
                <span
                  key={bloque.slug}
                  title="Deshabilitado hasta que un administrador verifique el pago"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2.5 font-sans text-sm text-institucional-700/40"
                >
                  <span aria-hidden>🔒</span>
                  <span className="flex-1">
                    <span className="text-institucional-700/40">{bloque.numero}. </span>
                    {bloque.titulo}
                  </span>
                </span>
              );
            }

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
      <section>
        {bloqueadoPorPagoComplejo && (
          <div className="mb-4 rounded-md border border-acento/30 bg-acento/10 px-4 py-3 font-sans text-sm text-institucional-900">
            🔒 Este es un procedimiento <strong>complejo</strong>. Los Bloques 1 a 7 quedan
            deshabilitados hasta que un administrador verifique el pago (Bloque 8) — una vez
            verificado, podrás diligenciar el resto de la información con normalidad.
          </div>
        )}
        {bloqueado && (
          <div className="mb-4 rounded-md border border-acento/30 bg-acento/10 px-4 py-3 font-sans text-sm text-institucional-900">
            🔒 Este procedimiento ya generó documentos oficiales y quedó <strong>bloqueado para edición</strong>.
            Los datos de los Bloques 1 a 6 ya no se pueden modificar — solo puedes descargar los
            documentos existentes en el Bloque 7.
          </div>
        )}
        {children}
      </section>
    </div>
  );
}
