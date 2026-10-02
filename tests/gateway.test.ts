import { describe, it, expect } from "vitest";
import {
  OPERACOES_GATEWAY,
  buscarOperacao,
  montarRota,
  operacoesDespachaveis,
} from "../src/lib/api/gateway-registry";
import { PAPEIS_CHAVES, PREFIXO_CHAVE, hashChave, validarPedidoChave, veTodasAsChaves } from "../src/lib/api/chaves";
import { montarPromptOperador } from "../src/lib/api/prompt-operador";

describe("Gateway de API — registro de todas as funções", () => {
  it("cobre todas as rotas conhecidas do sistema", () => {
    // 59 handlers mapeados (58 despacháveis + cron restrito)
    expect(OPERACOES_GATEWAY.length).toBeGreaterThanOrEqual(55);
    expect(operacoesDespachaveis().length).toBe(OPERACOES_GATEWAY.length - 1);
  });

  it("não tem operação duplicada nem rota sem método", () => {
    const nomes = OPERACOES_GATEWAY.map((o) => o.operacao);
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const o of OPERACOES_GATEWAY) {
      expect(["GET", "POST", "PUT", "PATCH", "DELETE"]).toContain(o.metodo);
      expect(o.rota.startsWith("/api/")).toBe(true);
    }
  });

  it("resolve parâmetros de rota e acusa falta", () => {
    expect(montarRota("/api/alunos/:id", { id: "abc" })).toBe("/api/alunos/abc");
    expect(montarRota("/api/chamadas/:encontroId/presencas", { encontroId: "e1" })).toBe(
      "/api/chamadas/e1/presencas"
    );
    expect(() => montarRota("/api/alunos/:id", {})).toThrow("Parâmetro de rota ausente: id");
  });

  it("bloqueia cron.diario no gateway", () => {
    const cron = buscarOperacao("cron.diario");
    expect(cron?.viaGateway).toBe(false);
  });

  it("expõe operações críticas do negócio", () => {
    for (const nome of [
      "auth.perfil",
      "alunos.listar",
      "faturamentos.auditar",
      "checkins.auditar",
      "diagnostico.enviar",
      "semaforo.painel",
      "anjo.mes6",
      "chaves.listar",
      "chaves.gerar",
      "chaves.revogar",
    ]) {
      expect(buscarOperacao(nome), nome).toBeDefined();
    }
  });

  it("retorna undefined para operação inexistente", () => {
    expect(buscarOperacao("nao.existe")).toBeUndefined();
  });

  it("monta o prompt do operador com base e catálogo", () => {
    const prompt = montarPromptOperador("https://app.exemplo.com");
    expect(prompt).toContain("https://app.exemplo.com/api/gateway");
    expect(prompt).toContain("{{CHAVE_API}}");
    expect(prompt).toContain("alunos.listar");
    expect(prompt).toContain("NUNCA");
  });
  it("libera chaves para admin, concierge, mentor e anjo; mentorado fica de fora", () => {
    expect([...PAPEIS_CHAVES].sort()).toEqual(["admin", "anjo", "concierge", "mentor"]);
    expect((PAPEIS_CHAVES as readonly string[]).includes("mentorado")).toBe(false);
  });

  it("só admin e concierge veem as chaves do time; mentor e anjo, as próprias", () => {
    expect(veTodasAsChaves("admin")).toBe(true);
    expect(veTodasAsChaves("concierge")).toBe(true);
    expect(veTodasAsChaves("mentor")).toBe(false);
    expect(veTodasAsChaves("anjo")).toBe(false);
  });

  it("valida pedido de chave sem gravar segredo", () => {
    expect(validarPedidoChave("n8n – resgate", 90)).toEqual({ nome: "n8n – resgate", expiraDias: 90 });
    expect(validarPedidoChave("ab", 90)).toHaveProperty("erro");
    expect(validarPedidoChave("ok-nome", -1)).toHaveProperty("erro");
    // Hash é determinístico e nunca contém o texto claro
    const h1 = hashChave(`${PREFIXO_CHAVE}teste`);
    expect(h1).toBe(hashChave(`${PREFIXO_CHAVE}teste`));
    expect(h1).not.toContain("teste");
  });
});
