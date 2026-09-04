// Adenda 2026-09-02 (Etapa 2 de la actualización de Next.js): este
// archivo se llamaba middleware.ts, y la función se llamaba
// middleware() -- Next.js 16 renombra por completo esta convención a
// "proxy" (archivo y función), porque "middleware" generaba confusión
// con el concepto de Express.js y llevaba a la gente a tratarlo como
// una barrera de seguridad para lo que nunca fue diseñado. La lógica
// en sí no cambia en nada, es exclusivamente un renombre.
import { NextRequest, NextResponse } from "next/server";

const NOMBRE_COOKIE = "fpj_ia_token";
// Adenda 2026-08-06: /registro y /verificar-correo se agregan como
// públicas -- el registro autónomo se hace precisamente SIN estar
// logueado, así que el proxy no debe exigir token ahí (antes
// redirigía a /login sin importar que la ruta existiera, porque solo
// "/login" estaba en la lista).
// Adenda 2026-08-24: /olvide-password y /restablecer-password también
// se usan precisamente sin sesión iniciada (recuperación de
// contraseña), mismo motivo.
// Adenda 2026-09-04: /tratamiento-de-datos también es pública a
// propósito -- es la Política de Protección de Datos, y cualquier
// persona (no solo funcionarios con sesión iniciada) debe poder
// consultarla, incluyendo alguien ejerciendo sus derechos de Habeas
// Data sin tener cuenta en la plataforma.
const RUTAS_PUBLICAS = [
  "/login",
  "/registro",
  "/verificar-correo",
  "/olvide-password",
  "/restablecer-password",
  "/tratamiento-de-datos",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tieneToken = Boolean(request.cookies.get(NOMBRE_COOKIE)?.value);
  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta));

  if (!tieneToken && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (tieneToken && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/procedimientos";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Corre en todas las rutas salvo assets estáticos, la API de Next, y
  // los archivos de marca en /public/marca (logo y hero del login --
  // deben cargar SIN sesión, ya que el propio login los usa).
  // Adenda 2026-08-25: mismo motivo para los archivos de la PWA
  // (manifiesto, service worker, íconos) -- el celular necesita
  // descargarlos para poder instalar la aplicación, y eso puede pasar
  // en la primera visita, antes de haber iniciado sesión. Sin esta
  // exclusión, el proxy los redirige a /login y la PWA nunca
  // queda instalable (mismo bug ya encontrado antes con /marca).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|marca/|iconos/|sw\\.js|manifest\\.webmanifest).*)",
  ],
};
