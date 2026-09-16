import { describe, it, expect } from "vitest";
import {
  DeclaracaoFaturamento,
  FATURAMENTOS_HISTORICO_MOCK,
  METAS_FATURAMENTO_ALUNOS_MOCK,
  consolidarFaturamentoTurma,
  filtrarFaturamentosPorAluno,
  obterMetaAnualAluno,
  processarAuditoriaFaturamento,
} from "../src/lib/api/faturamento";
import { migrarEstadoSalvo, ALUNO_ATUAL_ID } from "../src/lib/store/sistema-store";

const ALUNOS = [
  { id: "1", nome: "Dr. Roberto Silva", email: "roberto@pericia.com.br" },
  { id: "2", nome: "Dra. Mariana Costa" },
  { id: "3", nome: "Dr. André Martins" },
];

describe("Auditoria de metas e faturamento (área de Operação)", () => {
  it("separa as declarações por mentorado", () => {
    expect(filtrarFaturamentosPorAluno(FATURAMENTOS_HISTORICO_MOCK, "1").map((f) => f.id)).toEqual(["fat-1", "fat-2"]);
    expect(filtrarFaturamentosPorAluno(FATURAMENTOS_HISTORICO_MOCK, "3")).toHaveLength(1);
    expect(filtrarFaturamentosPorAluno(FATURAMENTOS_HISTORICO_MOCK, "inexistente")).toHaveLength(0);
  });

  it("usa a meta do aluno e cai no padrão quando não há meta definida", () => {
    expect(obterMetaAnualAluno(METAS_FATURAMENTO_ALUNOS_MOCK, "2")).toBe(300000);
    expect(obterMetaAnualAluno({}, "2")).toBe(240000);
    expect(obterMetaAnualAluno({ "2": 0 }, "2", 120000)).toBe(120000);
  });

  it("aprova uma declaração registrando avaliador e data", () => {
    const pendente = FATURAMENTOS_HISTORICO_MOCK[0];
    const agora = new Date("2026-09-16T12:00:00Z");
    const aprovada = processarAuditoriaFaturamento(pendente, "aprovado", undefined, "Ana Carolina (Anjo)", agora);

    expect(aprovada.statusAuditoria).toBe("aprovado");
    expect(aprovada.auditadoPor).toBe("Ana Carolina (Anjo)");
    expect(aprovada.auditadoEm).toBe(agora.toISOString());
    expect(aprovada.parecerAuditoria).toBeUndefined();
  });

  it("exige parecer ao solicitar ajuste", () => {
    const pendente = FATURAMENTOS_HISTORICO_MOCK[0];
    expect(() => processarAuditoriaFaturamento(pendente, "ajuste_solicitado", "   ", "Flávio Lopes (Concierge)")).toThrow();

    const ajustada = processarAuditoriaFaturamento(pendente, "ajuste_solicitado", "Valor diverge do extrato.", "Flávio Lopes (Concierge)");
    expect(ajustada.statusAuditoria).toBe("ajuste_solicitado");
    expect(ajustada.parecerAuditoria).toBe("Valor diverge do extrato.");
  });

  it("consolida meta, realizado e pendências por mentorado no ano", () => {
    const resumos = consolidarFaturamentoTurma(ALUNOS, FATURAMENTOS_HISTORICO_MOCK, METAS_FATURAMENTO_ALUNOS_MOCK, 2026);

    expect(resumos).toHaveLength(3);

    const roberto = resumos[0];
    expect(roberto.metaAnual).toBe(240000);
    expect(roberto.metaMensal).toBe(20000);
    expect(roberto.realizadoAno).toBe(26000);
    expect(roberto.pendentes).toBe(1);
    expect(roberto.ajustesSolicitados).toBe(0);
    expect(roberto.ultimoMesDeclarado).toBe("2026-08-01");

    const mariana = resumos[1];
    expect(mariana.realizadoAno).toBe(59450);
    expect(mariana.mesesDeclarados).toBe(3);
    expect(mariana.mesesAcimaDaMeta).toBe(0); // meta mensal de 25.000

    const andre = resumos[2];
    expect(andre.ajustesSolicitados).toBe(1);
    expect(andre.pendentes).toBe(0);
    expect(Math.round(andre.percentualAnual)).toBe(3);
  });

  it("migra estados salvos antigos: declarações sem aluno e meta única viram dados do aluno da sessão", () => {
    const antigo = {
      faturamentos: [
        { matriculaId: "mat-atual", mesReferencia: "2026-09-01", valorBruto: 5000, comprovantes: [] } as DeclaracaoFaturamento,
      ],
      metaFaturamentoAnual: 360000,
    };

    const migrado = migrarEstadoSalvo(antigo);

    expect(migrado.faturamentos[0].alunoId).toBe(ALUNO_ATUAL_ID);
    expect(migrado.faturamentos[0].statusAuditoria).toBe("pendente");
    expect(migrado.metasFaturamentoAlunos[ALUNO_ATUAL_ID]).toBe(360000);
    expect(migrado.metasFaturamentoAlunos["2"]).toBe(300000); // demais metas vêm do estado inicial
    expect(migrado.alunos.length).toBeGreaterThan(0);

    // Na migração única, as declarações de demonstração ausentes são acrescentadas
    expect(migrado.faturamentos.some((f) => f.id === "fat-3" && f.alunoId === "2")).toBe(true);
    expect(migrado.faturamentos).toHaveLength(1 + FATURAMENTOS_HISTORICO_MOCK.length);
  });

  it("na migração única, uma cópia antiga de declaração de demonstração recebe o status do mock", () => {
    const antigo = {
      faturamentos: [{ id: "fat-2", matriculaId: "mat-1", mesReferencia: "2026-07-01", valorBruto: 11800, comprovantes: [] } as DeclaracaoFaturamento],
      metaFaturamentoAnual: 240000,
    };
    const migrado = migrarEstadoSalvo(antigo);
    const fat2 = migrado.faturamentos.find((f) => f.id === "fat-2");
    expect(fat2?.statusAuditoria).toBe("aprovado");
    expect(fat2?.auditadoPor).toBe("Flávio Lopes (Concierge)");
  });

  it("estados já migrados não recebem declarações de demonstração de volta", () => {
    const atual = { faturamentos: [], metasFaturamentoAlunos: { "1": 240000 } };
    expect(migrarEstadoSalvo(atual).faturamentos).toHaveLength(0);
  });
});
