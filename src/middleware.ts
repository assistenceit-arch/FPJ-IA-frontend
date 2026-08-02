import { NextRequest, NextResponse } from "next/server";

const NOMBRE_COOKIE = "fpj_ia_token";
const RUTAS_PUBLICAS = ["/login"];

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
  // Corre en todas las rutas salvo assets estáticos y la API de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
