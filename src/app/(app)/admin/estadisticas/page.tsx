"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Adenda 2026-09-03, a solicitud del usuario: reemplaza por completo
// la versión anterior (que incluía "casos por funcionario") -- ahora
// son exactamente estas 6 métricas, sin ninguna de más.
interface Estadisticas {
  total: number;
  porDelito: { delito: string; cantidad: number }[];
  porTipo: { tipo: string; cantidad: number }[];
  porEstacion: { estacion: string; cantidad: number }[];
  porDepartamento: { departamento: string; cantidad: number }[];
  porMunicipio: { municipio: string; cantidad: number }[];
  porLocalidad: { localidad: string; cantidad: number }[];
}

type Periodo = "dia" | "semana" | "mes" | "año";

// Adenda 2026-09-02, a solicitud del usuario: el backend recibe un
// rango de fechas genérico (desde/hasta) -- es aquí, en el frontend,
// donde se traduce la selección de "día/semana/mes/año" al rango real,
// usando siempre la hora local del navegador del administrador.
function calcularRango(periodo: Periodo): { desde: string; hasta: string } {
  const ahora = new Date();
  const hasta = new Date(ahora);
  hasta.setHours(23, 59, 59, 999);

  const desde = new Date(ahora);
  desde.setHours(0, 0, 0, 0);

  if (periodo === "semana") {
    desde.setDate(desde.getDate() - 6);
  } else if (periodo === "mes") {
    desde.setDate(1);
  } else if (periodo === "año") {
    desde.setMonth(0, 1);
  }

  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

const COLORES = ["#1E3A5F", "#D4A537", "#2F855A", "#C53030", "#6B46C1", "#0987A0"];

/** Tabla simple, ordenada de mayor a menor -- para las 4 métricas que
 * pueden crecer a muchas categorías (departamento, municipio,
 * localidad, estación), donde una gráfica se vuelve difícil de leer. */
function TablaEstadistica({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { etiqueta: string; cantidad: number }[];
}) {
  return (
    <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
      <h2 className="font-sans text-sm font-semibold text-institucional-950">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-institucional-700">Sin datos en este período.</p>
      ) : (
        <table className="mt-4 w-full font-sans text-sm">
          <tbody>
            {filas.map((f) => (
              <tr key={f.etiqueta} className="border-b border-institucional-50">
                <td className="py-2 text-institucional-900">{f.etiqueta}</td>
                <td className="py-2 text-right font-semibold text-institucional-950">{f.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PaginaEstadisticas() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [datos, setDatos] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (p: Periodo) => {
    setCargando(true);
    setError(null);
    try {
      const { desde, hasta } = calcularRango(p);
      const resultado = await api.get<Estadisticas>(
        `/admin/estadisticas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
      );
      setDatos(resultado);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible cargar las estadísticas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(periodo);
  }, [periodo, cargar]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="font-sans text-sm text-institucional-700 hover:underline">
        ← Volver al panel de administración
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-institucional-950">Estadísticas</h1>
        <div className="flex gap-2">
          {(["dia", "semana", "mes", "año"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-md border px-3 py-1.5 font-sans text-sm capitalize transition-colors ${
                periodo === p
                  ? "border-institucional-800 bg-institucional-800 text-white"
                  : "border-institucional-100 bg-white text-institucional-800 hover:bg-institucional-50"
              }`}
            >
              {p === "dia" ? "Hoy" : p === "semana" ? "Últimos 7 días" : p === "mes" ? "Este mes" : "Este año"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-sans text-sm text-estado-error">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="mt-10 font-sans text-sm text-institucional-700">Cargando…</p>
      ) : datos ? (
        <div className="mt-6 space-y-8">
          <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
            <p className="font-sans text-sm text-institucional-700">Total de procedimientos en el período</p>
            <p className="font-display text-4xl text-institucional-950">{datos.total}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
              <h2 className="font-sans text-sm font-semibold text-institucional-950">
                Delitos más generados
              </h2>
              {datos.porDelito.length === 0 ? (
                <p className="mt-4 font-sans text-sm text-institucional-700">Sin datos en este período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datos.porDelito} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="delito" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
              <h2 className="font-sans text-sm font-semibold text-institucional-950">
                Estándar vs. Complejos
              </h2>
              {datos.porTipo.length === 0 ? (
                <p className="mt-4 font-sans text-sm text-institucional-700">Sin datos en este período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={datos.porTipo}
                      dataKey="cantidad"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entrada: { name?: string; value?: number }) =>
                        `${entrada.name}: ${entrada.value}`
                      }
                    >
                      {datos.porTipo.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TablaEstadistica
              titulo="Casos por departamento"
              filas={datos.porDepartamento.map((d) => ({ etiqueta: d.departamento, cantidad: d.cantidad }))}
            />
            <TablaEstadistica
              titulo="Casos por municipio"
              filas={datos.porMunicipio.map((m) => ({ etiqueta: m.municipio, cantidad: m.cantidad }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TablaEstadistica
              titulo="Casos por localidad / comuna"
              filas={datos.porLocalidad.map((l) => ({ etiqueta: l.localidad, cantidad: l.cantidad }))}
            />
            <TablaEstadistica
              titulo="Casos por estación"
              filas={datos.porEstacion.map((e) => ({ etiqueta: e.estacion, cantidad: e.cantidad }))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
