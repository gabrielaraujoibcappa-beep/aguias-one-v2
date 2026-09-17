import { describe, it, expect } from "vitest";
import {
  DeclaracaoFaturamento,
  consolidarFaturamentoTurma,
  filtrarFaturamentosPorAluno,
  obterMetaAnualAluno,
  processarAuditoriaFaturamento,
} from "../src/lib/api/faturamento";
import { migrarEstadoSalvo } from "../src/lib/store/sistema-store";
import { FATURAMENTOS_HISTORICO_MOCK, METAS_FATURAMENTO_ALUNOS_MOCK } from "./fixtures/dados-demonstracao";

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

  it("estado salvo no navegador descarta dados antigos: nada de declarações, metas ou alunos locais", () => {
    const antigo = {
      papelAtual: "concierge",
      usuarioAtual: { nome: "Flávio", email: "flavio@x.com", turmaNome: "Turma 2026.1" },
      faturamentos: [
        { id: "fat-2", matriculaId: "mat-1", mesReferencia: "2026-07-01", valorBruto: 11800, comprovantes: [] } as DeclaracaoFaturamento,
      ],
      metaFaturamentoAnual: 360000,
      metasFaturamentoAlunos: { "1": 240000 },
      alunos: [{ id: "1", nome: "Dr. Roberto Silva" }],
    };

    const migrado = migrarEstadoSalvo(antigo);

    expect(migrado.faturamentos).toEqual([]);
    expect(migrado.metasFaturamentoAlunos).toEqual({});
    expect(migrado.alunos).toEqual([]);
    expect(migrado.entregas).toEqual([]);
    expect(migrado.alunosSemaforo).toEqual([]);
    expect(migrado.sessao).toEqual({ usuarioId: null, matriculaId: null });
  });

  it("aproveita só papel e identidade exibidos, para a barra lateral não piscar", () => {
    const migrado = migrarEstadoSalvo({ papelAtual: "concierge", usuarioAtual: { nome: "Flávio", email: "flavio@x.com", turmaNome: "" } });
    expect(migrado.papelAtual).toBe("concierge");
    expect(migrado.usuarioAtual.nome).toBe("Flávio");
  });

  it("papel desconhecido salvo no navegador volta ao padrão de menor privilégio", () => {
    expect(migrarEstadoSalvo({ papelAtual: "superusuario" }).papelAtual).toBe("mentorado");
    expect(migrarEstadoSalvo(null).papelAtual).toBe("mentorado");
  });
});
