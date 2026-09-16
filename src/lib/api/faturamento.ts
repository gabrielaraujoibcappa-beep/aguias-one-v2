export interface ComprovanteItem {
  nome: string;
  path: string;
  tipo: "zip" | "arquivo";
}

export type StatusAuditoriaFaturamento = "pendente" | "aprovado" | "ajuste_solicitado";

export const ROTULOS_STATUS_AUDITORIA: Record<StatusAuditoriaFaturamento, string> = {
  pendente: "Aguardando auditoria",
  aprovado: "Aprovado",
  ajuste_solicitado: "Ajuste solicitado",
};

export interface DeclaracaoFaturamento {
  id?: string;
  matriculaId: string;
  /** Aluno (mentorado) dono da declaração. Declarações antigas sem o campo pertencem ao aluno logado. */
  alunoId?: string;
  mesReferencia: string; // YYYY-MM-01
  valorBruto: number;
  comprovantes: ComprovanteItem[];
  criadoEm?: string;
  statusAuditoria?: StatusAuditoriaFaturamento;
  parecerAuditoria?: string;
  auditadoPor?: string;
  auditadoEm?: string;
  /** Preenchido quando a equipe lança ou edita a declaração em nome do aluno. */
  editadoPor?: string;
}

const EXTENSOES_PERMITIDAS = [".zip", ".pdf", ".png", ".jpg", ".jpeg"];

export function validarComprovanteFaturamento(nomeArquivo: string): { valido: boolean; motivo?: string } {
  const lower = nomeArquivo.toLowerCase();
  const permitido = EXTENSOES_PERMITIDAS.some((ext) => lower.endsWith(ext));

  if (!permitido) {
    return {
      valido: false,
      motivo: "Formato inválido. Apenas .zip, .pdf, .png e .jpg são aceitos.",
    };
  }

  return { valido: true };
}

export function formatarMoedaReal(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor).replace(/\u00a0/g, " ");
}

export const formatarMoedaBRL = formatarMoedaReal;

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

// ---------------------------------------------------------------------------
// Meta de faturamento anual (dividida em 12 metas mensais iguais)
// ---------------------------------------------------------------------------

export const META_FATURAMENTO_ANUAL_PADRAO = 240000; // R$ 20.000 por mês

export const MESES_ABREVIADOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface ProgressoMes {
  mes: number; // 1..12
  rotulo: string; // "Jan".."Dez"
  realizado: number;
  meta: number;
  percentual: number; // realizado / meta * 100, sem teto
  declarado: boolean; // houve ao menos uma declaração no mês
}

export interface ProgressoMetaAnual {
  ano: number;
  metaAnual: number;
  metaMensal: number;
  meses: ProgressoMes[];
  realizadoAcumulado: number;
  restante: number;
  percentualAnual: number;
  mesesDeclarados: number;
  mediaMensalDeclarada: number;
  mesesAcimaDaMeta: number;
}

export function calcularMetaMensal(metaAnual: number): number {
  return metaAnual > 0 ? metaAnual / 12 : 0;
}

/**
 * Consolida as declarações de um ano contra a meta anual.
 * Declarações do mesmo mês são somadas. Meses sem declaração ficam com realizado 0.
 */
export function calcularProgressoMetaAnual(
  faturamentos: DeclaracaoFaturamento[],
  metaAnual: number,
  ano: number
): ProgressoMetaAnual {
  const metaMensal = calcularMetaMensal(metaAnual);
  const porMes = new Map<number, number>();

  for (const f of faturamentos) {
    const [anoRef, mesRef] = f.mesReferencia.split("-").map(Number);
    if (anoRef !== ano || !mesRef || mesRef < 1 || mesRef > 12) continue;
    porMes.set(mesRef, (porMes.get(mesRef) ?? 0) + (Number(f.valorBruto) || 0));
  }

  const meses: ProgressoMes[] = MESES_ABREVIADOS.map((rotulo, idx) => {
    const mes = idx + 1;
    const realizado = porMes.get(mes) ?? 0;
    return {
      mes,
      rotulo,
      realizado,
      meta: metaMensal,
      percentual: metaMensal > 0 ? (realizado / metaMensal) * 100 : 0,
      declarado: porMes.has(mes),
    };
  });

  const realizadoAcumulado = meses.reduce((soma, m) => soma + m.realizado, 0);
  const mesesDeclarados = meses.filter((m) => m.declarado).length;

  return {
    ano,
    metaAnual,
    metaMensal,
    meses,
    realizadoAcumulado,
    restante: Math.max(metaAnual - realizadoAcumulado, 0),
    percentualAnual: metaAnual > 0 ? (realizadoAcumulado / metaAnual) * 100 : 0,
    mesesDeclarados,
    mediaMensalDeclarada: mesesDeclarados > 0 ? realizadoAcumulado / mesesDeclarados : 0,
    mesesAcimaDaMeta: meses.filter((m) => m.declarado && m.realizado >= metaMensal && metaMensal > 0).length,
  };
}

