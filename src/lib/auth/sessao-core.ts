/**
 * Resolução de sessão compartilhada entre o middleware (edge) e as rotas /api.
 * Usa apenas fetch — sem dependências de Node — para rodar em qualquer runtime.
 *
 * O papel do usuário vem SEMPRE de public.usuarios, nunca de cookie ou metadata.
 */
import type { PapelUsuario } from "./roles";

export const COOKIE_SESSAO = "sb-access-token";
export const PREFIXO_TOKEN_DEMO = "demo:";
export const PAPEIS_EQUIPE: PapelUsuario[] = ["admin", "concierge", "anjo", "mentor"];

/** Login demo sem senha: exclusivo do ambiente de desenvolvimento. */
export function modoDemoAtivo(): boolean {
  return process.env.NODE_ENV === "development";
}

export interface PerfilSessao {
  usuarioId: string;
  authId: string | null;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: string;
  demo: boolean;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { perfil: PerfilSessao | null; expira: number }>();

function configSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error("Variáveis do Supabase ausentes (URL, ANON_KEY ou SERVICE_ROLE_KEY).");
  }
  return { url, anon, service };
}

async function buscarUsuario(filtro: string): Promise<Omit<PerfilSessao, "demo"> | null> {
  const { url, service } = configSupabase();
  const res = await fetch(
    `${url}/rest/v1/usuarios?${filtro}&select=id,auth_id,nome,email,papel,status&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const [u] = (await res.json()) as any[];
  if (!u) return null;
  return {
    usuarioId: u.id,
    authId: u.auth_id,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    status: u.status || "ativo",
  };
}

async function resolverSemCache(token: string): Promise<PerfilSessao | null> {
  if (token.startsWith(PREFIXO_TOKEN_DEMO)) {
    if (!modoDemoAtivo()) return null;
    const email = token.slice(PREFIXO_TOKEN_DEMO.length).trim().toLowerCase();
    if (!email) return null;
    const u = await buscarUsuario(`email=eq.${encodeURIComponent(email)}`);
    return u ? { ...u, demo: true } : null;
  }

  const { url, anon } = configSupabase();
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const authUser = await res.json();
  if (!authUser?.id) return null;

  const u = await buscarUsuario(`auth_id=eq.${encodeURIComponent(authUser.id)}`);
  return u ? { ...u, demo: false } : null;
}

/** Valida o token (JWT do Supabase ou demo:<email> em dev) e devolve o perfil. */
export async function resolverPerfil(tokenBruto: string | null | undefined): Promise<PerfilSessao | null> {
  if (!tokenBruto) return null;
  let token = tokenBruto;
  try {
    token = decodeURIComponent(tokenBruto);
  } catch {
    // valor malformado: usa como veio e deixa a validação recusar
  }
  const agora = Date.now();
  const emCache = cache.get(token);
  if (emCache && emCache.expira > agora) return emCache.perfil;

  const perfil = await resolverSemCache(token);
  cache.set(token, { perfil, expira: agora + CACHE_TTL_MS });
  if (cache.size > 500) {
    cache.forEach((v, k) => {
      if (v.expira <= agora) cache.delete(k);
    });
  }
  return perfil;
}

export function ehEquipe(papel: PapelUsuario): boolean {
  return PAPEIS_EQUIPE.includes(papel);
}
