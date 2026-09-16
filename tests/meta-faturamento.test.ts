import { describe, it, expect } from "vitest";
import {
  calcularMetaMensal,
  calcularProgressoMetaAnual,
  listarAnosDisponiveis,
  META_FATURAMENTO_ANUAL_PADRAO,
  DeclaracaoFaturamento,
} from "../src/lib/api/faturamento";

const declaracoes: DeclaracaoFaturamento[] = [
  { matriculaId: "m", mesReferencia: "2026-08-01", valorBruto: 14200, comprovantes: [] },
  { matriculaId: "m", mesReferencia: "2026-07-01", valorBruto: 11800, comprovantes: [] },
  { matriculaId: "m", mesReferencia: "2026-07-01", valorBruto: 10000, comprovantes: [] }, // segundo lançamento em julho
  { matriculaId: "m", mesReferencia: "2025-12-01", valorBruto: 9000, comprovantes: [] }, // outro ano
];

describe("Meta de faturamento anual dividida em 12 meses", () => {
  it("divide a meta anual igualmente entre os 12 meses", () => {
    expect(calcularMetaMensal(240000)).toBe(20000);
    expect(calcularMetaMensal(0)).toBe(0);
    expect(META_FATURAMENTO_ANUAL_PADRAO / 12).toBe(20000);
  });

  it("consolida as declarações do ano por mês, somando lançamentos repetidos", () => {
    const progresso = calcularProgressoMetaAnual(declaracoes, 240000, 2026);

    expect(progresso.meses).toHaveLength(12);
    expect(progresso.meses[0].rotulo).toBe("Jan");
    expect(progresso.meses[11].rotulo).toBe("Dez");

    const julho = progresso.meses[6];
    const agosto = progresso.meses[7];
    expect(julho.realizado).toBe(21800);
    expect(julho.declarado).toBe(true);
    expect(agosto.realizado).toBe(14200);
    expect(agosto.percentual).toBeCloseTo(71, 0);

    // Meses sem declaração ficam zerados e marcados como não declarados
    expect(progresso.meses[0].realizado).toBe(0);
    expect(progresso.meses[0].declarado).toBe(false);
  });

  it("ignora declarações de outros anos e calcula acumulado, restante e percentual", () => {
    const progresso = calcularProgressoMetaAnual(declaracoes, 240000, 2026);

    expect(progresso.realizadoAcumulado).toBe(36000);
    expect(progresso.restante).toBe(204000);
    expect(progresso.percentualAnual).toBe(15);
    expect(progresso.mesesDeclarados).toBe(2);
    expect(progresso.mediaMensalDeclarada).toBe(18000);
    expect(progresso.mesesAcimaDaMeta).toBe(1); // julho (21.800 >= 20.000)
  });

  it("não deixa o restante negativo quando a meta é superada", () => {
    const progresso = calcularProgressoMetaAnual(declaracoes, 30000, 2026);
    expect(progresso.restante).toBe(0);
    expect(progresso.percentualAnual).toBe(120);
  });

  it("lista os anos com declarações mais o ano atual, em ordem decrescente", () => {
    expect(listarAnosDisponiveis(declaracoes, 2026)).toEqual([2026, 2025]);
    expect(listarAnosDisponiveis([], 2027)).toEqual([2027]);
  });
});
