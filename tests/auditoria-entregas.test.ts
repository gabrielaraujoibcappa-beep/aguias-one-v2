import { describe, it, expect } from "vitest";
import { processarParecerAuditoria, EntregaPendente } from "../src/lib/api/auditoria";

describe("Auditoria de Entregas pelo Anjo e Flávio (ÁGUIAS ONE v2)", () => {
  it("aprova entrega com sucesso", () => {
    const entrega: EntregaPendente = {
      id: "ent-1",
      alunoNome: "Dr. Roberto Silva",
      moduloTitulo: "Módulo 1 — Árvore de Pastas",
      links: [{ rotulo: "Site no Ar", url: "https://periciaroberto.com.br" }],
      arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas.png", nome: "pastas.png" }],
      status: "aguardando_avaliacao",
      enviadoEm: "2026-09-15T12:00:00Z",
    };

    const resultado = processarParecerAuditoria(entrega, "aprovado", "", "Ana Carolina (Anjo)");
    expect(resultado.status).toBe("aprovado");
    expect(resultado.avaliadoPor).toBe("Ana Carolina (Anjo)");
    expect(resultado.avaliadoEm).toBeDefined();
  });

  it("exige justificativa obrigatória ao solicitar ajuste/reprovar", () => {
    const entrega: EntregaPendente = {
      id: "ent-2",
      alunoNome: "Dra. Mariana Costa",
      moduloTitulo: "Módulo 4 — Presença Digital",
      links: [],
      arquivos: [],
      status: "aguardando_avaliacao",
      enviadoEm: "2026-09-15T12:00:00Z",
    };

    expect(() => {
      processarParecerAuditoria(entrega, "ajuste_solicitado", "", "Flávio Lopes");
    }).toThrow("Motivo do ajuste é obrigatório");
  });
});
