import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESSAO, ehEquipe, resolverPerfil } from "@/lib/auth/sessao-core";

function redirecionar(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Sessão validada no Supabase; o papel vem de public.usuarios (nunca de cookie)
  const perfil = await resolverPerfil(request.cookies.get(COOKIE_SESSAO)?.value).catch(() => null);

  if (!perfil) {
    const resposta = redirecionar(request, "/login", { redirect: pathname + search });
    resposta.cookies.delete(COOKIE_SESSAO);
    return resposta;
  }

  const equipe = ehEquipe(perfil.papel);

  if (!equipe && perfil.status === "bloqueado") {
    return redirecionar(request, "/acesso-bloqueado");
  }

  if (!equipe && (pathname.startsWith("/painel") || pathname.startsWith("/admin"))) {
    return redirecionar(request, "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkin/:path*", "/canais/:path*", "/faturamento/:path*", "/painel/:path*", "/admin/:path*"],
};
