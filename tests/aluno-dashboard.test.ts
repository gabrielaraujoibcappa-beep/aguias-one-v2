import { describe, it, expect } from "vitest";
import { obterAtalhosDashboard } from "../src/components/aluno/AtalhosPrincipais";

describe("Dashboard Inicial do Mentorado (ÁGUIAS ONE v2)", () => {
  it("deve conter exatamente os 3 atalhos prioritários: checkin, canais e faturamento", () => {
    const atalhos = obterAtalhosDashboard({
      moduloLiberadoId: "mod-1",
      moduloLiberadoTitulo: "Árvore de Pastas no Google Drive",
      checkinPendente: true,
      faturamentoMes: "Setembro/2026",
    });

    expect(atalhos.length).toBe(3);
    expect(atalhos.map((a) => a.chave)).toEqual(["checkin", "canais", "faturamento"]);
    expect(atalhos[0].href).toBe("/checkin/mod-1");
    expect(atalhos[1].href).toBe("/canais");
    expect(atalhos[2].href).toBe("/faturamento");
  });
});
