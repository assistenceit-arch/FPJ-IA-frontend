"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

export default function NuevoInterviniente() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [primerNombre, setPrimerNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const nuevo = await api.post<{ id: string }>(`/procedimientos/${id}/capturados`, {
        primerNombre,
        primerApellido,
        fechaNacimiento: `${fechaNacimiento}T00:00:00.000Z`,
        genero,
      });
      router.push(`/procedimientos/${id}/intervinientes/${nuevo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No fue posible crear el interviniente.");
    } finally {
      setCargando(false);
    }
  }

  const claseInput =
    "block w-full rounded-md border border-institucional-100 bg-white px-3 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={`/procedimientos/${id}/intervinientes`}
        className="font-sans text-sm text-institucional-700 hover:underline"
      >
        ← Intervinientes
      </Link>
      <h1 className="mt-3 font-display text-2xl text-institucional-950">Nuevo interviniente</h1>
      <p className="mt-1 font-sans text-sm text-institucional-700">
        El sistema determinará automáticamente si es Capturado o Aprehendido según la fecha de
        nacimiento. Podrás completar el resto de la información en la siguiente pantalla.
      </p>

      <form onSubmit={manejarEnvio} className="mt-6 space-y-4 rounded-lg border border-institucional-100 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Primer nombre <span className="text-estado-error">*</span>
          </span>
          <input
            required
            className={claseInput}
            value={primerNombre}
            onChange={(e) => setPrimerNombre(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Primer apellido <span className="text-estado-error">*</span>
          </span>
          <input
            required
            className={claseInput}
            value={primerApellido}
            onChange={(e) => setPrimerApellido(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Fecha de nacimiento <span className="text-estado-error">*</span>
          </span>
          <input
            required
            type="date"
            className={claseInput}
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-sans text-sm font-medium text-institucional-900">
            Género <span className="text-estado-error">*</span>
          </span>
          <select className={claseInput} value={genero} onChange={(e) => setGenero(e.target.value)}>
            <option>Masculino</option>
            <option>Femenino</option>
          </select>
        </label>

        {error && (
          <p role="alert" className="font-sans text-sm text-estado-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-acento px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-acento-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando ? "Creando…" : "Crear y continuar"}
        </button>
      </form>
    </div>
  );
}
