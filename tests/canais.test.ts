import { describe, it, expect } from "vitest";
import { CANAIS_OFICIAIS, CanalItem, atualizarStatusCanal } from "../src/lib/api/canais";

describe("Painel de Canais de Atração (ÁGUIAS ONE v2)", () => {
  it("deve conter exatamente os 7 canais oficiais na ordem pedagógica do PPC", () => {
    expect(CANAIS_OFICIAIS).toEqual([
      "WhatsApp Business",
      "Google Meu Negócio",
      "Instagram",
      "Site Próprio",
      "Newsletter",
      "YouTube",
      "Google Ads",
    ]);
  });

  it("deve permitir atualizar link e status de um canal", () => {
    const canal: CanalItem = {
      nome: "WhatsApp Business",
      ordem: 1,
      status: "nao_iniciado",
    };

    const atualizado = atualizarStatusCanal(canal, "ativo", "https://wa.me/5511999998888");
    expect(atualizado.status).toBe("ativo");
    expect(atualizado.url).toBe("https://wa.me/5511999998888");
    expect(atualizado.atualizadoEm).toBeDefined();
  });
});
