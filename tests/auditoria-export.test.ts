import { describe, it, expect } from "vitest";
import { gerarPdfDossie, montarItensDossie } from "../src/lib/pdf/auditoria-pdf";

describe("Export PDF auditoria (v3-A1/A3)", () => {
  it("monta timeline ordenada com filtros", () => {
    const itens = montarItensDossie({
      checkins: [
        { modulo: "M2", status: "aprovado", parecer: "Ok", enviadoEm: "2026-09-10T10:00", avaliadoEm: "2026-09-11T10:00" },
        { modulo: "M1", status: "ajuste_solicitado", parecer: "Refazer", enviadoEm: "2026-09-09T10:00", avaliadoEm: "2026-09-09T12:00" },
      ],
      presencas: [{ data: "2026-09-08T19:00", status: "presente" }],
      filtros: {},
    });
    expect(itens.map((i) => i.tipo)).toEqual(["presenca", "ajuste", "aprovado"]);
  });

  it("filtra por decisao e periodo", () => {
    const itens = montarItensDossie({
      checkins: [
        { modulo: "M1", status: "aprovado", enviadoEm: "2026-09-01T10:00" },
        { modulo: "M2", status: "aprovado", enviadoEm: "2026-09-20T10:00" },
      ],
      presencas: [],
      filtros: { from: "2026-09-10", to: "2026-09-30" },
    });
    expect(itens).toHaveLength(1);
  });

  it("gera buffer PDF válido com 50 itens <5s", async () => {
    const itens = Array.from({ length: 50 }, (_, i) => ({
      data: `2026-09-${String((i % 28) + 1).padStart(2, "0")} 10:00`,
      tipo: "aprovado",
      titulo: `Entrega M${i + 1}`,
      detalhe: "Parecer: ok",
    }));
    const inicio = Date.now();
    const pdf = await gerarPdfDossie({
      alunoNome: "Perito Teste",
      matricula: "abcd1234",
      turma: "T1",
      geradoEm: "2026-09-17 10:00",
      totalItens: itens.length,
      itens,
    });
    expect(Date.now() - inicio).toBeLessThan(5000);
    const cabeca = Buffer.from(pdf.slice(0, 5)).toString();
    expect(cabeca).toContain("%PDF");
    expect(pdf.length).toBeGreaterThan(2000);
  }, 10000);
});
