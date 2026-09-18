/**
 * Autorização das rotas /api. Toda rota deve chamar exigirSessao() antes de
 * tocar no banco, já que o supabaseAdmin ignora o RLS.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PapelUsuario } from "./roles";
import { COOKIE_SESSAO, PAPEIS_EQUIPE, PerfilSessao, ehEquipe, resolverPerfil } from "./sessao-core";

export { PAPEIS_EQUIPE };
export const PAPEIS_GESTAO: PapelUsuario[] = ["admin", "concierge", "mentor", "anjo"];

export interface Sessao extends PerfilSessao {
  equipe: boolean;
  matriculaIds: string[];
  turmaIds: string[];
}

type Resultado = { sessao: Sessao; erro?: undefined } | { sessao?: undefined; erro: NextResponse };

function negar(status: 401 | 403, erro: string): { erro: NextResponse } {
  return { erro: NextResponse.json({ sucesso: false, erro }, { status }) };
}

function extrairToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies.get(COOKIE_SESSAO)?.value ?? null;
}

/** Exige usuário autenticado e, opcionalmente, um dos papéis informados. */
export async function exigirSessao(
  req: NextRequest,
  papeis?: PapelUsuario[],
  opcoes: { permitirBloqueado?: boolean } = {}
): Promise<Resultado> {
  const perfil = await resolverPerfil(extrairToken(req));
  if (!perfil) return negar(401, "Sessão inválida ou expirada. Faça login novamente.");

  if (perfil.status === "bloqueado" && !ehEquipe(perfil.papel) && !opcoes.permitirBloqueado) {
    return negar(403, "Acesso bloqueado pela coordenação.");
  }
  if (papeis && !papeis.includes(perfil.papel)) {
    return negar(403, "Você não tem permissão para esta operação.");
  }

  const { matriculaIds, turmaIds } = await matriculasDoUsuario(perfil.usuarioId);

  return {
    sessao: { ...perfil, equipe: ehEquipe(perfil.papel), matriculaIds, turmaIds },
  };
}

/**
 * Matrículas do usuário, em cache curto: a sincronização do painel chama várias
 * rotas seguidas e cada uma repetia esta mesma consulta.
 */
const CACHE_MATRICULAS_MS = 30_000;
const cacheMatriculas = new Map<string, { valor: { matriculaIds: string[]; turmaIds: string[] }; expira: number }>();

async function matriculasDoUsuario(usuarioId: string) {
  const agora = Date.now();
  const emCache = cacheMatriculas.get(usuarioId);
  if (emCache && emCache.expira > agora) return emCache.valor;

  const { data } = await supabaseAdmin
    .from("matriculas")
    .select("id, turma_id")
    .eq("usuario_id", usuarioId);

  const valor = {
    matriculaIds: (data || []).map((m) => m.id),
    turmaIds: (data || []).map((m) => m.turma_id),
  };
  cacheMatriculas.set(usuarioId, { valor, expira: agora + CACHE_MATRICULAS_MS });
  return valor;
}

/** Usado após criar, mudar ou encerrar matrícula, para a sessão não ficar defasada. */
export function limparCacheMatriculas(usuarioId?: string) {
  if (usuarioId) cacheMatriculas.delete(usuarioId);
  else cacheMatriculas.clear();
}

/** Equipe acessa qualquer matrícula; mentorado apenas as próprias. */
export function podeAcessarMatricula(sessao: Sessao, matriculaId: string | null | undefined): boolean {
  if (sessao.equipe) return true;
  return !!matriculaId && sessao.matriculaIds.includes(matriculaId);
}

export function respostaProibida(erro = "Você não tem permissão para acessar estes dados.") {
  return NextResponse.json({ sucesso: false, erro }, { status: 403 });
}
