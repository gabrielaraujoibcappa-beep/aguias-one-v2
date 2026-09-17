import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const estado = vi.hoisted(() => ({
  sessao: { usuarioId: "u1", papel: "concierge", equipe: true, matriculaIds: [], turmaIds: [] } as any,
  filtrosStatus: [] as unknown[],
  updateResultado: { data: { id: "c1" }, error: null } as any,
  neq: [] as unknown[],
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async (_req: unknown, papeis?: string[]) =>
    papeis && !papeis.includes(estado.sessao.papel)
      ? { erro: new Response(JSON.stringify({ sucesso: false }), { status: 403 }) }
      : { sessao: estado.sessao }
  ),
  podeAcessarMatricula: () => true,
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

vi.mock("@/lib/supabase/admin", () => {
  const b: any = {
    select: () => b,
    order: () => b,
    update: () => b,
    eq: () => b,
    in: (_col: string, valores: unknown) => {
      estado.filtrosStatus.push(valores);
      return b;
    },
    neq: (_col: string, valor: unknown) => {
      estado.neq.push(valor);
      return b;
    },
    maybeSingle: () => Promise.resolve(estado.updateResultado),
    then: (ok: any) => Promise.resolve({ data: [], error: null }).then(ok),
  };
  return { supabaseAdmin: { from: () => b } };
});

import { GET } from "../src/app/api/checkins/route";
import { PATCH } from "../src/app/api/checkins/[id]/auditar/route";

const listar = (query: string) => GET(new NextRequest(`http://localhost/api/checkins?${query}`));
const auditar = (status: string) =>
  PATCH(new NextRequest("http://localhost/api/checkins/c1/auditar", { method: "PATCH", body: JSON.stringify({ status }) }), {
    params: Promise.resolve({ id: "c1" }),
  });

describe("GET /api/checkins para a equipe", () => {
  beforeEach(() => {
    estado.sessao = { usuarioId: "u1", papel: "concierge", equipe: true, matriculaIds: [], turmaIds: [] };
    estado.filtrosStatus = [];
  });

  it("todas=true traz a fila e o histórico (sem filtro de status)", async () => {
    expect((await listar("todas=true")).status).toBe(200);
    expect(estado.filtrosStatus).toEqual([]);
  });

  it("pendentes=true continua trazendo só a fila", async () => {
    await listar("pendentes=true");
    expect(estado.filtrosStatus).toEqual([["aguardando_avaliacao", "ajuste_solicitado"]]);
  });

  it("mentorado não lista entregas da turma", async () => {
    estado.sessao = { usuarioId: "a1", papel: "mentorado", equipe: false, matriculaIds: ["m1"], turmaIds: [] };
    expect((await listar("todas=true")).status).toBe(403);
  });
});

describe("PATCH /api/checkins/[id]/auditar", () => {
  beforeEach(() => {
    estado.sessao = { usuarioId: "u1", papel: "concierge", equipe: true, matriculaIds: [], turmaIds: [] };
    estado.updateResultado = { data: { id: "c1" }, error: null };
    estado.neq = [];
  });

  it("anjo é recusado", async () => {
    estado.sessao = { ...estado.sessao, papel: "anjo" };
    expect((await auditar("aprovado")).status).toBe(403);
  });

  it("não altera entrega já aprovada", async () => {
    estado.updateResultado = { data: null, error: null };
    expect((await auditar("ajuste_solicitado")).status).toBe(409);
    expect(estado.neq).toEqual(["aprovado"]);
  });

  it("concierge aprova entrega pendente", async () => {
    expect((await auditar("aprovado")).status).toBe(200);
  });
});
