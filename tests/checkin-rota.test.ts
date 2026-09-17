import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type Resposta = { data: any; error: any };

const db = vi.hoisted(() => ({
  modulo: { id: "mod-2", numero: 2 } as any,
  matricula: { turma_id: "t1" } as any,
  liberacao: { status: "liberado" } as any,
  existente: null as any,
  upsertCheckin: { data: { id: "chk-1" }, error: null } as Resposta,
  anteriores: [] as any[],
  insertEvidencias: { error: null } as { error: any },
  chamadas: [] as string[],
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({
    sessao: { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: ["t1"] },
  })),
  podeAcessarMatricula: (s: any, id: string) => s.matriculaIds.includes(id),
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

// Builder encadeável mínimo: cada tabela devolve o dado configurado em `db`
vi.mock("@/lib/supabase/admin", () => {
  const builder = (tabela: string) => {
    let operacao = "select";
    const b: any = {
      select: () => b,
      eq: () => b,
      in: () => {
        if (operacao === "delete") db.chamadas.push("delete-evidencias");
        return operacao === "delete" ? Promise.resolve({ error: null }) : b;
      },
      upsert: () => {
        operacao = "upsert";
        db.chamadas.push(`upsert-${tabela}`);
        return b;
      },
      insert: () => {
        db.chamadas.push(`insert-${tabela}`);
        return Promise.resolve(db.insertEvidencias);
      },
      delete: () => {
        operacao = "delete";
        return b;
      },
      single: () => Promise.resolve(db.upsertCheckin),
      maybeSingle: () => {
        const dados: Record<string, any> = {
          modulos: db.modulo,
          matriculas: db.matricula,
          modulo_liberacoes: db.liberacao,
          checkins_modulo: db.existente,
        };
        return Promise.resolve({ data: dados[tabela] ?? null, error: null });
      },
      then: (ok: any) => Promise.resolve({ data: db.anteriores, error: null }).then(ok),
    };
    return b;
  };
  return { supabaseAdmin: { from: builder } };
});

import { POST } from "../src/app/api/checkins/route";

const corpo = (extra: object = {}) =>
  new NextRequest("http://localhost/api/checkins", {
    method: "POST",
    body: JSON.stringify({
      matriculaId: "mat-1",
      moduloId: "mod-2",
      evidencias: [{ tipo: "arquivo", storagePath: "aluno-1/2026-09/a.pdf", nomeArquivo: "a.pdf" }],
      ...extra,
    }),
  });

describe("POST /api/checkins", () => {
  beforeEach(() => {
    db.modulo = { id: "mod-2", numero: 2 };
    db.matricula = { turma_id: "t1" };
    db.liberacao = { status: "liberado" };
    db.existente = null;
    db.upsertCheckin = { data: { id: "chk-1" }, error: null };
    db.anteriores = [{ id: "ev-antiga" }];
    db.insertEvidencias = { error: null };
    db.chamadas = [];
  });

  it("grava a entrega e só apaga as evidências antigas depois de inserir as novas", async () => {
    const res = await POST(corpo());
    expect(res.status).toBe(200);
    expect(db.chamadas).toEqual(["upsert-checkins_modulo", "insert-checkin_evidencias", "delete-evidencias"]);
  });

  it("recusa reenvio de entrega já aprovada", async () => {
    db.existente = { id: "chk-1", status: "aprovado" };
    const res = await POST(corpo());
    expect(res.status).toBe(409);
    expect(db.chamadas).toEqual([]);
  });

  it("recusa módulo bloqueado para a turma", async () => {
    db.liberacao = { status: "bloqueado" };
    expect((await POST(corpo())).status).toBe(409);
  });

  it("aceita o módulo 1 sem registro de liberação", async () => {
    db.modulo = { id: "mod-1", numero: 1 };
    db.liberacao = null;
    expect((await POST(corpo({ moduloId: "mod-1" }))).status).toBe(200);
  });

  it("recusa arquivo com caminho de protótipo ou de outro aluno", async () => {
    const res = await POST(corpo({ evidencias: [{ tipo: "arquivo", storagePath: "/mock/uploads/print.png" }] }));
    expect(res.status).toBe(400);
    expect(db.chamadas).toEqual([]);
  });

  it("mantém as evidências antigas e avisa quando o insert das novas falha", async () => {
    db.insertEvidencias = { error: { message: "violates check constraint" } };
    const res = await POST(corpo());
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.erro).not.toContain("constraint");
    expect(db.chamadas).not.toContain("delete-evidencias");
  });

  it("bloqueia matrícula de outro aluno", async () => {
    expect((await POST(corpo({ matriculaId: "mat-9" }))).status).toBe(403);
  });
});

describe("Auditoria de check-ins pela equipe", () => {
  it("canAudit libera admin, concierge e mentor e bloqueia anjo", async () => {
    const { canAudit } = await import("../src/lib/auth/roles");
    expect(["admin", "concierge", "mentor"].every((p) => canAudit(p as any))).toBe(true);
    expect(canAudit("anjo")).toBe(false);
  });

  it("mapeia avaliador e data para o histórico", async () => {
    const { mapearEntrega } = await import("../src/lib/api/adaptadores");
    const entrega = mapearEntrega({
      id: "c1",
      alunoNome: "Maria",
      status: "aprovado",
      dataEnvio: "2026-09-10T10:00:00Z",
      avaliadoEm: "2026-09-11T10:00:00Z",
      avaliadoPor: "Flávio",
      evidencias: [],
    });
    expect(entrega).toMatchObject({ status: "aprovado", avaliadoPor: "Flávio", avaliadoEm: "2026-09-11T10:00:00Z" });
  });
});
