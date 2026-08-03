/**
 * Devuelve un nuevo objeto que solo contiene las claves indicadas.
 *
 * El backend usa `forbidNonWhitelisted: true` (ver src/main.ts del
 * repositorio backend): cualquier campo que no esté explícitamente en el
 * DTO hace que la petición completa se rechace con 400. Como el GET nos
 * devuelve el registro completo (incluyendo id, procedimientoId,
 * createdAt, updatedAt...), hay que "limpiarlo" antes de usarlo como
 * base para un PUT/PATCH — de lo contrario el autoguardado falla en
 * silencio (o no tan en silencio: queda en estado "error").
 */
export function soloClaves<T extends object, K extends keyof T>(objeto: T, claves: readonly K[]): Pick<T, K> {
  const resultado = {} as Pick<T, K>;
  for (const clave of claves) {
    if (clave in objeto) resultado[clave] = objeto[clave];
  }
  return resultado;
}
