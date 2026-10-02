import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const estado = vi.hoisted(() => ({
  chave: null as null | { usuarioId: string; papel: string; chaveId: string },
  usuario: null as any,
  tocou: [] as string[],
}));

vi.mock("@/lib/auth/sessao-core", () => ({
  COOKIE_SESSAO: "sessao",
  PAPEIS_EQUIPE: ["admin", "concierge", "anjo", "mentor"],
  ehEquipe: (p: string) => ["admin", "concierge", "anjo", "mentor"].includes(p),
  resolverPerfil: vi.fn(async () => null), // sem cookie: cai na chave de API
}));

vi.mock("@/lib/api/chaves", () => ({
  resolverChaveApi: vi.fn(async () => estado.chave),
  tocarUsoChave: vi.fn(async (id: string) => {
    estado.tocou.push(id);
  }),
}));

vi.mock("@/lib/supabase/admin", () => {
  const b: any = {
    select: () => b,
    eq: () => b,
    maybeSingle: () => Promise.resolve({ data: estado.usuario, error: null }),
    then: (ok: any) => Promise.resolve({ data: [], error: null }).then(ok),
  };
  return { supabaseAdmin: { from: () => b } };
});

import { exigirSessao } from "../src/lib/auth/sessao-api";

const req = () => new NextRequest("http://localhost/api/x", { headers: { authorization: "Bearer aq1_teste" } });

describe("exigirSessao com chave de API", () => {
  beforeEach(() => {
    estado.chave = { usuarioId: "u-anjo", papel: "anjo", chaveId: "k1" };
    estado.usuario = { id: "u-anjo", auth_id: "a1", nome: "Ana", email: "ana@x.com", papel: "anjo", status: "ativo" };
    estado.tocou = [];
  });

  it("aceita a chave quando o papel tem permissão e registra o uso", async () => {
    const r = await exigirSessao(req(), ["anjo", "mentor"]);
    expect(r.erro).toBeUndefined();
    expect(r.sessao?.papel).toBe("anjo");
    expect(estado.tocou).toEqual(["k1"]);
  });

  it("chave válida sem permissão para a operação devolve 403 (não 401)", async () => {
    const r = await exigirSessao(req(), ["admin"]);
    expect(r.erro?.status).toBe(403);
    const corpo = await r.erro!.json();
    expect(corpo.erro).toContain("anjo");
    // a chave chegou ao servidor: o uso fica registrado
    expect(estado.tocou).toEqual(["k1"]);
  });

  it("chave inválida, revogada ou expirada continua 401, com mensagem de chave (não de login)", async () => {
    estado.chave = null;
    const r = await exigirSessao(req(), ["anjo"]);
    expect(r.erro?.status).toBe(401);
    const corpo = await r.erro!.json();
    expect(corpo.erro).toContain("Chave de API não reconhecida");
    expect(corpo.erro).not.toContain("login");
  });
});
