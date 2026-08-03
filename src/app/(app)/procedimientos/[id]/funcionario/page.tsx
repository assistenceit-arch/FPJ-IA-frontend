"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { FuncionarioActuante, CompaneroPatrulla } from "@/lib/tipos";

const ENTIDADES = ["Policía Nacional", "CTI Fiscalía", "Migración Colombia", "Ejército Nacional", "Otra"];
const SERVICIOS = [
  "Labores de Patrullaje",
  "Verificación de Antecedentes",
  "Registro a Personas",
  "Puesto de Control",
  "Solicitud de Antecedentes",
  "Apoyo a Otra Unidad",
  "Actividad Preventiva",
  "Otra",
];

const FUNCIONARIO_VACIO: FuncionarioActuante = {
  nombreCompleto: "",
  documento: "",
  entidad: ENTIDADES[0],
  cargo: "",
  telefono: "",
  correo: "",
  placa: "",
  zonaAtencion: "",
  estacion: "",
  servicio: SERVICIOS[0],
  cai: "",
};

const COMPANERO_VACIO: CompaneroPatrulla = { nombreCompleto: "", documento: "", placa: "", grado: "" };

function Campo({
  etiqueta,
  requerido,
  children,
}: {
  etiqueta: string;
  requerido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
        {etiqueta}
        {requerido && <span className="text-estado-error"> *</span>}
      </span>
      {children}
    </label>
  );
}

const claseInput =
  "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

