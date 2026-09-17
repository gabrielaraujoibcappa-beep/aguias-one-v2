/**
 * Cookie de sessão lido pelo middleware e pelas rotas /api (mesma origem).
 * No navegador o supabase-js guarda a sessão no localStorage; aqui espelhamos
 * o access_token em cookie para o servidor conseguir validá-lo.
 */
import { supabase } from "@/lib/supabase/client";
import type { PapelUsuario } from "./roles";
import { COOKIE_SESSAO } from "./sessao-core";

function gravarCookie(valor: string, maxAge: number) {
  const seguro = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_SESSAO}=${encodeURIComponent(valor)}; path=/; max-age=${maxAge}; SameSite=Lax${seguro}`;
}

export function gravarTokenSessao(accessToken: string, expiraEmSegundos = 3600) {
  gravarCookie(accessToken, expiraEmSegundos);
}

export async function encerrarSessao() {
  try {
    await supabase.auth.signOut();
  } catch {
    // segue limpando os cookies mesmo sem rede
  }
  for (const nome of [COOKIE_SESSAO, "user-role", "acesso-bloqueado"]) {
    document.cookie = `${nome}=; path=/; max-age=0`;
  }
}

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: string;
  matriculaId: string | null;
}

export async function obterUsuarioLogado(): Promise<UsuarioLogado | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.autenticado ? json.usuario : null;
}
