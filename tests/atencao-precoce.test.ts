import { describe, it, expect } from "vitest";
import { calcularAtraso7d, verificarAtencaoPrecoce, verificarNecessidadeResgate } from "../src/lib/api/turma-semaforo";

describe("Atencao precoce 1 amarela (v3-B1)", () => {
  it("só amarela com gatilho alerta", () => {
    expect(verificarAtencaoPrecoce("verde", { atraso7d: 0.9, faltouCall: true }).atencaoPrecoce).toBe(false);
    expect(verificarAtencaoPrecoce("vermelho", { atraso7d: 0.9, faltouCall: true }).atencaoPrecoce).toBe(false);
    expect(verificarAtencaoPrecoce("amarelo", { atraso7d: 0.1, faltouCall: false }).atencaoPrecoce).toBe(false);
    expect(verificarAtencaoPrecoce("amarelo", { atraso7d: 0.5, faltouCall: false }).motivos).toEqual(["atraso"]);
    expect(verificarAtencaoPrecoce("amarelo", { atraso7d: 0, faltouCall: true }).motivos).toEqual(["falta_call"]);
  });

  it("limiar configurável muda a fila", () => {
    expect(verificarAtencaoPrecoce("amarelo", { atraso7d: 0.5, faltouCall: false }, 0.8).atencaoPrecoce).toBe(false);
    expect(verificarAtencaoPrecoce("amarelo", { atraso7d: 0.5, faltouCall: false }, 0.2).atencaoPrecoce).toBe(true);
  });

  it("regressão resgate 2 vermelhas intacta", () => {
    expect(verificarNecessidadeResgate(["vermelho", "vermelho"]).precisaResgate).toBe(true);
    expect(verificarNecessidadeResgate(["verde", "vermelho"]).precisaResgate).toBe(false);
  });

  it("calcula atraso +7d como proporção", () => {
    const agora = new Date("2026-09-17T10:00").getTime();
    expect(calcularAtraso7d([], agora)).toBe(0);
    expect(
      calcularAtraso7d(
        [
          { status: "aguardando_avaliacao", enviadoEm: "2026-09-01T10:00" },
          { status: "aprovado", enviadoEm: "2026-09-01T10:00" },
        ],
        agora
      )
    ).toBe(0.5);
    expect(calcularAtraso7d([{ status: "aguardando_avaliacao", enviadoEm: "2026-09-16T10:00" }], agora)).toBe(0);
  });
});