export default function BloqueFuncionario() {
  const { id } = useParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [funcionario, setFuncionario] = useState<FuncionarioActuante>(FUNCIONARIO_VACIO);
  const [servicioOtro, setServicioOtro] = useState("");
  const [companero, setCompanero] = useState<CompaneroPatrulla | null>(null);
  const [tieneCompanero, setTieneCompanero] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    Promise.all([
      api.get<FuncionarioActuante | null>(`/procedimientos/${id}/funcionario-actuante`).catch(() => null),
      api.get<CompaneroPatrulla | null>(`/procedimientos/${id}/companero-patrulla`).catch(() => null),
    ]).then(([f, c]) => {
      if (cancelado) return;
      if (f) {
        setFuncionario({
          ...FUNCIONARIO_VACIO,
          ...soloClaves(f, [
            "nombreCompleto",
            "documento",
            "entidad",
            "cargo",
            "telefono",
            "correo",
            "placa",
            "zonaAtencion",
            "estacion",
            "servicio",
            "cai",
          ]),
        });
      }
      if (c) {
        setCompanero(soloClaves(c, ["nombreCompleto", "documento", "placa", "grado"]));
        setTieneCompanero(true);
      }
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardarFuncionario = useCallback(
    async (datos: FuncionarioActuante) => {
      const requeridos = [
        datos.nombreCompleto,
        datos.documento,
        datos.entidad,
        datos.cargo,
        datos.telefono,
        datos.correo,
        datos.placa,
        datos.zonaAtencion,
        datos.estacion,
        datos.servicio,
      ];
      if (!requeridos.every((v) => v && v.trim())) return; // aún incompleto: no intentar guardar
      try {
        await api.put(`/procedimientos/${id}/funcionario-actuante`, datos);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No fue posible guardar el funcionario.");
        throw err;
      }
    },
    [id],
  );
  const { estado: estadoGuardadoFuncionario } = useAutoguardado(funcionario, guardarFuncionario, {
    activo: !cargando,
  });

  const guardarCompanero = useCallback(
    async (datos: CompaneroPatrulla | null) => {
      if (!datos) return;
      const requeridos = [datos.nombreCompleto, datos.documento, datos.placa];
      if (!requeridos.every((v) => v && v.trim())) return;
      await api.put(`/procedimientos/${id}/companero-patrulla`, datos);
    },
    [id],
  );
  const { estado: estadoGuardadoCompanero } = useAutoguardado(companero, guardarCompanero, {
    activo: !cargando && tieneCompanero,
  });

  async function quitarCompanero() {
    setTieneCompanero(false);
    setCompanero(null);
    try {
      await api.delete(`/procedimientos/${id}/companero-patrulla`);
    } catch {
      // si nunca se había guardado, el DELETE puede fallar sin problema
    }
  }

  if (cargando) {
    return <p className="font-sans text-sm text-institucional-700">Cargando…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-institucional-950">1. Funcionario que realiza el procedimiento</h1>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Todos los campos son obligatorios.
            </p>
          </div>
          <IndicadorGuardado estado={estadoGuardadoFuncionario} />
        </div>

        {error && (
          <p role="alert" className="mt-3 font-sans text-sm text-estado-error">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm sm:grid-cols-2">
          <Campo etiqueta="Nombres y apellidos" requerido>
            <input
              className={claseInput}
              value={funcionario.nombreCompleto}
              onChange={(e) => setFuncionario({ ...funcionario, nombreCompleto: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Número de identificación" requerido>
            <input
              className={claseInput}
              value={funcionario.documento}
              onChange={(e) => setFuncionario({ ...funcionario, documento: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Entidad" requerido>
            <select
              className={claseInput}
              value={funcionario.entidad}
              onChange={(e) => setFuncionario({ ...funcionario, entidad: e.target.value })}
            >
              {ENTIDADES.map((op) => (
                <option key={op}>{op}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Cargo" requerido>
            <input
              className={claseInput}
              value={funcionario.cargo}
              onChange={(e) => setFuncionario({ ...funcionario, cargo: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Placa policial" requerido>
            <input
              className={claseInput}
              value={funcionario.placa}
              onChange={(e) => setFuncionario({ ...funcionario, placa: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Zona de atención" requerido>
            <input
              className={claseInput}
              value={funcionario.zonaAtencion}
              onChange={(e) => setFuncionario({ ...funcionario, zonaAtencion: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Estación de policía" requerido>
            <input
              className={claseInput}
              value={funcionario.estacion}
              onChange={(e) => setFuncionario({ ...funcionario, estacion: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="CAI">
            <input
              className={claseInput}
              value={funcionario.cai ?? ""}
              onChange={(e) => setFuncionario({ ...funcionario, cai: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Teléfono celular" requerido>
            <input
              className={claseInput}
              value={funcionario.telefono}
              onChange={(e) => setFuncionario({ ...funcionario, telefono: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Correo electrónico" requerido>
            <input
              type="email"
              className={claseInput}
              value={funcionario.correo}
              onChange={(e) => setFuncionario({ ...funcionario, correo: e.target.value })}
            />
          </Campo>

          <div className="sm:col-span-2">
            <Campo etiqueta="Servicio que se encontraba prestando al momento de los hechos" requerido>
              <select
                className={claseInput}
                value={SERVICIOS.includes(funcionario.servicio) ? funcionario.servicio : "Otra"}
                onChange={(e) => {
                  const valor = e.target.value;
                  setFuncionario({ ...funcionario, servicio: valor === "Otra" ? servicioOtro : valor });
                }}
              >
                {SERVICIOS.map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
            </Campo>
            {!SERVICIOS.slice(0, -1).includes(funcionario.servicio) && (
              <div className="mt-2">
                <Campo etiqueta="Describa el servicio" requerido>
                  <input
                    className={claseInput}
                    value={servicioOtro}
                    onChange={(e) => {
                      setServicioOtro(e.target.value);
                      setFuncionario({ ...funcionario, servicio: e.target.value });
                    }}
                  />
                </Campo>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-institucional-950">Compañero de patrulla</h2>
            <p className="mt-1 font-sans text-sm text-institucional-700">
              Opcional — hay procedimientos que se adelantan sin compañero.
            </p>
          </div>
          <IndicadorGuardado estado={estadoGuardadoCompanero} />
        </div>

        {!tieneCompanero ? (
          <button
            type="button"
            onClick={() => {
              setCompanero(COMPANERO_VACIO);
              setTieneCompanero(true);
            }}
            className="mt-4 rounded-md border border-institucional-100 bg-white px-4 py-2.5 font-sans text-sm text-institucional-900 shadow-sm transition-colors hover:bg-institucional-50"
          >
            + Agregar compañero de patrulla
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm sm:grid-cols-2">
            <Campo etiqueta="Nombres y apellidos" requerido>
              <input
                className={claseInput}
                value={companero?.nombreCompleto ?? ""}
                onChange={(e) => setCompanero({ ...(companero ?? COMPANERO_VACIO), nombreCompleto: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Número de identificación" requerido>
              <input
                className={claseInput}
                value={companero?.documento ?? ""}
                onChange={(e) => setCompanero({ ...(companero ?? COMPANERO_VACIO), documento: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Placa policial" requerido>
              <input
                className={claseInput}
                value={companero?.placa ?? ""}
                onChange={(e) => setCompanero({ ...(companero ?? COMPANERO_VACIO), placa: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Grado">
              <input
                className={claseInput}
                value={companero?.grado ?? ""}
                onChange={(e) => setCompanero({ ...(companero ?? COMPANERO_VACIO), grado: e.target.value })}
                placeholder="Ej. PT., PP., IT."
              />
            </Campo>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={quitarCompanero}
                className="font-sans text-xs text-estado-error hover:underline"
              >
                Quitar compañero de patrulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
