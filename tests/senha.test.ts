import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  sessao: null as any,
  updateUser: vi.fn(),
  usuario: null as any,
  gravacao: null as any,
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async (_req: unknown, papeis?: string[]) => {
    if (!mocks.sessao) {
      return { erro: new Response(JSON.stringify({ sucesso: false }), { status: 401 }) };
    }
    if (papeis && !papeis.includes(mocks.sessao.papel)) {
      return { erro: new Response(JSON.stringify({ sucesso: false }), { status: 403 }) };
    }
    return { sessao: mocks.sessao };
  }),
  PAPEIS_GESTAO: ["admin", "concierge", "mentor", "anjo"],
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: { admin: { updateUserById: mocks.updateUser } },
    from: (tabela: string) => {
      if (tabela !== "usuarios") throw new Error(`tabela não mockada: ${tabela}`);
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.usuario }) }) }),
        update: () => ({ eq: async () => mocks.gravacao }),
      };
    },
  },
}));

import { POST as trocarSenha } from "../src/app/api/usuarios/senha/route";
import { POST as resetarSenha, gerarSenhaTemporaria } from "../src/app/api/admin/usuarios/reset-senha/route";

function reqJson(url: string, corpo: unknown) {
  return new NextRequest(url, { method: "POST", body: JSON.stringify(corpo) });
}

describe("gerarSenhaTemporaria", () => {
  it("gera formato legível de 8 caracteres", () => {
    for (let i = 0; i < 20; i++) {
      expect(gerarSenhaTemporaria()).toMatch(/^AG\d{4}[A-Z]{2}$/);
    }
  });
});

describe("POST /api/usuarios/senha (troca própria)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessao = { papel: "mentorado", usuarioId: "usr-1", authId: "auth-1", matriculaIds: ["mat-1"] };
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.gravacao = { error: null };
  });

  it("troca e limpa a flag", async () => {
    const resp = await trocarSenha(reqJson("http://localhost/api/usuarios/senha", { novaSenha: "nova-senha-1" }));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(mocks.updateUser).toHaveBeenCalledWith("auth-1", { password: "nova-senha-1" });
  });

  it("recusa senha curta (400)", async () => {
    const resp = await trocarSenha(reqJson("http://localhost/api/usuarios/senha", { novaSenha: "123" }));
    expect(resp.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("recusa sem vínculo Auth (400)", async () => {
    mocks.sessao = { ...mocks.sessao, authId: null };
    const resp = await trocarSenha(reqJson("http://localhost/api/usuarios/senha", { novaSenha: "nova-senha-1" }));
    expect(resp.status).toBe(400);
  });
});

describe("POST /api/admin/usuarios/reset-senha (equipe)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessao = { papel: "concierge", usuarioId: "eq-1", matriculaIds: [] };
    mocks.usuario = { id: "usr-9", auth_id: "auth-9", nome: "Aluno Nove" };
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.gravacao = { error: null };
  });

  it("gera temporária e marca troca obrigatória", async () => {
    const resp = await resetarSenha(reqJson("http://localhost/api/admin/usuarios/reset-senha", { usuarioId: "usr-9" }));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.senhaTemporaria).toMatch(/^AG\d{4}[A-Z]{2}$/);
    expect(mocks.updateUser).toHaveBeenCalledOnce();
  });

  it("mentorado não reseta (403)", async () => {
    mocks.sessao = { papel: "mentorado", usuarioId: "usr-1", matriculaIds: ["mat-1"] };
    const resp = await resetarSenha(reqJson("http://localhost/api/admin/usuarios/reset-senha", { usuarioId: "usr-9" }));
    expect(resp.status).toBe(403);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("usuário inexistente (404) e sem vínculo (400)", async () => {
    mocks.usuario = null;
    const r404 = await resetarSenha(reqJson("http://localhost/api/admin/usuarios/reset-senha", { usuarioId: "x" }));
    expect(r404.status).toBe(404);
    mocks.usuario = { id: "usr-9", auth_id: null, nome: "Sem Auth" };
    const r400 = await resetarSenha(reqJson("http://localhost/api/admin/usuarios/reset-senha", { usuarioId: "usr-9" }));
    expect(r400.status).toBe(400);
  });
});
