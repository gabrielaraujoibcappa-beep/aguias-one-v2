import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas (login, assets, api pública)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname === "/login" ||
    pathname === "/acesso-bloqueado" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Obter cookie de autenticação / sessão
  const token = request.cookies.get("sb-access-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;
  const acessoBloqueado = request.cookies.get("acesso-bloqueado")?.value === "1";

  // Mentorado com acesso bloqueado pela equipe: barra qualquer área do sistema
  if (userRole === "mentorado" && acessoBloqueado) {
    const url = request.nextUrl.clone();
    url.pathname = "/acesso-bloqueado";
    return NextResponse.redirect(url);
  }

  // Se houver autenticação formal com token e usuário for mentorado tentando acessar área de equipe
  if (token && userRole === "mentorado" && (pathname.startsWith("/painel") || pathname.startsWith("/admin"))) {
    // Redireciona para o dashboard do aluno
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkin/:path*", "/canais/:path*", "/faturamento/:path*", "/painel/:path*", "/admin/:path*"],
};
