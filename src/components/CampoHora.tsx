/**
 * Selector de hora en formato 24 horas.
 *
 * No usamos <input type="time"> a solas porque el widget nativo del
 * navegador muestra AM/PM según el locale del sistema operativo del
 * funcionario, sin importar el lang="es" del documento — en la práctica,
 * varios equipos con Windows en inglés lo mostraban en 12h. Este
 * componente fuerza visualmente el formato 24h con dos <select> (HH y MM)
 * y sigue devolviendo un string "HH:MM" (mismo formato que ya se
 * guardaba), así que no cambia nada en la API ni en el backend.
 */

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const claseSelect =
  "block rounded-md border border-institucional-100 bg-white px-2 py-2 font-sans text-sm text-institucional-950 outline-none focus:border-acento";

export function CampoHora({
  value,
  onChange,
  id,
}: {
  value: string | undefined;
  onChange: (valor: string) => void;
  id?: string;
}) {
  const [horaActual = "", minutoActual = ""] = (value ?? "").split(":");

  function actualizar(hora: string, minuto: string) {
    if (hora === "" || minuto === "") {
      onChange("");
      return;
    }
    onChange(`${hora}:${minuto}`);
  }

  return (
    <div id={id} className="flex items-center gap-2">
      <select
        aria-label="Hora (00-23)"
        className={claseSelect}
        value={horaActual}
        onChange={(e) => actualizar(e.target.value, minutoActual || "00")}
      >
        <option value="">HH</option>
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="font-sans text-sm text-institucional-700">:</span>
      <select
        aria-label="Minutos"
        className={claseSelect}
        value={minutoActual}
        onChange={(e) => actualizar(horaActual || "00", e.target.value)}
      >
        <option value="">MM</option>
        {MINUTOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <span className="font-sans text-xs text-institucional-700">(24 h)</span>
    </div>
  );
}
