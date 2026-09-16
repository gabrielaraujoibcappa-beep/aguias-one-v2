/**
 * Cookie de sessão lido pelo middleware e pelas rotas /api (mesma origem).
 * No navegador o supabase-js guarda a sessão no localStorage; aqui espelhamos
 * o access_token em cookie para o servidor conseguir validá-lo.
 */
import { supabase } from "@/lib/supabase/client";
import type { PapelUsuario } from "./roles";
import { COOKIE_SESSAO, PREFIXO_TOKEN_DEMO } from "./sessao-core";

export const MODO_DEMO = process.env.NODE_ENV === "development";

/** Contas de demonstração (existem em public.usuarios). Login sem senha só em dev. */
export const CONTAS_DEMO: { nome: string; email: string; papel: PapelUsuario; cargo: string }[] = [
  { nome: "Dr. Roberto Silva", email: "roberto.silva@pericia.com.br", papel: "mentorado", cargo: "Perito Solo (Mentorado)" },
  { nome: "Flávio Lopes", email: "flavio.lopes@unibcappa.com.br", papel: "concierge", cargo: "Concierge da Turma" },
  { nome: "Ana Carolina", email: "ana.carolina@unibcappa.com.br", papel: "anjo", cargo: "Anjo & Auditoria" },
  { nome: "Prof. Edilson Aguiais", email: "edilson.aguiais@unibcappa.com.br", papel: "mentor", cargo: "Coordenação & Mentoria" },
  { nome: "Coordenação UniBCAPPA", email: "admin@aguiasone.test", papel: "admin", cargo: "Gestão" },
];

function gravarCookie(valor: string, maxAge: number) {
  const seguro = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_SESSAO}=${encodeURIComponent(valor)}; path=/; max-age=${maxAge}; SameSite=Lax${seguro}`;
}

export function gravarTokenSessao(accessToken: string, expiraEmSegundos = 3600) {
  gravarCookie(accessToken, expiraEmSegundos);
}

export function iniciarSessaoDemo(email: string) {
  if (!MODO_DEMO) throw new Error("Login de demonstração indisponível neste ambiente.");
  gravarCookie(`${PREFIXO_TOKEN_DEMO}${email.toLowerCase()}`, 60 * 60 * 12);
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
  demo: boolean;
}

export async function obterUsuarioLogado(): Promise<UsuarioLogado | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.autenticado ? json.usuario : null;
}
