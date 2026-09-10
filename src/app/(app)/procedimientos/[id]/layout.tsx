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
  derechosLeidos: boolean | null;
  fechaCaptura: string | null;
  horaCaptura: string | null;
  comprendeDerechos: boolean | null;
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
  const [edicionDesbloqueada, setEdicionDesbloqueada] = useState(false);
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
      // interviniente MÁS los "sin individualizar" (no hay un endpoint
      // agregado a nivel de procedimiento). Si no hay intervinientes
      // todavía, queda en null (= "vacío"), igual que Intervinientes.
      let cantidadElementos: number | null = null;
      if (capturados && capturados.length > 0) {
        const [listas, colectivos] = await Promise.all([
          Promise.all(
            capturados.map((c) =>
              api.get<unknown[]>(`/procedimientos/${id}/capturados/${c.id}/elementos`).catch(() => []),
            ),
          ),
          api.get<unknown[]>(`/procedimientos/${id}/elementos-colectivos`).catch(() => []),
        ]);
        cantidadElementos = listas.reduce((total, lista) => total + lista.length, colectivos.length);
      } else if (capturados && capturados.length === 0) {
        cantidadElementos = 0;
      }

      if (cancelado) return;

      // Adenda 2026-08-06: en cuanto hay al menos un documento generado,
      // el backend congela la edición de todos los datos base del
      // procedimiento (ver ProcedimientoAccesoService.verificarNoBloqueado).
      // Adenda 2026-08-13: salvo que un administrador haya desbloqueado
      // puntualmente la edición (procedimiento.edicionDesbloqueada) --
      // en ese caso el backend ya no exige el bloqueo, así que este
      // banner tampoco debe mostrarlo como bloqueado.
      setBloqueado((documentos?.length ?? 0) > 0 && !procedimiento?.edicionDesbloqueada);
      setEdicionDesbloqueada(procedimiento?.edicionDesbloqueada ?? false);

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
      // "soporte" queda exento a propósito -- es el único bloque que
      // debe poder consultarse incluso en este estado (a solicitud del
      // usuario: si algo va mal con el pago, es justo cuando más
      // podría necesitar contactar a soporte).
      if (esComplejoSinPagar && !pathname.endsWith("/pago") && !pathname.endsWith("/soporte")) {
        router.replace(`/procedimientos/${id}/pago`);
        return;
      }

      setBloques([
        { slug: "funcionario", numero: 1, titulo: "Funcionario y compañero", estado: estadoFuncionario(funcionario) },
        {
          slug: "intervinientes",
          numero: 2,
          titulo: "Capturados/Aprehendidos",
          estado: estadoIntervinientes(capturados?.length ?? null),
        },
        { slug: "lugar", numero: 3, titulo: "Lugar del procedimiento", estado: estadoLugar(lugar) },
        {
          slug: "actuaciones",
          numero: 4,
          titulo: "Actuaciones procedimentales",
          estado: estadoActuaciones(
            actuaciones,
            procedimiento,
            capturados ?? [],
          ),
        },
        {
          slug: "elementos",
          numero: 5,
          titulo: "Elementos incautados",
          estado: estadoElementos(cantidadElementos, procedimiento?.sinElementosIncautados),
        },
        { slug: "relato", numero: 6, titulo: "Relato de los hechos", estado: estadoRelato(actuaciones) },
        {
          slug: "pago",
          numero: 7,
          titulo: "Pago",
          estado: estadoPago(pago, procedimiento?.exoneradoPago),
        },
        {
          slug: "documentos",
          numero: 8,
          titulo: "Documentos",
          estado: estadoDocumentos(documentos?.length ?? null),
        },
        // Adenda 2026-09-07, a solicitud del usuario: Bloque 9,
        // puramente informativo -- siempre "completo", ya que no hay
        // nada que el funcionario deba diligenciar aquí.
        { slug: "soporte", numero: 9, titulo: "Soporte", estado: "completo" },
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
            // "soporte" nunca se muestra deshabilitado -- a solicitud
            // del usuario, es el único bloque que debe poder
            // consultarse incluso en un procedimiento complejo sin
            // pago verificado (mismo criterio que "pago" en sí mismo).
            const deshabilitado =
              bloqueadoPorPagoComplejo && bloque.slug !== "pago" && bloque.slug !== "soporte";

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
            🔒 Este es un procedimiento <strong>complejo</strong>. Los demás bloques quedan
            deshabilitados hasta que un administrador verifique el pago (Bloque 7) — una vez
            verificado, podrás diligenciar el resto de la información con normalidad. Mientras
            tanto, puedes consultar el Bloque 9 (Soporte) si necesitas ayuda.
          </div>
        )}
        {bloqueado && (
          <div className="mb-4 rounded-md border border-acento/30 bg-acento/10 px-4 py-3 font-sans text-sm text-institucional-900">
            🔒 Este procedimiento ya generó documentos oficiales y quedó <strong>bloqueado para edición</strong>.
            Los datos de los Bloques 1 a 6 ya no se pueden modificar — solo puedes descargar los
            documentos existentes en el Bloque 8, o consultar el Bloque 9 (Soporte).
          </div>
        )}
        {edicionDesbloqueada && (
          <div className="mb-4 rounded-md border border-estado-error/30 bg-estado-error/10 px-4 py-3 font-sans text-sm text-institucional-900">
            🔓 Un administrador desbloqueó temporalmente la edición de este procedimiento. Puedes
            corregir la información de los Bloques 1 a 6, eliminar capturados/aprehendidos o elementos, y
            regenerar los documentos del Bloque 8 con la información corregida. Avisa al
            administrador cuando termines para que vuelva a bloquearlo.
          </div>
        )}
        {children}

        {/* Adenda 2026-09-01, a solicitud del usuario: botones de
            navegación secuencial entre bloques, para que sea más
            intuitivo pasar de uno a otro sin depender únicamente del
            menú lateral. IMPORTANTE (WF-M1-007/008): esto es solo un
            atajo adicional -- la navegación libre directa a cualquier
            bloque (vía el menú, o una URL directa) sigue disponible
            sin ningún paso obligatorio. Si el bloque siguiente está
            bloqueado por pago pendiente (procedimiento complejo), el
            botón se deshabilita igual que en el menú lateral, para no
            prometer un acceso que el backend de todas formas
            rechazaría. */}
        {bloques && bloques.length > 0 && (
          <NavegacionEntreBloques
            procedimientoId={id}
            bloques={bloques}
            pathname={pathname}
            bloqueadoPorPagoComplejo={bloqueadoPorPagoComplejo}
          />
        )}
      </section>
    </div>
  );
}

