"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAutoguardado } from "@/lib/useAutoguardado";
import { IndicadorGuardado } from "@/components/IndicadorGuardado";
import { soloClaves } from "@/lib/limpiar";
import type { FuncionarioActuante, CompaneroPatrulla } from "@/lib/tipos";

const ENTIDADES = ["Policía Nacional", "CTI Fiscalía", "Migración Colombia", "Ejército Nacional", "Otra"];
// Adenda 2026-09-03, a solicitud del usuario: lista cerrada de grados
// policiales para los campos "Cargo" (funcionario actuante) y "Grado"
// (compañero de patrulla) -- mismo patrón ya usado en "Servicio" (con
// "Otro" al final, que activa un campo de texto libre). El formato
// "PP. Patrullero de Policía" coincide con la convención ya usada en
// la narrativa generada por la IA (ver comentario de "grado" en
// schema.prisma del backend: "PT. Nombre Apellido, placa X").
const GRADOS_POLICIALES = [
  "PP. Patrullero de Policía",
  "PT. Patrullero",
  "SI. Subintendente",
  "IT. Intendente",
  "IJ. Intendente Jefe",
  "SC. Subcomisario",
  "CM. Comisario",
  "ST. Subteniente",
  "TE. Teniente",
  "CT. Capitán",
  "MY. Mayor",
  "Otro",
];
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
  // Adenda 2026-09-03: buffer del campo de texto libre cuando se elige
  // "Otro" en Cargo/Grado -- a diferencia de servicioOtro, este sí se
  // precarga desde el dato ya guardado (ver el efecto de carga más
  // abajo), para no perder el valor personalizado al reabrir un
  // procedimiento existente.
  const [cargoOtro, setCargoOtro] = useState("");
  const [gradoOtro, setGradoOtro] = useState("");
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
        if (f.cargo && !GRADOS_POLICIALES.slice(0, -1).includes(f.cargo)) {
          setCargoOtro(f.cargo);
        }
      }
      if (c) {
        setCompanero(soloClaves(c, ["nombreCompleto", "documento", "placa", "grado"]));
        setTieneCompanero(true);
        if (c.grado && !GRADOS_POLICIALES.slice(0, -1).includes(c.grado)) {
          setGradoOtro(c.grado);
        }
      }
      setCargando(false);
    });
    return () => {
      cancelado = true;
    };
  }, [id]);

  const guardarFuncionario = useCallback(
    async (datos: FuncionarioActuante) => {
      // Adenda 2026-08-03: ya no se bloquea el guardado hasta que todo
      // esté completo — el backend ahora admite borrador parcial, y la
      // obligatoriedad se refleja solo en el punto de color del bloque
      // (ver estadoFuncionario en src/lib/estados.ts). Antes, si faltaba
      // un solo campo, nada se guardaba y el trabajo se perdía al salir.
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
      // Adenda 2026-08-03: mismo criterio que el funcionario — se guarda
      // el borrador parcial aunque falten campos.
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
          <div className="sm:col-span-2">
            <Campo etiqueta="Cargo" requerido>
              <select
                className={claseInput}
                value={GRADOS_POLICIALES.slice(0, -1).includes(funcionario.cargo) ? funcionario.cargo : "Otro"}
                onChange={(e) => {
                  const valor = e.target.value;
                  setFuncionario({ ...funcionario, cargo: valor === "Otro" ? cargoOtro : valor });
                }}
              >
                {GRADOS_POLICIALES.map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
            </Campo>
            {!GRADOS_POLICIALES.slice(0, -1).includes(funcionario.cargo) && (
              <div className="mt-2">
                <Campo etiqueta="Especifique el cargo" requerido>
                  <input
                    className={claseInput}
                    value={cargoOtro}
                    onChange={(e) => {
                      setCargoOtro(e.target.value);
                      setFuncionario({ ...funcionario, cargo: e.target.value });
                    }}
                  />
                </Campo>
              </div>
            )}
          </div>
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
          <Campo etiqueta="CAI" requerido>
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
            <div className="sm:col-span-2">
              <Campo etiqueta="Grado">
                <select
                  className={claseInput}
                  value={
                    companero?.grado && GRADOS_POLICIALES.slice(0, -1).includes(companero.grado)
                      ? companero.grado
                      : companero?.grado
                        ? "Otro"
                        : ""
                  }
                  onChange={(e) => {
                    const valor = e.target.value;
                    setCompanero({
                      ...(companero ?? COMPANERO_VACIO),
                      grado: valor === "Otro" ? gradoOtro : valor,
                    });
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {GRADOS_POLICIALES.map((op) => (
                    <option key={op}>{op}</option>
                  ))}
                </select>
              </Campo>
              {companero?.grado && !GRADOS_POLICIALES.slice(0, -1).includes(companero.grado) && (
                <div className="mt-2">
                  <Campo etiqueta="Especifique el grado">
                    <input
                      className={claseInput}
                      value={gradoOtro}
                      onChange={(e) => {
                        setGradoOtro(e.target.value);
                        setCompanero({ ...(companero ?? COMPANERO_VACIO), grado: e.target.value });
                      }}
                    />
                  </Campo>
                </div>
              )}
            </div>
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
