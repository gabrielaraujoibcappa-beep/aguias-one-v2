import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enviarEmail, ErroEnvioEmail } from "@/lib/email/resend";

describe("enviarEmail (Resend)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubEnv("EMAIL_REMETENTE", "ÁGUIAS ONE <nao-responda@exemplo.com.br>");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envia com autenticação, remetente configurado e tags sanitizadas", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "email-123" }) });

    const resultado = await enviarEmail({
      para: "aluno@exemplo.com",
      assunto: "Bem-vindo",
      html: "<p>Olá</p>",
      texto: "Olá",
      tags: { template: "boas-vindas", categoria: "Onboarding & Acesso" },
    });

    expect(resultado).toEqual({ id: "email-123" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_teste");
    const corpo = JSON.parse(init.body);
    expect(corpo).toMatchObject({
      from: "ÁGUIAS ONE <nao-responda@exemplo.com.br>",
      to: ["aluno@exemplo.com"],
      subject: "Bem-vindo",
      text: "Olá",
    });
    expect(corpo.tags).toContainEqual({ name: "categoria", value: "Onboarding___Acesso" });
  });

  it("propaga a mensagem de erro da Resend", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "The domain is not verified." }),
    });

    await expect(enviarEmail({ para: "a@b.com", assunto: "x", html: "x" })).rejects.toMatchObject({
      name: "ErroEnvioEmail",
      message: "The domain is not verified.",
      status: 403,
    });
  });

  it("falha sem chamar a API quando RESEND_API_KEY não existe", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(enviarEmail({ para: "a@b.com", assunto: "x", html: "x" })).rejects.toBeInstanceOf(ErroEnvioEmail);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
