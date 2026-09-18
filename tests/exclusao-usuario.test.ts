import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  usuario: null as any,
  contagens: {} as Record<string, number>,
  exclusao: null as any,
  authDelete: vi.fn(),
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: { papel: "anjo", usuarioId: "anjo-1", matriculaIds: [] } })),
  limparCacheMatriculas: vi.fn(),
  PAPEIS_GESTAO: ["admin", "concierge", "mentor", "anjo"],
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: { admin: { deleteUser: mocks.authDelete } },
    from: (tabela: string) => {
      if (tabela === "usuarios") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.usuario }) }) }),
          delete: () => ({ eq: async () => mocks.exclusao }),
        };
      }
      return {
        select: () => ({ eq: async () => ({ count: mocks.contagens[tabela] ?? 0 }) }),
      };
    },
  },
}));

import { DELETE as excluir } from "../src/app/api/alunos/[id]/route";

function reqDelete() {
  return new NextRequest("http://localhost/api/alunos/usr-1", { method: "DELETE" });
}

describe("DELETE /api/alunos/[id] com rastro de auditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usuario = { auth_id: "auth-1" };
    mocks.contagens = {};
    mocks.exclusao = { error: null };
    mocks.authDelete.mockResolvedValue({ error: null });
  });

  it("bloqueia com 409 quando há nota do anjo (sem tocar no Auth)", async () => {
    mocks.contagens = { anjo_nota: 2 };
    const resp = await excluir(reqDelete(), { params: Promise.resolve({ id: "usr-1" }) } as any);
    const dados = await resp.json();
    expect(resp.status).toBe(409);
    expect(dados.sucesso).toBe(false);
    expect(mocks.authDelete).not.toHaveBeenCalled();
  });

  it("bloqueia com 409 quando há log de acesso a faturamento", async () => {
    mocks.contagens = { acesso_faturamento_log: 1 };
    const resp = await excluir(reqDelete(), { params: Promise.resolve({ id: "usr-1" }) } as any);
    expect(resp.status).toBe(409);
  });

  it("exclui quando não há trilha NOT NULL", async () => {
    const resp = await excluir(reqDelete(), { params: Promise.resolve({ id: "usr-1" }) } as any);
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(mocks.authDelete).toHaveBeenCalledWith("auth-1");
  });

  it("responde 404 para usuário inexistente", async () => {
    mocks.usuario = null;
    const resp = await excluir(reqDelete(), { params: Promise.resolve({ id: "fantasma" }) } as any);
    expect(resp.status).toBe(404);
    expect(mocks.authDelete).not.toHaveBeenCalled();
  });
});
