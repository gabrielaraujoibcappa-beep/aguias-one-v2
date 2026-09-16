import { describe, it, expect } from "vitest";
import {
  AlunoTurmaRelatorio,
  DeclaracaoTurmaRelatorio,
  resolverMetaPorEmail,
  resumirFinanceiroTurma,
  totalizarFinanceiroTurma,
} from "../src/lib/api/relatorio-financeiro";
import { META_FATURAMENTO_ANUAL_PADRAO } from "../src/lib/api/faturamento";

const alunos: AlunoTurmaRelatorio[] = [
  { matricula_id: "mat-1", nome: "Roberto Silva", email: "roberto@exemplo.com.br" },
  { matricula_id: "mat-2", nome: "Mariana Costa", email: "mariana@exemplo.com.br" },
  { matricula_id: "mat-3", nome: "André Souza", email: "andre@exemplo.com.br" },
];

const declaracoes: DeclaracaoTurmaRelatorio[] = [
  { id: "f1", matriculaId: "mat-1", alunoNome: "Roberto Silva", alunoEmail: "roberto@exemplo.com.br", mesReferencia: "2026-08-01", valorBruto: 14200, statusAuditoria: "pendente" },
  { id: "f2", matriculaId: "mat-1", alunoNome: "Roberto Silva", alunoEmail: "roberto@exemplo.com.br", mesReferencia: "2026-07-01", valorBruto: 21800, statusAuditoria: "aprovado" },
  { id: "f3", matriculaId: "mat-2", alunoNome: "Mariana Costa", alunoEmail: "mariana@exemplo.com.br", mesReferencia: "2026-08-01", valorBruto: 22400, statusAuditoria: "pendente" },
];

const mentorados = [
  { id: "1", email: "roberto@exemplo.com.br" },
  { id: "2", email: "mariana@exemplo.com.br" },
];
const metas = { "1": 240000, "2": 300000 };

describe("resolverMetaPorEmail", () => {
  it("resolve a meta personalizada pelo e-mail (case-insensitive)", () => {
    expect(resolverMetaPorEmail(mentorados, metas, "ROBERTO@exemplo.com.br")).toBe(240000);
    expect(resolverMetaPorEmail(mentorados, metas, "mariana@exemplo.com.br")).toBe(300000);
  });

  it("usa a meta padrão quando o aluno não tem meta personalizada", () => {
    expect(resolverMetaPorEmail(mentorados, metas, "andre@exemplo.com.br")).toBe(META_FATURAMENTO_ANUAL_PADRAO);
    expect(resolverMetaPorEmail([], {}, "x@y.com")).toBe(META_FATURAMENTO_ANUAL_PADRAO);
  });
});

describe("resumirFinanceiroTurma", () => {
  it("gera uma linha por aluno com realizado, percentual e pendências", () => {
    const linhas = resumirFinanceiroTurma(alunos, declaracoes, mentorados, metas, 2026);

    expect(linhas).toHaveLength(3);

    const roberto = linhas[0];
    expect(roberto.realizadoAno).toBe(36000);
    expect(roberto.metaAnual).toBe(240000);
    expect(roberto.percentualAnual).toBe(15);
    expect(roberto.mesesDeclarados).toBe(2);
    expect(roberto.pendentes).toBe(1);
    expect(roberto.ajustesSolicitados).toBe(0);
    expect(roberto.ultimoMesDeclarado).toBe("2026-08-01");

    const andre = linhas[2];
    expect(andre.realizadoAno).toBe(0);
    expect(andre.metaAnual).toBe(META_FATURAMENTO_ANUAL_PADRAO);
    expect(andre.mesesDeclarados).toBe(0);
  });

  it("considera só declarações do ano selecionado no realizado", () => {
    const linhas = resumirFinanceiroTurma(alunos, declaracoes, mentorados, metas, 2025);
    expect(linhas[0].realizadoAno).toBe(0);
    // Pendências de auditoria independem do ano
    expect(linhas[0].pendentes).toBe(1);
  });
});

describe("totalizarFinanceiroTurma", () => {
  it("soma realizado, metas e pendências da turma", () => {
    const linhas = resumirFinanceiroTurma(alunos, declaracoes, mentorados, metas, 2026);
    const totais = totalizarFinanceiroTurma(linhas);

    expect(totais.totalRealizado).toBe(58400);
    expect(totais.totalMetas).toBe(240000 + 300000 + META_FATURAMENTO_ANUAL_PADRAO);
    expect(totais.totalPendentes).toBe(2);
    expect(totais.alunosComDeclaracao).toBe(2);
  });

  it("retorna zeros para turma vazia sem dividir por zero", () => {
    expect(totalizarFinanceiroTurma([])).toEqual({
      totalRealizado: 0,
      totalMetas: 0,
      percentualGeral: 0,
      totalPendentes: 0,
      totalAjustes: 0,
      alunosComDeclaracao: 0,
    });
  });
});
