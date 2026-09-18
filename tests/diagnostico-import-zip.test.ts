import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import JSZip from "jszip";
import { PECAS_DE_PE, PayloadDiagnostico, chaveMes } from "../src/lib/diagnostico/campos";

const MATRICULA = {
  id: "mat-9",
  status: "ativo",
  matriculado_em: "2026-01-01",
  turma_id: "t1",
  turmas: { nome: "T1", data_inicio: "2026-01-01" },
  usuarios: { id: "usr-9", nome: "Ana", email: "a@e.com", whatsapp: null, papel: "mentorado" },
};
const DIAG_RASCUNHO = { id: "dg-9", matricula_id: "mat-9", status: "rascunho", payload: {}, scores: {}, enviado_em: null, congelado_em: null, versao: 1 };
const DIAG_ENVIADO = { ...DIAG_RASCUNHO, status: "enviado", enviado_em: "2026-09-18T10:00:00Z", versao: 1 };

const mocks = vi.hoisted(() => ({
  matricula: null as any,
  diagAtual: null as any,
  diagGravado: null as any,
  upload: vi.fn(),
  vinculo: vi.fn(),
  evento: vi.fn(),
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: { papel: "admin", usuarioId: "adm-1", matriculaIds: [] } })),
  podeAcessarMatricula: () => true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      if (tabela === "matriculas") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.matricula }) }) }) };
      }
      if (tabela === "diagnostico") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.diagAtual }) }) }),
          update: () => ({
            eq: () => ({ in: () => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: mocks.diagGravado, error: null }) }) }) }) }),
          }),
        };
      }
      if (tabela === "diagnostico_historico" || tabela === "evento_sistema") {
        return { insert: mocks.evento };
      }
      if (tabela === "diagnostico_comprovantes") {
        return { upsert: mocks.vinculo };
      }
      throw new Error(`tabela não mockada: ${tabela}`);
    },
    storage: { from: () => ({ upload: mocks.upload }) },
  },
}));

import { POST as importar } from "../src/app/api/diagnostico/import/route";

/** Payload válido mínimo (mesmo esqueleto das personas do SPEC §13). */
function payloadValido(): PayloadDiagnostico {
  const p: PayloadDiagnostico = {
    crc_ativo: true,
    papel_principal: "pericia_judicial",
    estrutura: "sozinho",
    uf: "SP",
    trabalhos_6m: 3,
    pagou_casa: ["nada"],
    largou_12m: ["nada"],
    ultima_vez_organizou: "Em junho tentei montar a pasta.",
    forca_push: "mes_nao_repete",
    forca_pull: "ordem_pronta",
    forca_anxiety: "parcela_900",
    forca_habit: "esperar_nomeacao",
    job_frase: "Quando o mês fecha no zero, preciso de porta nova.",
    horas_semana_reais: 6,
    melhor_faixa: "noite",
    meta_6m: 800000,
    parcela_aperta: "nao",
    frase_sabado: "Sábado eu ainda estou no laudo.",
    frase_preco: "Tenho que ver e te falo.",
    frase_sozinho: "Não aguento folha de pagamento.",
    ultimo_origem: ["indicacao_advogado"],
    ultimo_preco_escrito: "inventei_na_hora",
    origens_distintas_6m: 1,
  };
  PECAS_DE_PE.forEach((peca, i) => (p[peca.valor] = i < 1));
  [0, 1200, 2800, 0, 900, 1600].forEach((v, i) => {
    p[chaveMes(i + 1, "pericia")] = v * 100;
    p[chaveMes(i + 1, "fonte")] = "extrato";
  });
  return p;
}

const PDF_FALSO = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x0a, 0x25]);

async function pacoteZip(placar: unknown, extras: Record<string, Uint8Array> = {}) {
  const zip = new JSZip();
  if (placar !== null) zip.file("placar.json", JSON.stringify(placar));
  for (const [nome, bytes] of Object.entries(extras)) zip.file(`comprovantes/${nome}`, bytes);
  return zip.generateAsync({ type: "uint8array" });
}

function reqZip(bytes: Uint8Array, campos: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", new File([bytes as any], "placar.zip", { type: "application/zip" }));
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  return new NextRequest("http://localhost/api/diagnostico/import", { method: "POST", body: form });
}

describe("POST /api/diagnostico/import via ZIP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.matricula = MATRICULA;
    mocks.diagAtual = DIAG_RASCUNHO;
    mocks.diagGravado = DIAG_ENVIADO;
    mocks.evento.mockResolvedValue({ error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.vinculo.mockResolvedValue({ error: null });
  });

  it("importa placar.json e comprovantes válidos (round-trip do export)", async () => {
    const bytes = await pacoteZip(
      { matriculaId: "mat-9", diagnostico: { payload: payloadValido() } },
      { "extrato.pdf": PDF_FALSO, "nota.txt": new TextEncoder().encode("texto puro") }
    );
    const resp = await importar(reqZip(bytes, { matriculaId: "mat-9", motivo: "Migração da Turma 1 para a v2" }));
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.diagnostico.matriculaId).toBe("mat-9");
    expect(dados.diagnostico.status).toBe("enviado");
    expect(dados.comprovantes.importados).toEqual(["extrato.pdf"]);
    expect(dados.comprovantes.ignorados).toEqual(["nota.txt"]);
    expect(mocks.upload).toHaveBeenCalledOnce();
  });

  it("recusa pacote sem placar.json (400)", async () => {
    const bytes = await pacoteZip(null, { "extrato.pdf": PDF_FALSO });
    const resp = await importar(reqZip(bytes, { matriculaId: "mat-9", motivo: "Migração da Turma 1 para a v2" }));
    expect(resp.status).toBe(400);
  });

  it("recusa arquivo que não é zip (400)", async () => {
    const resp = await importar(reqZip(PDF_FALSO, { matriculaId: "mat-9", motivo: "Migração da Turma 1 para a v2" }));
    expect(resp.status).toBe(400);
  });

  it("mantém o JSON legado funcionando", async () => {
    const resp = await importar(
      new NextRequest("http://localhost/api/diagnostico/import", {
        method: "POST",
        body: JSON.stringify({ matriculaId: "mat-9", payload: payloadValido(), motivo: "Migração da Turma 1 para a v2" }),
      })
    );
    const dados = await resp.json();
    expect(dados.sucesso).toBe(true);
    expect(dados.diagnostico.versao).toBe(1);
  });
});
