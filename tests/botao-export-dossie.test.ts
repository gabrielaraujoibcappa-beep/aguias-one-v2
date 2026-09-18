import { describe, it, expect } from "vitest";
import { montarUrlExport, podeExibirExport } from "../src/components/equipe/BotaoExportDossie";

describe("BotaoExportDossie (v3-A2)", () => {
  it("monta querystring só com filtros preenchidos", () => {
    expect(montarUrlExport("abc123")).toBe("/api/auditoria/export?matriculaId=abc123");
    expect(montarUrlExport("abc", { decisao: "aprovado", from: "2026-09-01" })).toBe(
      "/api/auditoria/export?matriculaId=abc&decisao=aprovado&from=2026-09-01"
    );
  });

  it("exibe para a equipe incl. Anjo (leitura); parecer continua em canAudit", () => {
    expect(podeExibirExport("admin")).toBe(true);
    expect(podeExibirExport("concierge")).toBe(true);
    expect(podeExibirExport("mentor")).toBe(true);
    expect(podeExibirExport("anjo")).toBe(true);
    expect(podeExibirExport("mentorado")).toBe(false);
    expect(podeExibirExport("resgate")).toBe(false);
  });
});
