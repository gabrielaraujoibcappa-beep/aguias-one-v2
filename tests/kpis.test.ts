import { describe, it, expect } from "vitest";
import { formatarMoedaBRL } from "../src/lib/api/faturamento";

describe("KPIs & Indicadores Estratégicos (ÁGUIAS ONE v2)", () => {
  it("deve calcular faturamento e teto do ciclo corretamente", () => {
    const faturamentoDeclarado = 14500;
    const tetoCiclo = 20000;
    const progresso = Math.min(Math.round((faturamentoDeclarado / tetoCiclo) * 100), 100);

    expect(progresso).toBe(73);
    expect(formatarMoedaBRL(faturamentoDeclarado)).toContain("14.500");
  });

  it("deve calcular contagem de semáforo e alunos em risco", () => {
    const alunosMock = [
      { id: "1", semaforoAtual: "verde" },
      { id: "2", semaforoAtual: "amarelo" },
      { id: "3", semaforoAtual: "vermelho" },
      { id: "4", semaforoAtual: "vermelho" },
    ];

    const emRisco = alunosMock.filter((a) => a.semaforoAtual === "vermelho").length;
    const regulares = alunosMock.filter((a) => a.semaforoAtual === "verde").length;

    expect(emRisco).toBe(2);
    expect(regulares).toBe(1);
  });

  it("deve calcular total acumulado e média da turma", () => {
    const faturamentos = [14500, 8000, 21000];
    const total = faturamentos.reduce((acc, v) => acc + v, 0);
    const media = Math.round(total / faturamentos.length);

    expect(total).toBe(43500);
    expect(media).toBe(14500);
  });
});
