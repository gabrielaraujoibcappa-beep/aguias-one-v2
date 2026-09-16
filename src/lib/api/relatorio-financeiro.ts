import {
  DeclaracaoFaturamento,
  META_FATURAMENTO_ANUAL_PADRAO,
  calcularProgressoMetaAnual,
  obterMetaAnualAluno,
} from "@/lib/api/faturamento";

// ---------------------------------------------------------------------------
// Tipos de entrada (payloads das APIs já formatados no backend)
// ---------------------------------------------------------------------------

export interface AlunoTurmaRelatorio {
  matricula_id: string;
  nome: string;
  email: string;
}

export interface DeclaracaoTurmaRelatorio {
  id: string;
  matriculaId: string;
  alunoNome: string;
  alunoEmail: string;
  /** YYYY-MM-DD (ou YYYY-MM). */
  mesReferencia: string;
  valorBruto: number;
  statusAuditoria: "pendente" | "aprovado" | "ajuste_solicitado";
}

export interface MentoradoMeta {
  id?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// Metas: as metas personalizadas vivem no store local (chave = id do usuário).
// Os relatórios são por matrícula, então resolvemos por e-mail.
// ---------------------------------------------------------------------------

export function resolverMetaPorEmail(
  mentorados: MentoradoMeta[],
  metas: Record<string, number>,
  email: string,
  padrao = META_FATURAMENTO_ANUAL_PADRAO
): number {
  const normalizado = (email || "").trim().toLowerCase();
  const mentorado = normalizado
    ? mentorados.find((m) => (m.email || "").trim().toLowerCase() === normalizado)
    : undefined;
  if (!mentorado?.id) return padrao;
  return obterMetaAnualAluno(metas, mentorado.id, padrao);
}

// ---------------------------------------------------------------------------
// Resumo por matrícula (base do relatório geral)
// ---------------------------------------------------------------------------

export interface LinhaFinanceiroGeral {
  matriculaId: string;
  nome: string;
  email: string;
  metaAnual: number;
  realizadoAno: number;
  percentualAnual: number;
  mesesDeclarados: number;
  mesesAcimaDaMeta: number;
  pendentes: number;
  ajustesSolicitados: number;
  ultimoMesDeclarado?: string;
}

function paraDeclaracao(d: DeclaracaoTurmaRelatorio): DeclaracaoFaturamento {
  return {
    id: d.id,
    matriculaId: d.matriculaId,
    mesReferencia: d.mesReferencia,
    valorBruto: Number(d.valorBruto) || 0,
    comprovantes: [],
    statusAuditoria: d.statusAuditoria,
  };
}

export function resumirFinanceiroTurma(
  alunos: AlunoTurmaRelatorio[],
  declaracoes: DeclaracaoTurmaRelatorio[],
  mentorados: MentoradoMeta[],
  metas: Record<string, number>,
  ano: number
): LinhaFinanceiroGeral[] {
  return alunos.map((aluno) => {
    const doAluno = declaracoes.filter((d) => d.matriculaId === aluno.matricula_id);
    const metaAnual = resolverMetaPorEmail(mentorados, metas, aluno.email);
    const progresso = calcularProgressoMetaAnual(doAluno.map(paraDeclaracao), metaAnual, ano);
    const mesesOrdenados = doAluno.map((d) => d.mesReferencia).sort();

    return {
      matriculaId: aluno.matricula_id,
      nome: aluno.nome || "Mentorado",
      email: aluno.email || "",
      metaAnual,
      realizadoAno: progresso.realizadoAcumulado,
      percentualAnual: progresso.percentualAnual,
      mesesDeclarados: progresso.mesesDeclarados,
      mesesAcimaDaMeta: progresso.mesesAcimaDaMeta,
      pendentes: doAluno.filter((d) => d.statusAuditoria === "pendente").length,
      ajustesSolicitados: doAluno.filter((d) => d.statusAuditoria === "ajuste_solicitado").length,
      ultimoMesDeclarado: mesesOrdenados[mesesOrdenados.length - 1],
    };
  });
}

// ---------------------------------------------------------------------------
// Totais da turma (cabeçalho do relatório geral)
// ---------------------------------------------------------------------------

export interface TotaisFinanceirosTurma {
  totalRealizado: number;
  totalMetas: number;
  percentualGeral: number;
  totalPendentes: number;
  totalAjustes: number;
  alunosComDeclaracao: number;
}

export function totalizarFinanceiroTurma(linhas: LinhaFinanceiroGeral[]): TotaisFinanceirosTurma {
  const totalRealizado = linhas.reduce((soma, l) => soma + l.realizadoAno, 0);
  const totalMetas = linhas.reduce((soma, l) => soma + l.metaAnual, 0);
  return {
    totalRealizado,
    totalMetas,
    percentualGeral: totalMetas > 0 ? (totalRealizado / totalMetas) * 100 : 0,
    totalPendentes: linhas.reduce((soma, l) => soma + l.pendentes, 0),
    totalAjustes: linhas.reduce((soma, l) => soma + l.ajustesSolicitados, 0),
    alunosComDeclaracao: linhas.filter((l) => l.mesesDeclarados > 0).length,
  };
}
