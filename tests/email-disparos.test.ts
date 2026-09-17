import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  resendConfigurado: vi.fn(() => true),
  inserirLog: vi.fn(),
  matricula: { data: null as any, error: null as any },
}));

vi.mock("@/lib/email/resend", () => ({
  enviarEmail: mocks.enviarEmail,
  resendConfigurado: mocks.resendConfigurado,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela === "emails_enviados") return { insert: mocks.inserirLog };
      return { select: () => ({ eq: () => ({ maybeSingle: async () => mocks.matricula }) }) };
    },
  },
}));

import { destinatarioDaMatricula, dispararEmail, link } from "../src/lib/email/disparos";

const email = { tipo: "teste", assunto: "Assunto", preheader: "p", html: "<p>oi</p>", textoPuro: "oi" };
const disparar = (destino: { nome: string; email: string | null }) =>
  dispararEmail(destino, "checkin_aprovado", "checkin.aprovado", email as any, { matriculaId: "mat-1" });

describe("dispararEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resendConfigurado.mockReturnValue(true);
    mocks.enviarEmail.mockResolvedValue({ id: "re_123" });
    mocks.inserirLog.mockResolvedValue({ error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("envia e registra o resultado com o id da Resend", async () => {
    const r = await disparar({ nome: "Maria", email: "maria@exemplo.test" });
    expect(r).toEqual({ enviado: true });
    expect(mocks.enviarEmail).toHaveBeenCalledWith(
      expect.objectContaining({ para: "maria@exemplo.test", assunto: "Assunto" })
    );
    const registro = mocks.inserirLog.mock.calls[0][0];
    expect(registro).toMatchObject({ template_id: "checkin_aprovado", status: "enviado" });
    expect(registro.metadados).toMatchObject({ evento: "checkin.aprovado", resend_id: "re_123", matricula_id: "mat-1" });
  });

  it("registra a falha em vez de lançar erro, para não derrubar a operação", async () => {
    mocks.enviarEmail.mockRejectedValue(new Error("domínio não verificado"));
    const r = await disparar({ nome: "Maria", email: "maria@exemplo.test" });
    expect(r).toEqual({ enviado: false, motivo: "falha_envio" });
    expect(mocks.inserirLog.mock.calls[0][0]).toMatchObject({ status: "falha" });
  });

  it("pula quando não há endereço ou a chave não está configurada", async () => {
    expect(await disparar({ nome: "Sem e-mail", email: null })).toEqual({
      enviado: false,
      motivo: "sem_destinatario",
    });
    mocks.resendConfigurado.mockReturnValue(false);
    expect(await disparar({ nome: "Maria", email: "maria@exemplo.test" })).toEqual({
      enviado: false,
      motivo: "sem_configuracao",
    });
    expect(mocks.enviarEmail).not.toHaveBeenCalled();
    expect(mocks.inserirLog).not.toHaveBeenCalled();
  });

  it("sobrevive a falha na gravação do log", async () => {
    mocks.inserirLog.mockResolvedValue({ error: { message: "tabela ausente" } });
    expect(await disparar({ nome: "Maria", email: "maria@exemplo.test" })).toEqual({ enviado: true });
  });

  it("monta links absolutos a partir da URL do sistema", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sistema.exemplo.test/");
    expect(link("/faturamento")).toBe("https://sistema.exemplo.test/faturamento");
  });
});

describe("destinatarioDaMatricula", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devolve nome e e-mail do mentorado", async () => {
    mocks.matricula = { data: { id: "mat-1", usuarios: { nome: "Maria", email: "maria@exemplo.test" } }, error: null };
    expect(await destinatarioDaMatricula("mat-1")).toEqual({
      nome: "Maria",
      email: "maria@exemplo.test",
      matriculaId: "mat-1",
    });
  });

  it("devolve null quando a matrícula não existe", async () => {
    mocks.matricula = { data: null, error: null };
    expect(await destinatarioDaMatricula("mat-9")).toBeNull();
  });
});

describe("Endereço do sistema nos e-mails", () => {
  it("usa o domínio real, não localhost nem a URL da Vercel", async () => {
    const fs = await import("node:fs");
    const arquivos = ["src/lib/email/templates.ts", "src/lib/email/dados-exemplo.ts", "src/lib/api/alunos.ts"];
    for (const arquivo of arquivos) {
      const conteudo = fs.readFileSync(arquivo, "utf8");
      expect(conteudo, arquivo).not.toContain("http://localhost:3000");
      expect(conteudo, arquivo).not.toContain("mentoria-one-sistema.vercel.app");
    }
    const { URL_SISTEMA } = await import("../src/lib/url-sistema");
    expect(URL_SISTEMA).toBe("https://mentoria.one.axelpro.com.br");
  });
});
