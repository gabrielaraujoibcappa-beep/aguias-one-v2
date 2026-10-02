/**
 * Chaves de API do Gateway (uso em servidor — rotas /api).
 *
 * Segurança (security-review):
 * - texto claro NUNCA é gravado nem logado; só SHA-256 + prefixo;
 * - geração com randomBytes; validação com timing-safe básico (hash compara no banco);
 * - expiração e revogação verificadas a cada uso.
 */
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PREFIXO_CHAVE = "aq1_";
/** Quem pode gerar chaves. A chave age com o papel do dono (cada rota confere). */
export const PAPEIS_CHAVES = ["admin", "concierge", "mentor", "anjo"] as const;
/** Gestão vê e revoga as chaves de todo o time; mentor e anjo, só as próprias. */
export const PAPEIS_GESTAO_CHAVES: readonly string[] = ["admin", "concierge"];

export function veTodasAsChaves(papel: string): boolean {
  return PAPEIS_GESTAO_CHAVES.includes(papel);
}

export interface ChaveApiPublica {
  id: string;
  nome: string;
  prefixo: string;
  escopos: string[];
  expiraEm: string | null;
  revogadaEm: string | null;
  ultimoUsoEm: string | null;
  criadoEm: string;
}

export function gerarTextoChave(): string {
  return `${PREFIXO_CHAVE}${randomBytes(32).toString("base64url")}`;
}

export function hashChave(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}

/** Nome 3–60 caracteres; expiração em dias (0 = sem expiração). */
export function validarPedidoChave(nome: unknown, expiraDias: unknown): { nome: string; expiraDias: number } | { erro: string } {
  if (typeof nome !== "string" || nome.trim().length < 3 || nome.trim().length > 60) {
    return { erro: "Dê um nome à chave com 3 a 60 caracteres (ex: “n8n – resgate”)." };
  }
  const dias = Number(expiraDias ?? 0);
  if (!Number.isInteger(dias) || dias < 0 || dias > 3650) {
    return { erro: "Expiração inválida: use 0 (sem expiração) ou 1–3650 dias." };
  }
  return { nome: nome.trim(), expiraDias: dias };
}

export function mapearChave(linha: {
  id: string;
  nome: string;
  prefixo: string;
  escopos: string[] | null;
  expira_em: string | null;
  revogada_em: string | null;
  ultimo_uso_em: string | null;
  criado_em: string;
}): ChaveApiPublica {
  return {
    id: linha.id,
    nome: linha.nome,
    prefixo: linha.prefixo,
    escopos: linha.escopos ?? [],
    expiraEm: linha.expira_em,
    revogadaEm: linha.revogada_em,
    ultimoUsoEm: linha.ultimo_uso_em,
    criadoEm: linha.criado_em,
  };
}

export interface DonoChave {
  usuarioId: string;
  papel: string;
  chaveId: string;
}

/**
 * Valida `Authorization: Bearer aq1_...` contra chaves_api.
 * Retorna o dono quando a chave está ativa e dentro da validade.
 */
export async function resolverChaveApi(authorization: string | null): Promise<DonoChave | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const texto = authorization.slice(7).trim();
  if (!texto.startsWith(PREFIXO_CHAVE) || texto.length < 20) return null;

  const hash = hashChave(texto);
  const { data, error } = await supabaseAdmin
    .from("chaves_api")
    .select("id, usuario_id, expira_em, revogada_em, usuarios (papel)")
    .eq("hash", hash)
    .maybeSingle();
  if (error || !data) return null;
  if (data.revogada_em) return null;
  if (data.expira_em && new Date(data.expira_em).getTime() <= Date.now()) return null;

  const papel = (data.usuarios as unknown as { papel?: string } | null)?.papel ?? "mentorado";
  return { usuarioId: data.usuario_id, papel, chaveId: data.id };
}

/** Marca último uso (fire-and-forget, sem vazar erro). */
export async function tocarUsoChave(chaveId: string): Promise<void> {
  await supabaseAdmin.from("chaves_api").update({ ultimo_uso_em: new Date().toISOString() }).eq("id", chaveId);
}
