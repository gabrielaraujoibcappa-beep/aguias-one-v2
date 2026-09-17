import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  caminhoPertenceAoUsuario,
  caminhoSeguro,
  detectarTipoArquivo,
  urlArquivo,
} from "../src/lib/arquivos/regras";
import { normalizarEvidencias } from "../src/lib/api/checkin";

const mocks = vi.hoisted(() => ({
  sessao: { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: ["t1"] } as any,
  upload: vi.fn(),
  assinar: vi.fn(),
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: mocks.sessao })),
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.assinar }) },
  },
}));

import { POST as upload } from "../src/app/api/upload/route";
import { GET as abrirArquivo } from "../src/app/api/arquivos/route";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]);

function requisicaoUpload(bytes: Uint8Array<ArrayBuffer>, nome: string, bucket = "evidencias") {
  const form = new FormData();
  form.append("file", new File([bytes], nome, { type: "application/pdf" }));
  form.append("bucket", bucket);
  return new NextRequest("http://localhost/api/upload", { method: "POST", body: form });
}

describe("Regras de arquivos", () => {
  it("detecta o tipo pelo conteúdo, não pelo nome", () => {
    expect(detectarTipoArquivo(PDF)).toBe("pdf");
    expect(detectarTipoArquivo(ZIP)).toBe("zip");
    expect(detectarTipoArquivo(HTML)).toBeNull();
  });

  it("recusa caminhos com travessia e caminhos de outro usuário", () => {
    expect(caminhoSeguro("aluno-1/2026-09/abc.pdf")).toBe(true);
    expect(caminhoSeguro("aluno-1/../aluno-2/x.pdf")).toBe(false);
    expect(caminhoSeguro("/mock/uploads/print.png")).toBe(false);
    expect(caminhoPertenceAoUsuario("aluno-1/2026-09/abc.pdf", "aluno-1")).toBe(true);
    expect(caminhoPertenceAoUsuario("aluno-2/2026-09/abc.pdf", "aluno-1")).toBe(false);
  });

  it("monta o link interno de abertura", () => {
    expect(urlArquivo("comprovantes", "a/b c.pdf")).toBe("/api/arquivos?bucket=comprovantes&path=a%2Fb%20c.pdf");
  });
});

describe("normalizarEvidencias", () => {
  const doAluno = (c: unknown) => caminhoPertenceAoUsuario(c, "aluno-1");

  it("exige ao menos uma evidência", () => {
    expect(normalizarEvidencias([], doAluno).erro).toBeDefined();
  });

  it("recusa link que não é http(s)", () => {
    expect(normalizarEvidencias([{ tipo: "link", valorUrl: "javascript:alert(1)" }], doAluno).erro).toBeDefined();
  });

  it("recusa arquivo fora da pasta do aluno ou com caminho de protótipo", () => {
    expect(normalizarEvidencias([{ tipo: "arquivo", storagePath: "aluno-2/x.pdf" }], doAluno).erro).toBeDefined();
    expect(normalizarEvidencias([{ tipo: "arquivo", storagePath: "/mock/uploads/x.png" }], doAluno).erro).toBeDefined();
  });

  it("gera as linhas de links e arquivos válidos", () => {
    const r = normalizarEvidencias(
      [
        { tipo: "link", rotulo: "Site", valorUrl: "https://perito.com.br" },
        { tipo: "arquivo", storagePath: "aluno-1/2026-09/a.pdf", nomeArquivo: "laudo.pdf" },
      ],
      doAluno
    );
    expect(r.linhas).toHaveLength(2);
    expect(r.linhas?.[1]).toMatchObject({ tipo: "arquivo", storage_path: "aluno-1/2026-09/a.pdf", nome_arquivo: "laudo.pdf" });
  });
});

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upload.mockResolvedValue({ data: {}, error: null });
  });

  it("grava na pasta do usuário, com nome gerado e sem sobrescrever", async () => {
    const res = await upload(requisicaoUpload(PDF, "laudo final.pdf"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.storagePath).toMatch(/^aluno-1\/\d{4}-\d{2}\/[0-9a-f-]{36}\.pdf$/);
    const [, , opcoes] = mocks.upload.mock.calls[0];
    expect(opcoes).toMatchObject({ upsert: false, contentType: "application/pdf" });
  });

  it("recusa HTML disfarçado de PDF", async () => {
    const res = await upload(requisicaoUpload(HTML, "comprovante.pdf"));
    expect(res.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("recusa ZIP no bucket de evidências e aceita em comprovantes", async () => {
    expect((await upload(requisicaoUpload(ZIP, "a.zip", "evidencias"))).status).toBe(400);
    expect((await upload(requisicaoUpload(ZIP, "a.zip", "comprovantes"))).status).toBe(200);
  });

  it("não repassa a mensagem do Storage quando falha", async () => {
    mocks.upload.mockResolvedValue({ data: null, error: { message: "bucket policy detail" } });
    const res = await upload(requisicaoUpload(PDF, "a.pdf"));
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.erro).not.toContain("policy");
  });
});

describe("GET /api/arquivos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessao = { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: [], turmaIds: [] };
    mocks.assinar.mockResolvedValue({ data: { signedUrl: "https://storage.example/assinado" }, error: null });
  });

  const abrir = (path: string) =>
    abrirArquivo(new NextRequest(`http://localhost${urlArquivo("evidencias", path)}`));

  it("redireciona o aluno para o próprio arquivo com link curto", async () => {
    const res = await abrir("aluno-1/2026-09/a.pdf");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://storage.example/assinado");
    expect(mocks.assinar).toHaveBeenCalledWith("aluno-1/2026-09/a.pdf", 300);
  });

  it("bloqueia o aluno em arquivo de outro aluno", async () => {
    expect((await abrir("aluno-2/2026-09/a.pdf")).status).toBe(403);
    expect(mocks.assinar).not.toHaveBeenCalled();
  });

  it("libera a equipe para qualquer arquivo", async () => {
    mocks.sessao = { ...mocks.sessao, papel: "concierge", equipe: true };
    expect((await abrir("aluno-2/2026-09/a.pdf")).status).toBe(302);
  });
});
