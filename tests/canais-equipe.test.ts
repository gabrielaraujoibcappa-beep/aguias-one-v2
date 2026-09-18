import { describe, it, expect, vi, afterEach } from "vitest";
import { salvarCanalEquipe } from "../src/lib/api/canais";

describe("salvarCanalEquipe (visão do aluno)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envia matrícula, canal, status e url", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ sucesso: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const resultado = await salvarCanalEquipe({
      matriculaId: "mat-1",
      canalNome: "Instagram",
      status: "ativo",
      urlCanal: "https://instagram.com/escritorio",
    });
    expect(resultado.sucesso).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/canais");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      matriculaId: "mat-1",
      canalNome: "Instagram",
      status: "ativo",
      urlCanal: "https://instagram.com/escritorio",
    });
  });

  it("propaga erro da API sem lançar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ sucesso: false, erro: "Canal inválido." }) })));
    const resultado = await salvarCanalEquipe({ matriculaId: "mat-1", canalNome: "X", status: "ativo" });
    expect(resultado).toEqual({ sucesso: false, erro: "Canal inválido." });
  });

  it("falha de rede vira erro tratado", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("rede");
    }));
    const resultado = await salvarCanalEquipe({ matriculaId: "mat-1", canalNome: "X", status: "ativo" });
    expect(resultado.sucesso).toBe(false);
  });
});
