/**
 * Dados de demonstração usados SOMENTE pelos testes.
 * Saíram do código da aplicação: nenhuma tela exibe estes registros.
 */
import type { EntregaPendente } from "../../src/lib/api/auditoria";
import type { CanalItem } from "../../src/lib/api/canais";
import type { DeclaracaoFaturamento } from "../../src/lib/api/faturamento";
import type { AlunoSemaforoStatus } from "../../src/lib/api/turma-semaforo";
import type { ModuloItem } from "../../src/lib/api/modulos-liberacao";

export const ENTREGAS_MOCK: EntregaPendente[] = [
  {
    id: "ent-1",
    alunoNome: "Dr. Roberto Silva",
    alunoEmail: "roberto@pericia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [{ rotulo: "Site no Ar", url: "https://periciaroberto.com.br" }],
    arquivos: [
      { rotulo: "Print das 8 Pastas", path: "uploads/pastas_roberto.png", nome: "pastas_drive.png" },
      { rotulo: "Print E-mail Hostinger", path: "uploads/email_roberto.png", nome: "email_hostinger.png" },
    ],
    travou: "DNS levou 12 horas para propagar, mas já está ativo",
    duvidaCall: "Como estruturar o primeiro contato com escritório de advocacia trabalhista?",
    status: "aguardando_avaliacao",
    enviadoEm: "2026-09-15T14:30:00Z",
  },
  {
    id: "ent-2",
    alunoNome: "Dra. Mariana Costa",
    alunoEmail: "mariana@advpericia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [],
    arquivos: [
      { rotulo: "Print das Pastas", path: "uploads/pastas_mariana.png", nome: "pastas_drive.png" },
    ],
    status: "aguardando_avaliacao",
    enviadoEm: "2026-09-15T16:15:00Z",
  },
  {
    id: "ent-3",
    alunoNome: "Dr. Marcelo Mendes",
    alunoEmail: "marcelo@mendesengenharia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [{ rotulo: "Site Ativo", url: "https://mendespericias.com.br" }],
    arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas_marcelo.png", nome: "pastas_drive.png" }],
    status: "aprovado",
    parecerTexto: "Estrutura de 8 pastas e nomenclatura em conformidade total com o PPC do ÁGUIAS ONE.",
    avaliadoPor: "Ana Carolina (Anjo)",
    avaliadoEm: "2026-09-14T18:20:00Z",
    enviadoEm: "2026-09-14T12:10:00Z",
  },
  {
    id: "ent-4",
    alunoNome: "Dra. Camila Nunes",
    alunoEmail: "camila@nunesgrafotécnica.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [],
    arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas_camila.png", nome: "pastas_drive.png" }],
    status: "ajuste_solicitado",
    parecerTexto: "Faltou comprovar permissão compartilhada de leitura na pasta de modelos contratuais.",
    avaliadoPor: "Flávio Lopes",
    avaliadoEm: "2026-09-14T19:10:00Z",
    enviadoEm: "2026-09-14T13:40:00Z",
  },
];

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

export const FATURAMENTOS_HISTORICO_MOCK: DeclaracaoFaturamento[] = [
  {
    id: "fat-1",
    matriculaId: "mat-1",
    alunoId: "1",
    mesReferencia: "2026-08-01",
    valorBruto: 14200.0,
    comprovantes: [
      { nome: "extrato_e_recibos_agosto.zip", path: "faturamentos/extrato_agosto.zip", tipo: "zip" },
    ],
    criadoEm: "2026-09-02T10:00:00Z",
    statusAuditoria: "pendente",
  },
  {
    id: "fat-2",
    matriculaId: "mat-1",
    alunoId: "1",
    mesReferencia: "2026-07-01",
    valorBruto: 11800.0,
    comprovantes: [
      { nome: "comprovante_julho.pdf", path: "faturamentos/comp_julho.pdf", tipo: "arquivo" },
    ],
    criadoEm: "2026-08-03T11:30:00Z",
    statusAuditoria: "aprovado",
    auditadoPor: "Flávio Lopes (Concierge)",
    auditadoEm: "2026-08-05T14:10:00Z",
  },
  {
    id: "fat-3",
    matriculaId: "mat-2",
    alunoId: "2",
    mesReferencia: "2026-08-01",
    valorBruto: 22400.0,
    comprovantes: [
      { nome: "notas_agosto.zip", path: "faturamentos/notas_agosto_mariana.zip", tipo: "zip" },
    ],
    criadoEm: "2026-09-01T09:20:00Z",
    statusAuditoria: "pendente",
  },
  {
    id: "fat-4",
    matriculaId: "mat-2",
    alunoId: "2",
    mesReferencia: "2026-07-01",
    valorBruto: 19750.0,
    comprovantes: [
      { nome: "recibos_julho.pdf", path: "faturamentos/recibos_julho_mariana.pdf", tipo: "arquivo" },
    ],
    criadoEm: "2026-08-02T16:45:00Z",
    statusAuditoria: "aprovado",
    auditadoPor: "Ana Carolina (Anjo)",
    auditadoEm: "2026-08-04T10:00:00Z",
  },
  {
    id: "fat-5",
    matriculaId: "mat-2",
    alunoId: "2",
    mesReferencia: "2026-06-01",
    valorBruto: 17300.0,
    comprovantes: [],
    criadoEm: "2026-07-03T11:00:00Z",
    statusAuditoria: "aprovado",
    auditadoPor: "Ana Carolina (Anjo)",
    auditadoEm: "2026-07-06T09:30:00Z",
  },
  {
    id: "fat-6",
    matriculaId: "mat-3",
    alunoId: "3",
    mesReferencia: "2026-07-01",
    valorBruto: 4100.0,
    comprovantes: [
      { nome: "print_extrato.jpg", path: "faturamentos/print_extrato_andre.jpg", tipo: "arquivo" },
    ],
    criadoEm: "2026-08-09T20:15:00Z",
    statusAuditoria: "ajuste_solicitado",
    parecerAuditoria: "O print está ilegível. Reenvie o extrato completo do mês em PDF ou .zip.",
    auditadoPor: "Flávio Lopes (Concierge)",
    auditadoEm: "2026-08-11T13:00:00Z",
  },
];

/** Metas anuais iniciais por aluno (demonstração). */
export const METAS_FATURAMENTO_ALUNOS_MOCK: Record<string, number> = {
  "1": 240000,
  "2": 300000,
  "3": 150000,
};

export const ALUNOS_SEMAFORO_MOCK: AlunoSemaforoStatus[] = [
  {
    id: "aluno-1",
    nome: "Dr. Roberto Silva",
    whatsapp: "(11) 98765-4321",
    semaforoAtual: "amarelo",
    historicoSemaforos: ["amarelo", "verde"],
    travouEmLinha: "Dúvida no cálculo de juros compostos para ação revisional",
    duvidaCall: "Como apresentar o laudo prévio ao advogado parceiro?",
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: true,
    precisaResgate: false,
  },
  {
    id: "aluno-2",
    nome: "Dra. Mariana Costa",
    whatsapp: "(21) 99887-7665",
    semaforoAtual: "verde",
    historicoSemaforos: ["verde", "verde"],
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: true,
    precisaResgate: false,
  },
  {
    id: "aluno-3",
    nome: "Dr. André Martins",
    whatsapp: "(31) 97766-5544",
    semaforoAtual: "vermelho",
    historicoSemaforos: ["vermelho", "vermelho"],
    travouEmLinha: "Sem tempo para mexer na infraestrutura do escritório",
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: false,
    precisaResgate: true,
  },
];

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
