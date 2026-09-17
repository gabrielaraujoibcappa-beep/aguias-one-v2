import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  inserirUsuario: vi.fn(),
  apagarUsuario: vi.fn(),
  inserirMatricula: vi.fn(),
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  PAPEIS_GESTAO: ["admin", "concierge"],
  limparCacheMatriculas: vi.fn(),
  exigirSessao: vi.fn(async () => ({ sessao: { papel: "admin" } })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } },
    from: (tabela: string) => {
      if (tabela === "usuarios") {
        return {
          insert: () => ({ select: () => ({ single: mocks.inserirUsuario }) }),
          delete: () => ({ eq: mocks.apagarUsuario }),
        };
      }
      return { insert: mocks.inserirMatricula };
    },
  },
}));

import { POST } from "../src/app/api/admin/usuarios/route";

const corpoValido = {
  nome: "Dr. Roberto Silva",
  email: "roberto@pericia.com.br",
  senha: "senha-forte-1",
  whatsapp: "11987654321",
  turmaId: "turma-1",
};

function requisicao(corpo: object) {
  return new NextRequest("http://localhost/api/admin/usuarios", {
    method: "POST",
    body: JSON.stringify(corpo),
  });
}

describe("POST /api/admin/usuarios: falhas não viram sucesso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createUser.mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.inserirUsuario.mockResolvedValue({ data: { id: "usr-1" }, error: null });
    mocks.apagarUsuario.mockResolvedValue({ error: null });
    mocks.inserirMatricula.mockResolvedValue({ error: null });
  });

  it("cria login, usuário e matrícula e devolve o id real", async () => {
    const res = await POST(requisicao(corpoValido));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.sucesso).toBe(true);
    expect(json.usuario.id).toBe("usr-1");
  });

  it("falha quando o Auth recusa, sem gravar no banco", async () => {
    mocks.createUser.mockResolvedValue({ data: null, error: { message: "Password is too weak" } });
    const res = await POST(requisicao(corpoValido));
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.sucesso).toBe(false);
    expect(mocks.inserirUsuario).not.toHaveBeenCalled();
  });

  it("mantém 409 para e-mail já cadastrado", async () => {
    mocks.createUser.mockResolvedValue({ data: null, error: { message: "User already registered" } });
    const res = await POST(requisicao(corpoValido));
    expect(res.status).toBe(409);
  });

  it("desfaz o login quando o insert em usuarios falha", async () => {
    mocks.inserirUsuario.mockResolvedValue({ data: null, error: { message: "duplicate key" } });
    const res = await POST(requisicao(corpoValido));
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.sucesso).toBe(false);
    expect(json.erro).not.toContain("duplicate key");
    expect(mocks.deleteUser).toHaveBeenCalledWith("auth-1");
  });

  it("desfaz usuário e login quando a matrícula falha", async () => {
    mocks.inserirMatricula.mockResolvedValue({ error: { message: "fk violation" } });
    const res = await POST(requisicao(corpoValido));
    expect(res.status).toBe(500);
    expect(mocks.apagarUsuario).toHaveBeenCalledWith("id", "usr-1");
    expect(mocks.deleteUser).toHaveBeenCalledWith("auth-1");
  });
});
