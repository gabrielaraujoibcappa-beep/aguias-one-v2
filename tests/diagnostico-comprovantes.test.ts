import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import JSZip from "jszip";

const MATRICULA = {
  id: "mat-1",
  status: "ativo",
  matriculado_em: "2026-01-01",
  turma_id: "t1",
  turmas: { nome: "T1", data_inicio: "2026-01-01" },
  usuarios: { id: "usr-1", nome: "Maria", email: "m@e.com", whatsapp: null, papel: "mentorado" },
};
const SESSAO = { papel: "mentorado", usuarioId: "aluno-1", matriculaIds: ["mat-1"] } as any;

const mocks = vi.hoisted(() => ({
  matriculas: null as any,
  diagnostico: null as any,
  lista: null as any,
  vinculo: null as any,
  linha: null as any,
  removido: null as any,
  evento: null as any,
  assinado: null as any,
  download: null as any,
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: SESSAO })),
  podeAcessarMatricula: () => true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela === "matriculas") {
        return {
          select: () => ({
            in: () => ({ order: async () => ({ data: mocks.matriculas }) }),
            eq: () => ({ maybeSingle: async () => ({ data: mocks.matriculas[0] ?? null }) }),
          }),
        };
      }
      if (tabela === "diagnostico") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.diagnostico }) }) }) };
      }
      if (tabela === "diagnostico_comprovantes") {
        return {
          select: () => ({
            eq: (campo: string, valor: unknown) => {
              if (campo === "matricula_id") {
                return { order: async () => ({ data: mocks.lista, error: null }) };
              }
              return { maybeSingle: async () => ({ data: mocks.linha, error: null }) };
            },
          }),
          upsert: () => ({ select: () => ({ single: async () => mocks.vinculo }) }),
          delete: () => ({ eq: async () => mocks.removido }),
        };
      }
      if (tabela === "evento_sistema") {
        return { insert: async () => mocks.evento };
      }
      throw new Error(`tabela não mockada: ${tabela}`);
    },
    storage: {
      from: () => ({ createSignedUrl: mocks.assinado, download: mocks.download }),
    },
  },
}));

import { GET as listar, POST as vincular, DELETE as remover } from "../src/app/api/diagnostico/comprovantes/route";
import { GET as exportar } from "../src/app/api/diagnostico/export/route";

const DIAG_ENVIADO = { id: "dg-1", matricula_id: "mat-1", status: "enviado", payload: { a: 1 }, scores: {}, enviado_em: "2026-09-01", congelado_em: null, versao: 1 };

function reqJson(url: string, method: string, corpo: unknown) {
  return new NextRequest(url, { method, body: JSON.stringify(corpo) });
}

describe("Comprovantes do placar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.matriculas = [MATRICULA];
    mocks.diagnostico = DIAG_ENVIADO;
    mocks.lista = [];
    mocks.evento = { error: null };
    mocks.assinado = async () => ({ data: { signedUrl: "https://x" }, error: null });
  });

  it("vincula arquivo da própria pasta", async () => {
    mocks.vinculo = { data: { id: "c1", nome_arquivo: "extrato.pdf" }, error: null };
    const resp = await vincular(
      reqJson("http://localhost/api/diagnostico/comprovantes", "POST", {
        storagePath: "aluno-1/2026-09/abc.pdf",
        nomeArquivo: "extrato.pdf",
        tamanhoBytes: 1234,
      })
    );
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.comprovante.id).toBe("c1");
  });

  it("recusa arquivo fora da pasta do aluno (400)", async () => {
    const resp = await vincular(
      reqJson("http://localhost/api/diagnostico/comprovantes", "POST", {
        storagePath: "aluno-2/2026-09/x.pdf",
        nomeArquivo: "x.pdf",
      })
    );
    expect(resp.status).toBe(400);
  });

  it("recusa vínculo com placar congelado (409)", async () => {
    mocks.diagnostico = { ...DIAG_ENVIADO, status: "congelado" };
    const resp = await vincular(
      reqJson("http://localhost/api/diagnostico/comprovantes", "POST", {
        storagePath: "aluno-1/2026-09/abc.pdf",
        nomeArquivo: "extrato.pdf",
      })
    );
    expect(resp.status).toBe(409);
  });

  it("lista os vinculados", async () => {
    mocks.lista = [{ id: "c1", nome_arquivo: "extrato.pdf" }];
    const resp = await listar(new NextRequest("http://localhost/api/diagnostico/comprovantes"));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.comprovantes).toHaveLength(1);
  });

  it("remove vínculo próprio", async () => {
    mocks.linha = { id: "c1", diagnostico_id: "dg-1", matricula_id: "mat-1", nome_arquivo: "extrato.pdf" };
    mocks.removido = { error: null };
    const resp = await remover(reqJson("http://localhost/api/diagnostico/comprovantes", "DELETE", { id: "c1" }));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
  });
});

describe("GET /api/diagnostico/export (ZIP)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.matriculas = [MATRICULA];
    mocks.diagnostico = DIAG_ENVIADO;
    mocks.evento = { error: null };
  });

  it("gera ZIP com placar.json e comprovantes", async () => {
    mocks.lista = [{ id: "c1", storage_path: "aluno-1/2026-09/abc.pdf", nome_arquivo: "extrato agosto.pdf" }];
    mocks.download = async () => ({ data: new Blob(["conteudo-falso"]), error: null });
    const resp = await exportar(new NextRequest("http://localhost/api/diagnostico/export"));
    expect(resp.headers.get("Content-Type")).toBe("application/zip");
    expect(resp.headers.get("Content-Disposition") || "").toContain(".zip");
    const zip = await JSZip.loadAsync(await resp.arrayBuffer());
    expect(zip.file("placar.json")).not.toBeNull();
    expect(zip.file("LEIA-ME.txt")).not.toBeNull();
    const nomes = Object.keys(zip.files);
    expect(nomes.some((n) => n.startsWith("comprovantes/") && n.endsWith(".pdf"))).toBe(true);
    const placar = JSON.parse(await zip.file("placar.json")!.async("string"));
    expect(placar.diagnostico.status).toBe("enviado");
    expect(placar.diagnostico.payload).toEqual({ a: 1 });
  });

  it("exporta só o placar quando arquivo sumiu do Storage", async () => {
    mocks.lista = [{ id: "c1", storage_path: "aluno-1/x.pdf", nome_arquivo: "x.pdf" }];
    mocks.download = async () => ({ data: null, error: { message: "não achado" } });
    const resp = await exportar(new NextRequest("http://localhost/api/diagnostico/export"));
    expect(resp.headers.get("Content-Type")).toBe("application/zip");
    const zip = await JSZip.loadAsync(await resp.arrayBuffer());
    expect(zip.file("placar.json")).not.toBeNull();
    expect(Object.keys(zip.files).some((n) => n.startsWith("comprovantes/"))).toBe(false);
  });
});