/** Anos presentes nas declarações, mais o ano informado, em ordem decrescente. */
export function listarAnosDisponiveis(faturamentos: DeclaracaoFaturamento[], anoAtual: number): number[] {
  const anos = new Set<number>([anoAtual]);
  for (const f of faturamentos) {
    const ano = Number(f.mesReferencia.split("-")[0]);
    if (ano) anos.add(ano);
  }
  return Array.from(anos).sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Operação: auditoria de declarações e consolidação de metas da turma
// ---------------------------------------------------------------------------

export function filtrarFaturamentosPorAluno(faturamentos: DeclaracaoFaturamento[], alunoId: string): DeclaracaoFaturamento[] {
  return faturamentos.filter((f) => f.alunoId === alunoId);
}

export function obterMetaAnualAluno(metas: Record<string, number>, alunoId: string, padrao = META_FATURAMENTO_ANUAL_PADRAO): number {
  const meta = metas[alunoId];
  return Number.isFinite(meta) && meta > 0 ? meta : padrao;
}

/**
 * Aplica a decisão da equipe sobre uma declaração.
 * Solicitar ajuste exige parecer; aprovar pode levar um parecer opcional.
 */
export function processarAuditoriaFaturamento(
  declaracao: DeclaracaoFaturamento,
  decisao: "aprovado" | "ajuste_solicitado",
  parecer: string | undefined,
  avaliadorNome: string,
  agora: Date = new Date()
): DeclaracaoFaturamento {
  const parecerLimpo = (parecer ?? "").trim();
  if (decisao === "ajuste_solicitado" && parecerLimpo.length === 0) {
    throw new Error("O parecer é obrigatório ao solicitar ajuste.");
  }
  return {
    ...declaracao,
    statusAuditoria: decisao,
    parecerAuditoria: parecerLimpo || undefined,
    auditadoPor: avaliadorNome,
    auditadoEm: agora.toISOString(),
  };
}

export interface AlunoResumoBase {
  id: string;
  nome: string;
  email?: string;
}

export interface ResumoFaturamentoAluno {
  alunoId: string;
  nome: string;
  email?: string;
  metaAnual: number;
  metaMensal: number;
  realizadoAno: number;
  percentualAnual: number;
  mesesDeclarados: number;
  mesesAcimaDaMeta: number;
  pendentes: number;
  ajustesSolicitados: number;
  ultimoMesDeclarado?: string; // YYYY-MM-01
}

/** Uma linha por aluno com meta, realizado no ano e situação da auditoria. */
export function consolidarFaturamentoTurma(
  alunos: AlunoResumoBase[],
  faturamentos: DeclaracaoFaturamento[],
  metas: Record<string, number>,
  ano: number,
  metaPadrao = META_FATURAMENTO_ANUAL_PADRAO
): ResumoFaturamentoAluno[] {
  return alunos.map((aluno) => {
    const doAluno = filtrarFaturamentosPorAluno(faturamentos, aluno.id);
    const metaAnual = obterMetaAnualAluno(metas, aluno.id, metaPadrao);
    const progresso = calcularProgressoMetaAnual(doAluno, metaAnual, ano);
    const mesesOrdenados = doAluno.map((f) => f.mesReferencia).sort();
    const ultimo = mesesOrdenados[mesesOrdenados.length - 1];

    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      metaAnual,
      metaMensal: progresso.metaMensal,
      realizadoAno: progresso.realizadoAcumulado,
      percentualAnual: progresso.percentualAnual,
      mesesDeclarados: progresso.mesesDeclarados,
      mesesAcimaDaMeta: progresso.mesesAcimaDaMeta,
      pendentes: doAluno.filter((f) => (f.statusAuditoria ?? "pendente") === "pendente").length,
      ajustesSolicitados: doAluno.filter((f) => f.statusAuditoria === "ajuste_solicitado").length,
      ultimoMesDeclarado: ultimo,
    };
  });
}

export function formatarMesReferencia(mesRef: string): string {
  const [ano, mes] = mesRef.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
