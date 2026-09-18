export const CANAIS_OFICIAIS = [
  "WhatsApp Business",
  "Google Meu Negócio",
  "Instagram",
  "Site Próprio",
  "Newsletter",
  "YouTube",
  "Google Ads",
] as const;

export const CANAIS_TEMPLATE = [
  "Vara Judicial / Cadastro TJ",
  "Escritórios de Advocacia Parceiros",
  "LinkedIn Especializado",
  "Google Perfil da Empresa (Meu Negócio)",
  "Networking / Indicações de Colegas",
  "Instagram Institucional / Artigos",
  "Palestras / Associações de Classe",
];

export type NomeCanalOficial = (typeof CANAIS_OFICIAIS)[number];

export interface CanalItem {
  id?: string;
  /** Nome do canal como vem do servidor (lista canônica em CANAIS_TEMPLATE). */
  nome: string;
  ordem: number;
  url?: string;
  status: "nao_iniciado" | "ativo";
  descricao?: string;
  atualizadoEm?: string;
}

export function atualizarStatusCanal(
  canal: CanalItem,
  novoStatus: "nao_iniciado" | "ativo",
  url?: string
): CanalItem {
  return {
    ...canal,
    status: novoStatus,
    url: url !== undefined ? url : canal.url,
    atualizadoEm: new Date().toISOString(),
  };
}

/**
 * Salva um canal em nome do aluno (uso da equipe na visão do aluno).
 * A API aceita sessão da equipe para qualquer matrícula (upsert idempotente).
 */
export async function salvarCanalEquipe(args: {
  matriculaId: string;
  canalNome: string;
  status: "nao_iniciado" | "ativo";
  urlCanal?: string;
}): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const res = await fetch("/api/canais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matriculaId: args.matriculaId,
        canalNome: args.canalNome,
        status: args.status,
        urlCanal: args.urlCanal || "",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.sucesso) {
      return { sucesso: false, erro: json.erro || "Falha ao salvar o canal." };
    }
    return { sucesso: true };
  } catch (err: any) {
    return { sucesso: false, erro: err?.message || "Erro ao conectar com servidor." };
  }
}