function NavegacionEntreBloques({
  procedimientoId,
  bloques,
  pathname,
  bloqueadoPorPagoComplejo,
}: {
  procedimientoId: string;
  bloques: ItemBloque[];
  pathname: string;
  bloqueadoPorPagoComplejo: boolean;
}) {
  const indiceActual = bloques.findIndex((b) => pathname.endsWith(`/${b.slug}`));
  if (indiceActual === -1) return null;

  const anterior = indiceActual > 0 ? bloques[indiceActual - 1] : null;
  const siguiente = indiceActual < bloques.length - 1 ? bloques[indiceActual + 1] : null;
  // El Bloque 7 (Pago) nunca queda bloqueado -- es precisamente el que
  // hay que diligenciar para desbloquear los demás.
  const siguienteBloqueado =
    siguiente !== null && bloqueadoPorPagoComplejo && siguiente.slug !== "pago";

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-institucional-100 pt-6">
      {anterior ? (
        <Link
          href={`/procedimientos/${procedimientoId}/${anterior.slug}`}
          className="rounded-md border border-institucional-100 bg-white px-4 py-2.5 font-sans text-sm text-institucional-900 shadow-sm transition-colors hover:bg-institucional-50"
        >
          ← Volver a {anterior.titulo}
        </Link>
      ) : (
        <Link
          href="/procedimientos"
          className="rounded-md border border-institucional-100 bg-white px-4 py-2.5 font-sans text-sm text-institucional-900 shadow-sm transition-colors hover:bg-institucional-50"
        >
          ← Volver a Mis procedimientos
        </Link>
      )}

      {siguiente &&
        (siguienteBloqueado ? (
          <span
            title="Deshabilitado hasta que un administrador verifique el pago"
            className="cursor-not-allowed rounded-md border border-institucional-100 bg-institucional-50 px-4 py-2.5 font-sans text-sm text-institucional-700/40"
          >
            🔒 Pasar a {siguiente.titulo}
          </span>
        ) : (
          <Link
            href={`/procedimientos/${procedimientoId}/${siguiente.slug}`}
            className="rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover"
          >
            Pasar a {siguiente.titulo} →
          </Link>
        ))}
    </div>
  );
}
