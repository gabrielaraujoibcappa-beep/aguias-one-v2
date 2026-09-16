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
  nome: NomeCanalOficial;
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

export const CANAIS_INICIAIS_MOCK: CanalItem[] = [
  {
    nome: "WhatsApp Business",
    ordem: 1,
    descricao: "Catálogo com 3 produtos e link rastreável.",
    status: "ativo",
    url: "https://wa.me/c/5511987654321",
    atualizadoEm: "2026-09-10",
  },
  {
    nome: "Google Meu Negócio",
    ordem: 2,
    descricao: "Ficha verificada com produtos periciais e avaliação.",
    status: "ativo",
    url: "https://g.page/r/periciaroberto",
    atualizadoEm: "2026-09-12",
  },
  {
    nome: "Instagram",
    ordem: 3,
    descricao: "Perfil posicionado com 4 posts e direct automatizado.",
    status: "nao_iniciado",
  },
  {
    nome: "Site Próprio",
    ordem: 4,
    descricao: "Página no ar no domínio próprio e e-mail profissional.",
    status: "ativo",
    url: "https://periciaroberto.com.br",
    atualizadoEm: "2026-09-14",
  },
  {
    nome: "Newsletter",
    ordem: 5,
    descricao: "Lista inicial e primeiro envio quinzenal.",
    status: "nao_iniciado",
  },
  {
    nome: "YouTube",
    ordem: 6,
    descricao: "Canal com 1º vídeo de autoridade publicado.",
    status: "nao_iniciado",
  },
  {
    nome: "Google Ads",
    ordem: 7,
    descricao: "Campanha de pesquisa no valor mínimo diário da plataforma.",
    status: "nao_iniciado",
  },
];
