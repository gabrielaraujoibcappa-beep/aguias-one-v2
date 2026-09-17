import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  inserirUsuario: vi.fn(),
  apagarUsuario: vi.fn(),
  inserirMatricula: vi.fn(),
  dispararEmail: vi.fn(),
}));

// O e-mail de boas-vindas nunca pode derrubar a criação da conta
vi.mock("@/lib/email/disparos", () => ({
  dispararEmail: mocks.dispararEmail,
  link: (caminho: string) => `https://exemplo.test${caminho}`,
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
      if (tabela === "turmas") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { nome: "Águias ONE 2026.1" } }) }) }) };
      }
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
    mocks.dispararEmail.mockResolvedValue({ enviado: true });
  });

  it("cria login, usuário e matrícula e devolve o id real", async () => {
    const res = await POST(requisicao(corpoValido));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.sucesso).toBe(true);
    expect(json.usuario.id).toBe("usr-1");
  });

  it("envia boas-vindas sem a senha inicial (ela vai pelo WhatsApp)", async () => {
    await POST(requisicao(corpoValido));
    expect(mocks.dispararEmail).toHaveBeenCalledTimes(1);
    const [destinatario, templateId, evento, email] = mocks.dispararEmail.mock.calls[0];
    expect(destinatario).toMatchObject({ email: "roberto@pericia.com.br" });
    expect(templateId).toBe("boas_vindas");
    expect(evento).toBe("usuario.criado");
    expect(email.html).not.toContain(corpoValido.senha);
    expect(email.textoPuro).not.toContain(corpoValido.senha);
  });

  it("conta criada continua valendo se o e-mail falhar", async () => {
    mocks.dispararEmail.mockResolvedValue({ enviado: false, motivo: "falha_envio" });
    const res = await POST(requisicao(corpoValido));
    expect(res.status).toBe(200);
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
