import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESSAO, ehEquipe, resolverPerfil } from "@/lib/auth/sessao-core";
import type { PapelUsuario } from "@/lib/auth/roles";

function redirecionar(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url);
}

/** Painéis de acompanhamento por papel (SPEC diagnóstico §3 e §7). */
const AREAS_POR_PAPEL: { prefixo: string; papeis: PapelUsuario[] }[] = [
  { prefixo: "/anjo", papeis: ["anjo", "mentor", "admin"] },
  { prefixo: "/concierge", papeis: ["concierge", "mentor", "admin"] },
  { prefixo: "/mentor", papeis: ["mentor", "admin"] },
];

const AREAS_DO_ALUNO = ["/onboarding", "/diagnostico"];

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

  // Senha temporária: só a troca libera o restante (vale para todos os papéis)
  if (perfil.precisaTrocarSenha && pathname !== "/trocar-senha" && !pathname.startsWith("/trocar-senha/")) {
    return redirecionar(request, "/trocar-senha");
  }

  // Resgate (Adelayne) só opera /resgate: sem painéis, sem área do aluno
  if (perfil.papel === "resgate") {
    return pathname === "/resgate" || pathname.startsWith("/resgate/")
      ? NextResponse.next()
      : redirecionar(request, "/resgate");
  }
  if (pathname === "/resgate" || pathname.startsWith("/resgate/")) {
    return redirecionar(request, equipe ? "/painel/turma" : "/dashboard");
  }

  if (!equipe && perfil.status === "bloqueado") {
    return redirecionar(request, "/acesso-bloqueado");
  }

  const area = AREAS_POR_PAPEL.find((a) => pathname === a.prefixo || pathname.startsWith(`${a.prefixo}/`));

  if (!equipe && (pathname.startsWith("/painel") || pathname.startsWith("/admin") || area)) {
    return redirecionar(request, "/dashboard");
  }

  if (area && !area.papeis.includes(perfil.papel)) {
    return redirecionar(request, "/painel/turma");
  }

  if (equipe && AREAS_DO_ALUNO.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return redirecionar(request, "/painel/turma");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkin/:path*",
    "/canais/:path*",
    "/faturamento/:path*",
    "/painel/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/diagnostico/:path*",
    "/anjo/:path*",
    "/concierge/:path*",
    "/mentor/:path*",
    "/resgate/:path*",
    "/trocar-senha/:path*",
  ],
};
