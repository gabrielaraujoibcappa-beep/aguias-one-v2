import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  PASTA_MATERIAIS,
  caminhoMaterial,
  caminhoMaterialLink,
  caminhoSeguro,
  ehBucketArquivo,
  ehBucketCompartilhado,
  formatarTamanhoBytes,
  slugMaterial,
  tituloDoCaminhoMaterial,
  validarUrlMaterial,
} from "../src/lib/arquivos/regras";

const mocks = vi.hoisted(() => ({
  sessao: null as any,
  upload: vi.fn(),
  listar: vi.fn(),
  remover: vi.fn(),
  assinar: vi.fn(),
  baixar: vi.fn(),
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async (_req: unknown, papeis?: string[]) => {
    if (!mocks.sessao) {
      return { erro: new Response(JSON.stringify({ sucesso: false, erro: "Sessão inválida." }), { status: 401 }) };
    }
    if (papeis && !papeis.includes(mocks.sessao.papel)) {
      return { erro: new Response(JSON.stringify({ sucesso: false, erro: "Sem permissão." }), { status: 403 }) };
    }
    return { sessao: mocks.sessao };
  }),
  PAPEIS_GESTAO: ["admin", "concierge", "mentor", "anjo"],
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: {
      from: () => ({
        upload: mocks.upload,
        list: mocks.listar,
        remove: mocks.remover,
        createSignedUrl: mocks.assinar,
        download: mocks.baixar,
      }),
    },
  },
}));

import { POST as upload } from "../src/app/api/upload/route";
import { GET as abrirArquivo } from "../src/app/api/arquivos/route";
import { GET as listarMateriais, POST as publicarLink, DELETE as removerMaterial } from "../src/app/api/materiais/route";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const EQUIPE = { usuarioId: "eq-1", papel: "concierge", equipe: true, matriculaIds: [], turmaIds: [] };
const MENTORADO = { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: ["t1"] };

function uploadMateriais(papel: any, titulo = "Contrato Modelo") {
  const form = new FormData();
  form.append("file", new File([PDF], "contrato.pdf", { type: "application/pdf" }));
  form.append("bucket", "materiais");
  form.append("titulo", titulo);
  mocks.sessao = papel;
  return upload(new NextRequest("http://localhost/api/upload", { method: "POST", body: form }));
}

describe("Regras do bucket materiais", () => {
  it("materiais é bucket válido e compartilhado", () => {
    expect(ehBucketArquivo("materiais")).toBe(true);
    expect(ehBucketCompartilhado("materiais")).toBe(true);
    expect(ehBucketCompartilhado("evidencias")).toBe(false);
  });

  it("slug e caminho canônico com round-trip de título", () => {
    expect(slugMaterial("Contrato Modelo de Parceria!")).toBe("contrato_modelo_de_parceria");
    expect(slugMaterial("   ")).toBe("material");
    const caminho = caminhoMaterial("Kits de Produtos (Bancário)", "pdf", "123e4567-e89b-12d3-a456-426614174000");
    expect(caminhoSeguro(caminho)).toBe(true);
    expect(caminho.startsWith(`${PASTA_MATERIAIS}/`)).toBe(true);
    expect(tituloDoCaminhoMaterial(caminho)).toBe("kits de produtos bancario");
    expect(tituloDoCaminhoMaterial("aluno-1/2026-09/x.pdf")).toBeNull();
  });

  it("formata tamanhos para exibição", () => {
    expect(formatarTamanhoBytes(320 * 1024)).toBe("320 KB");
    expect(formatarTamanhoBytes(Math.round(1.2 * 1024 * 1024))).toBe("1,2 MB");
    expect(formatarTamanhoBytes(null)).toBe("—");
  });

  it("link tem caminho .url e URL validada", () => {
    const caminho = caminhoMaterialLink("Planilha de Precificação", "123e4567-e89b-12d3-a456-426614174000");
    expect(caminho).toMatch(/^geral\/.+_planilha_de_precificacao\.url$/);
    expect(caminhoSeguro(caminho)).toBe(true);
    expect(tituloDoCaminhoMaterial(caminho)).toBe("planilha de precificacao");
    expect(validarUrlMaterial("https://docs.google.com/x")).toBe(true);
    expect(validarUrlMaterial("http://exemplo.com.br/a")).toBe(true);
    expect(validarUrlMaterial("javascript:alert(1)")).toBe(false);
    expect(validarUrlMaterial("ftp://arquivo.zip")).toBe(false);
    expect(validarUrlMaterial("https://com espaço.com")).toBe(false);
    expect(validarUrlMaterial("")).toBe(false);
    expect(validarUrlMaterial(null)).toBe(false);
  });
});

