import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  ERRO_FATURAMENTO_APROVADO,
  ERRO_FATURAMENTO_SEM_COMPROVANTE,
  declaracaoTravada,
} from "../src/lib/api/faturamento";

const db = vi.hoisted(() => ({
  sessao: { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: ["t1"] } as any,
  existente: null as any,
  gravado: null as any,
  chamadas: [] as string[],
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: db.sessao })),
  podeAcessarMatricula: (s: any, id: string) => s.equipe || s.matriculaIds.includes(id),
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

vi.mock("@/lib/supabase/admin", () => {
  const builder = () => {
    const b: any = {
      select: () => b,
      eq: () => b,
      upsert: (linha: any) => {
        db.gravado = linha;
        db.chamadas.push("upsert");
        return b;
      },
      maybeSingle: () => Promise.resolve({ data: db.existente, error: null }),
      single: () => Promise.resolve({ data: { id: "fat-1" }, error: null }),
    };
    return b;
  };
  return { supabaseAdmin: { from: builder } };
});

import { POST } from "../src/app/api/faturamentos/route";

const corpo = (extra: object = {}) =>
  new NextRequest("http://localhost/api/faturamentos", {
    method: "POST",
    body: JSON.stringify({
      matriculaId: "mat-1",
      mesReferencia: "2026-09",
      valorBruto: 10000,
      storageZipPath: "aluno-1/2026-09/extrato.pdf",
      ...extra,
    }),
  });

describe("POST /api/faturamentos", () => {
  beforeEach(() => {
    db.sessao = { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: ["t1"] };
    db.existente = null;
    db.chamadas = [];
  });

  it("grava a declaração com comprovante", async () => {
    expect((await POST(corpo())).status).toBe(200);
    expect(db.chamadas).toEqual(["upsert"]);
  });

  it("recusa declaração do mentorado sem comprovante", async () => {
    const res = await POST(corpo({ storageZipPath: undefined }));
    expect(res.status).toBe(400);
    expect((await res.json()).erro).toBe(ERRO_FATURAMENTO_SEM_COMPROVANTE);
    expect(db.chamadas).toEqual([]);
  });

  it("recusa reenvio de mês já aprovado", async () => {
    db.existente = { id: "fat-1", status_auditoria: "aprovado" };
    const res = await POST(corpo());
    expect(res.status).toBe(409);
    expect((await res.json()).erro).toBe(ERRO_FATURAMENTO_APROVADO);
    expect(db.chamadas).toEqual([]);
  });

  it("aceita reenvio quando a equipe pediu ajuste e limpa o parecer anterior", async () => {
    db.existente = { id: "fat-1", status_auditoria: "ajuste_solicitado" };
    expect((await POST(corpo())).status).toBe(200);
    expect(db.gravado).toMatchObject({ status_auditoria: "pendente", parecer_auditoria: null });
  });
});

describe("declaracaoTravada", () => {
  it("só a declaração aprovada fica travada", () => {
    expect(declaracaoTravada("aprovado")).toBe(true);
    expect(declaracaoTravada("pendente")).toBe(false);
    expect(declaracaoTravada("ajuste_solicitado")).toBe(false);
    expect(declaracaoTravada(undefined)).toBe(false);
  });
});
