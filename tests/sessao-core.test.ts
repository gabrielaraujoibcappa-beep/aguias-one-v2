import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const USUARIO_DB = {
  id: "u-1",
  auth_id: "auth-1",
  nome: "Flávio Lopes",
  email: "flavio.lopes@unibcappa.com.br",
  papel: "concierge",
  status: "ativo",
};

async function carregarModulo(nodeEnv: string) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("@/lib/auth/sessao-core");
}

describe("resolverPerfil", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // O login de demonstração (token "demo:<email>") foi removido do sistema.
  it("recusa token de demonstração, inclusive em desenvolvimento", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { resolverPerfil } = await carregarModulo("development");
    expect(await resolverPerfil("demo:flavio.lopes@unibcappa.com.br")).toBeNull();
    // Só tenta validar como JWT no Supabase Auth; nunca busca o usuário por e-mail
    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/v1/user");
    expect(fetchMock.mock.calls.every((c) => !String(c[0]).includes("email=eq."))).toBe(true);
  });

  it("recusa JWT que o Supabase Auth não reconhece", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { resolverPerfil } = await carregarModulo("production");
    expect(await resolverPerfil("jwt-invalido")).toBeNull();
  });

  it("resolve JWT válido pelo auth_id, ignorando qualquer papel externo", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "auth-1", user_metadata: { papel: "admin" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [USUARIO_DB] });
    const { resolverPerfil } = await carregarModulo("production");
    const perfil = await resolverPerfil("jwt-valido");
    expect(perfil).toMatchObject({ papel: "concierge", usuarioId: "u-1" });
    expect(String(fetchMock.mock.calls[1][0])).toContain("auth_id=eq.auth-1");
  });

  it("recusa JWT válido sem perfil em public.usuarios", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "auth-sem-perfil" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    const { resolverPerfil } = await carregarModulo("production");
    expect(await resolverPerfil("jwt-orfao")).toBeNull();
  });

  it("retorna null sem token", async () => {
    const { resolverPerfil } = await carregarModulo("production");
    expect(await resolverPerfil(undefined)).toBeNull();
    expect(await resolverPerfil("")).toBeNull();
  });
});
