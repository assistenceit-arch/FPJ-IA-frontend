import { NextRequest, NextResponse } from "next/server";

const NOMBRE_COOKIE = "fpj_ia_token";
// Adenda 2026-08-06: /registro y /verificar-correo se agregan como
// públicas -- el registro autónomo se hace precisamente SIN estar
// logueado, así que el middleware no debe exigir token ahí (antes
// redirigía a /login sin importar que la ruta existiera, porque solo
// "/login" estaba en la lista).
// Adenda 2026-08-24: /olvide-password y /restablecer-password también
// se usan precisamente sin sesión iniciada (recuperación de
// contraseña), mismo motivo.
const RUTAS_PUBLICAS = ["/login", "/registro", "/verificar-correo", "/olvide-password", "/restablecer-password"];

export function middleware(request: NextRequest) {
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
  // exclusión, el middleware los redirige a /login y la PWA nunca
  // queda instalable (mismo bug ya encontrado antes con /marca).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|marca/|iconos/|sw\\.js|manifest\\.webmanifest).*)",
  ],
};
