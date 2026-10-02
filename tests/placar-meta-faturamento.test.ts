import { describe, it, expect } from "vitest";
import { calcularProgressoMetaAnual, listarAnosDisponiveis, type DeclaracaoFaturamento } from "../src/lib/api/faturamento";
import { mesesDoPlacar } from "../src/lib/diagnostico/regras";

const declaracao = (mesReferencia: string, valorBruto: number): DeclaracaoFaturamento => ({
  matriculaId: "mat-1",
  mesReferencia,
  valorBruto,
  comprovantes: [],
});

describe("mesesDoPlacar", () => {
  it("converte os 6 meses do placar (centavos) em reais, do mais antigo ao mais recente", () => {
    const payload = {
      "mes_1.pericia": 500000, // R$ 5.000
      "mes_1.at": 100000,
      "mes_1.fonte": "extrato",
      "mes_2.pericia": 0, // zero é valor
      "mes_2.fonte": "nota",
      "mes_3.fonte": "nao_sei", // sem número
      "mes_4.pericia": 200000,
      "mes_4.fonte": "nao_sei", // "não sei" não conta
      "mes_6.outro": 300000,
      "mes_6.fonte": "memoria",
    };
    expect(mesesDoPlacar(payload, "2026-09-15T12:00:00Z")).toEqual([
      { mesReferencia: "2026-03-01", valorBruto: 6000 },
      { mesReferencia: "2026-04-01", valorBruto: 0 },
      { mesReferencia: "2026-08-01", valorBruto: 3000 },
    ]);
  });
});

describe("calcularProgressoMetaAnual com placar de entrada", () => {
  const placar = [
    { mesReferencia: "2026-07-01", valorBruto: 4000 },
    { mesReferencia: "2026-08-01", valorBruto: 9000 },
  ];

  it("mostra o placar como referência, sem somar no realizado nem no %", () => {
    const p = calcularProgressoMetaAnual([], 120000, 2026, placar);
    expect(p.meses[6]).toMatchObject({ rotulo: "Jul", declarado: false, realizado: 0, placar: 4000 });
    expect(p.realizadoAcumulado).toBe(0);
    expect(p.percentualAnual).toBe(0);
    expect(p.mesesDeclarados).toBe(0);
  });

  it("declaração do mesmo mês prevalece sobre o placar", () => {
    const p = calcularProgressoMetaAnual([declaracao("2026-08-01", 7000)], 120000, 2026, placar);
    expect(p.meses[7]).toMatchObject({ declarado: true, realizado: 7000, placar: null });
    expect(p.realizadoAcumulado).toBe(7000);
  });

  it("ignora meses do placar de outro ano e inclui o ano do placar na lista", () => {
    const p = calcularProgressoMetaAnual([], 120000, 2025, placar);
    expect(p.meses.every((m) => m.placar === null)).toBe(true);
    expect(listarAnosDisponiveis([], 2027, [{ mesReferencia: "2025-11-01" }])).toEqual([2027, 2025]);
  });
});
