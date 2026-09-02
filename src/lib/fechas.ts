// Adenda 2026-09-02, bug real reportado tras prueba en vivo (confirmado
// en 2 ambientes distintos, computador local y servidor de pruebas): al
// crear un procedimiento con la fecha de hoy, tanto la lista de "Mis
// procedimientos" como el Bloque 4 (Actuaciones) mostraban el día
// ANTERIOR al realmente elegido.
//
// Causa raíz: fechaCaptura se guarda como `${fecha}T00:00:00.000Z`
// (medianoche UTC del día elegido en un <input type="date">) -- pero
// esto es solo una convención de almacenamiento, NO un momento real
// con hora específica (a diferencia de, por ejemplo, cuándo se generó
// un documento, que sí ocurrió en un instante concreto). Al mostrarla
// con `new Date(iso).toLocaleDateString(...)`, el navegador convierte
// esa medianoche UTC a la zona horaria local del funcionario -- en
// Colombia (UTC-5), medianoche UTC del día 2 es las 7:00 PM del día 1,
// así que se mostraba "1" en vez de "2".
//
// Esta función evita esa conversión: extrae directamente el
// año-mes-día de la cadena ISO (ignorando la hora/zona), y construye
// una fecha "local" a partir de esos números -- así el navegador nunca
// tiene oportunidad de desplazarla a otro día.
export function formatearFechaSoloDia(
  iso: string,
  opciones: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  const [anio, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  const fechaLocal = new Date(anio, mes - 1, dia);
  return fechaLocal.toLocaleDateString("es-CO", opciones);
}
