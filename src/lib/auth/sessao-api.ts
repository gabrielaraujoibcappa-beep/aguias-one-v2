/**
 * Autorização das rotas /api. Toda rota deve chamar exigirSessao() antes de
 * tocar no banco, já que o supabaseAdmin ignora o RLS.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PapelUsuario } from "./roles";
import { COOKIE_SESSAO, PAPEIS_EQUIPE, PerfilSessao, ehEquipe, resolverPerfil } from "./sessao-core";
import { resolverChaveApi, tocarUsoChave } from "@/lib/api/chaves";

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

/** Mesmo rigor para sessão e chave de API: bloqueio + papéis exigidos. */
function autorizarPerfil(
  perfil: PerfilSessao,
  papeis?: PapelUsuario[],
  opcoes: { permitirBloqueado?: boolean } = {}
): boolean {
  if (perfil.status === "bloqueado" && !ehEquipe(perfil.papel) && !opcoes.permitirBloqueado) {
    return false;
  }
  if (papeis && !papeis.includes(perfil.papel)) return false;
  return true;
}

/** Perfil do dono da chave direto de public.usuarios (papel nunca vem do cliente). */
async function buscarPerfilPorId(usuarioId: string): Promise<PerfilSessao | null> {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, auth_id, nome, email, papel, status, precisa_trocar_senha")
    .eq("id", usuarioId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    usuarioId: data.id,
    authId: data.auth_id,
    nome: data.nome,
    email: data.email,
    papel: data.papel,
    status: data.status || "ativo",
    precisaTrocarSenha: data.precisa_trocar_senha === true,
  };
}

/** Exige usuário autenticado e, opcionalmente, um dos papéis informados. */
export async function exigirSessao(
  req: NextRequest,
  papeis?: PapelUsuario[],
  opcoes: { permitirBloqueado?: boolean } = {}
): Promise<Resultado> {
  const perfil = await resolverPerfil(extrairToken(req));
  if (!perfil) {
    // Fallback: chave de API do gateway (Bearer aq1_...) — mesmo rigor de
    // papel/bloqueio da sessão; o segredo em si nunca é logado.
    const chave = await resolverChaveApi(req.headers.get("authorization"));
    const perfilChave = chave ? await buscarPerfilPorId(chave.usuarioId) : null;
    if (chave && perfilChave) {
      // A chave é válida: o uso fica registrado mesmo se a operação for negada
      void tocarUsoChave(chave.chaveId);
      if (!autorizarPerfil(perfilChave, papeis, opcoes)) {
        // 403, não 401: a chave funciona, o papel do dono é que não pode esta operação
        return negar(
          403,
          `Chave válida, mas o papel "${perfilChave.papel}" não tem permissão para esta operação.`
        );
      }
      const { matriculaIds, turmaIds } = await matriculasDoUsuario(perfilChave.usuarioId);
      return {
        sessao: { ...perfilChave, equipe: ehEquipe(perfilChave.papel), matriculaIds, turmaIds },
      };
    }
    // Quem manda "Bearer aq1_..." é integração, não pessoa: "faça login" não ajuda
    if (req.headers.get("authorization")?.trim().startsWith("Bearer aq1_")) {
      return negar(
        401,
        "Chave de API não reconhecida: confira se copiou a chave inteira (não só o prefixo da lista) ou se ela foi revogada ou expirou."
      );
    }
    return negar(401, "Sessão inválida ou expirada. Faça login novamente.");
  }

  if (!autorizarPerfil(perfil, papeis, opcoes)) {
    if (perfil.status === "bloqueado" && !ehEquipe(perfil.papel) && !opcoes.permitirBloqueado) {
      return negar(403, "Acesso bloqueado pela coordenação.");
    }
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
