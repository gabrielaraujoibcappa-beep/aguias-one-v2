export interface ModuloItem {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  disciplinaRef?: string;
  ordem: number;
  status: "liberado" | "bloqueado" | "aprovado" | "aguardando_avaliacao";
  liberadoPor?: string;
  liberadoEm?: string;
  itensRoteiro?: string[];
}

export function filtrarModulosVisiveis(modulos: ModuloItem[]): ModuloItem[] {
  return modulos.filter((m) => m.status === "liberado" || m.status === "aprovado" || m.status === "aguardando_avaliacao");
}

export function alternarStatusModulo(
  modulo: ModuloItem,
  novoStatus: "liberado" | "bloqueado",
  autorId: string
): ModuloItem {
  return {
    ...modulo,
    status: novoStatus,
    liberadoPor: novoStatus === "liberado" ? autorId : undefined,
    liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined,
  };
}

export const MODULOS_PADRAO_AGUIAS_ONE: ModuloItem[] = [
  {
    id: "mod-1",
    numero: 1,
    titulo: "Árvore de Pastas no Google Drive & Nomenclatura",
    descricao: "Organização estrutural onde cada documento mora e padrão de nomenclatura do escritório pericial.",
    disciplinaRef: "01. Gestão Estratégica",
    ordem: 1,
    status: "liberado",
    itensRoteiro: [
      "1. Árvore de 8 pastas no Google Drive",
      "2. Nomenclatura de arquivos do escritório",
      "3. Print das 8 pastas como evidência",
    ],
  },
  {
    id: "mod-2",
    numero: 2,
    titulo: "Agenda, Rotina e Alta Performance",
    descricao: "Implantação da semana-modelo no Google Agenda (produzir, revisar, vender, organizar, respirar).",
    disciplinaRef: "02. Agenda e Rotina",
    ordem: 2,
    status: "bloqueado",
    itensRoteiro: [
      "1. Definição da semana-modelo",
      "2. Eventos recorrentes no Google Agenda",
      "3. Print da agenda blocada como evidência",
    ],
  },
  {
    id: "mod-3",
    numero: 3,
    titulo: "Prospecção Diária e Carteira de Clientes",
    descricao: "Rotina 10 seguir / 5 abordar no WhatsApp e cadastro dos primeiros 10 leads.",
    disciplinaRef: "03. Prospecção",
    ordem: 3,
    status: "bloqueado",
    itensRoteiro: [
      "1. Rotina 10 seguir / 5 abordar",
      "2. Cadastro inicial de 10 clientes",
      "3. Print da prospecção como evidência",
    ],
  },
  {
    id: "mod-4",
    numero: 4,
    titulo: "Presença Digital, Domínio e E-mail Hostinger",
    descricao: "Domínio próprio, site gerado com IA e e-mail profissional com assinatura padronizada.",
    disciplinaRef: "04. Presença Digital",
    ordem: 4,
    status: "bloqueado",
    itensRoteiro: [
      "1. Domínio próprio registrado",
      "2. Site no ar na plataforma da casa",
      "3. E-mail profissional com assinatura",
      "4. Link do site + print do e-mail como prova",
    ],
  },
];