describe("POST /api/upload no bucket materiais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mentorado não publica material (403)", async () => {
    const resp = await uploadMateriais(MENTORADO);
    expect(resp.status).toBe(403);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("equipe publica em caminho canônico da pasta geral", async () => {
    mocks.upload.mockResolvedValue({ error: null });
    const resp = await uploadMateriais(EQUIPE);
    const dados = await resp.json();
    expect(resp.status).toBe(200);
    expect(dados.sucesso).toBe(true);
    expect(dados.storagePath).toMatch(/^geral\/.+_contrato_modelo\.pdf$/);
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
});

describe("GET /api/arquivos no bucket materiais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mentorado abre material compartilhado (não exige pasta própria)", async () => {
    mocks.sessao = MENTORADO;
    mocks.assinar.mockResolvedValue({ data: { signedUrl: "https://cdn/material.pdf" }, error: null });
    const resp = await abrirArquivo(
      new NextRequest("http://localhost/api/arquivos?bucket=materiais&path=geral/abc_contrato.pdf")
    );
    expect(resp.status).toBe(302);
  });

  it("mentorado segue bloqueado em evidência de outro usuário", async () => {
    mocks.sessao = MENTORADO;
    const resp = await abrirArquivo(
      new NextRequest("http://localhost/api/arquivos?bucket=evidencias&path=aluno-2/2026-09/x.pdf")
    );
    expect(resp.status).toBe(403);
  });
});

describe("POST /api/materiais (link)", () => {
  beforeEach(() => vi.clearAllMocks());

  function publicar(papel: any, corpo: unknown) {
    mocks.sessao = papel;
    return publicarLink(
      new NextRequest("http://localhost/api/materiais", {
        method: "POST",
        body: JSON.stringify(corpo),
      })
    );
  }

  it("mentorado não publica link (403)", async () => {
    const resp = await publicar(MENTORADO, { titulo: "Planilha", url: "https://exemplo.com.br/x" });
    expect(resp.status).toBe(403);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("equipe publica link em arquivo .url", async () => {
    mocks.upload.mockResolvedValue({ error: null });
    const resp = await publicar(EQUIPE, { titulo: "Planilha de Precificação", url: "https://exemplo.com.br/x" });
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.path).toMatch(/^geral\/.+_planilha_de_precificacao\.url$/);
    expect(mocks.upload).toHaveBeenCalledOnce();
    const [path, conteudo] = mocks.upload.mock.calls[0];
    expect(conteudo).toBe("https://exemplo.com.br/x");
  });

  it("recusa URL inválida (400)", async () => {
    const resp = await publicar(EQUIPE, { titulo: "Planilha", url: "javascript:alert(1)" });
    expect(resp.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("recusa título curto (400)", async () => {
    const resp = await publicar(EQUIPE, { titulo: "AB", url: "https://exemplo.com.br/x" });
    expect(resp.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});

describe("GET/DELETE /api/materiais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista o catálogo a partir do bucket", async () => {
    mocks.sessao = MENTORADO;
    mocks.listar.mockResolvedValue({
      data: [{ name: "uuid-1_contrato_modelo.pdf", created_at: "2026-09-18T10:00:00Z", metadata: { size: 320 * 1024 } }],
      error: null,
    });
    const resp = await listarMateriais(new NextRequest("http://localhost/api/materiais"));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.materiais).toHaveLength(1);
    expect(dados.materiais[0].titulo).toBe("contrato modelo");
    expect(dados.materiais[0].tipo).toBe("PDF");
    expect(dados.materiais[0].downloadUrl).toContain("bucket=materiais");
  });

  it("resolve item .url para a URL externa", async () => {
    mocks.sessao = MENTORADO;
    mocks.listar.mockResolvedValue({
      data: [{ name: "uuid-9_planilha_de_precificacao.url", created_at: "2026-09-18T11:00:00Z", metadata: {} }],
      error: null,
    });
    mocks.baixar.mockResolvedValue({ data: new Blob(["https://exemplo.com.br/planilha"]), error: null });
    const resp = await listarMateriais(new NextRequest("http://localhost/api/materiais"));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.materiais).toHaveLength(1);
    expect(dados.materiais[0].titulo).toBe("planilha de precificacao");
    expect(dados.materiais[0].tipo).toBe("LINK");
    expect(dados.materiais[0].downloadUrl).toBe("https://exemplo.com.br/planilha");
  });

  it("sem sessão não lista (401)", async () => {
    mocks.sessao = null;
    const resp = await listarMateriais(new NextRequest("http://localhost/api/materiais"));
    expect(resp.status).toBe(401);
  });

  it("mentorado não remove material (403)", async () => {
    mocks.sessao = MENTORADO;
    const resp = await removerMaterial(
      new NextRequest("http://localhost/api/materiais", {
        method: "DELETE",
        body: JSON.stringify({ path: "geral/uuid-1_contrato_modelo.pdf" }),
      })
    );
    expect(resp.status).toBe(403);
    expect(mocks.remover).not.toHaveBeenCalled();
  });

  it("equipe remove com caminho válido", async () => {
    mocks.sessao = EQUIPE;
    mocks.remover.mockResolvedValue({ error: null });
    const resp = await removerMaterial(
      new NextRequest("http://localhost/api/materiais", {
        method: "DELETE",
        body: JSON.stringify({ path: "geral/uuid-1_contrato_modelo.pdf" }),
      })
    );
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(mocks.remover).toHaveBeenCalledWith(["geral/uuid-1_contrato_modelo.pdf"]);
  });

  it("equipe não remove caminho fora da pasta geral (400)", async () => {
    mocks.sessao = EQUIPE;
    const resp = await removerMaterial(
      new NextRequest("http://localhost/api/materiais", {
        method: "DELETE",
        body: JSON.stringify({ path: "aluno-1/2026-09/x.pdf" }),
      })
    );
    expect(resp.status).toBe(400);
    expect(mocks.remover).not.toHaveBeenCalled();
  });
});
