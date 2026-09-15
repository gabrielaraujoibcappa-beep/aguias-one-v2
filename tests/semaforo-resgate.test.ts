import { describe, it, expect } from "vitest";
import {
  verificarNecessidadeResgate,
  gerarLinkWhatsAppResgate,
  AlunoSemaforoStatus,
} from "../src/lib/api/turma-semaforo";

describe("Painel Operacional da Turma & Resgate (ÁGUIAS ONE v2)", () => {
  it("dispara necessidade de resgate se aluno estiver 2 semanas seguidas no vermelho", () => {
    const historicoVermelhoDuplo = ["vermelho", "vermelho"];
    expect(verificarNecessidadeResgate(historicoVermelhoDuplo).precisaResgate).toBe(true);
    expect(verificarNecessidadeResgate(historicoVermelhoDuplo).semanasVermelhas).toBe(2);

    const historicoMisto = ["verde", "vermelho"];
    expect(verificarNecessidadeResgate(historicoMisto).precisaResgate).toBe(false);
  });

  it("deve gerar link seguro do WhatsApp com mensagem de resgate contextualizada", () => {
    const aluno: AlunoSemaforoStatus = {
      id: "1",
      nome: "Carlos Eduardo",
      whatsapp: "(11) 98765-4321",
      semaforoAtual: "vermelho",
      historicoSemaforos: ["vermelho", "vermelho"],
      precisaResgate: true,
      moduloAtual: "Módulo 2 — Agenda",
    };

    const link = gerarLinkWhatsAppResgate(aluno, "Flávio Lopes");
    expect(link).toContain("https://wa.me/5511987654321");
    expect(link).toContain("Fl%C3%A1vio%20Lopes");
    expect(link).toContain("Carlos%20Eduardo");
  });
});
