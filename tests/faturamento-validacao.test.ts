import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { normalizarMesReferencia, normalizarValorBruto } from "../src/lib/api/faturamento";

const estado = vi.hoisted(() => ({
  gravado: null as any,
  sessao: { usuarioId: "aluno-1", papel: "mentorado", equipe: false, matriculaIds: ["mat-1"], turmaIds: [] } as any,
}));

vi.mock("@/lib/auth/sessao-api", () => ({
  exigirSessao: vi.fn(async () => ({ sessao: estado.sessao })),
  podeAcessarMatricula: (s: any, id: string) => s.matriculaIds.includes(id),
  respostaProibida: () => new Response(JSON.stringify({ sucesso: false }), { status: 403 }),
}));

vi.mock("@/lib/supabase/admin", () => {
  const b: any = {
    upsert: (linha: any) => {
      estado.gravado = linha;
      return b;
    },
    select: () => b,
    single: () => Promise.resolve({ data: { id: "f1" }, error: null }),
  };
  return { supabaseAdmin: { from: () => b } };
});

import { POST } from "../src/app/api/faturamentos/route";

const declarar = (corpo: object) =>
  POST(new NextRequest("http://localhost/api/faturamentos", { method: "POST", body: JSON.stringify(corpo) }));

const base = { matriculaId: "mat-1", mesReferencia: "2026-09", valorBruto: 18500.5 };

describe("normalizarValorBruto", () => {
  it("recusa null, vazio, texto, zero, negativo e valor absurdo", () => {
    for (const v of [null, undefined, "", "abc", 0, -1, 1e12, NaN, {}]) {
      expect(normalizarValorBruto(v)).toBeNull();
    }
  });

  it("aceita número e texto numérico, arredondando os centavos", () => {
    expect(normalizarValorBruto(18500.5)).toBe(18500.5);
    expect(normalizarValorBruto("1200")).toBe(1200);
    expect(normalizarValorBruto(10.129)).toBe(10.13);
  });
});

describe("normalizarMesReferencia", () => {
  it("aceita AAAA-MM e AAAA-MM-DD", () => {
    expect(normalizarMesReferencia("2026-09")).toBe("2026-09-01");
    expect(normalizarMesReferencia("2026-09-17")).toBe("2026-09-01");
  });

  it("recusa mês inválido e formato livre", () => {
    for (const v of ["2026-13", "setembro", "", null, "2026/09"]) {
      expect(normalizarMesReferencia(v)).toBeNull();
    }
  });
});

describe("POST /api/faturamentos", () => {
  beforeEach(() => {
    estado.gravado = null;
  });

  it("recusa valor nulo sem chegar ao banco (era o erro not-null)", async () => {
    const res = await declarar({ ...base, valorBruto: null });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.erro).toContain("valor bruto");
    expect(estado.gravado).toBeNull();
  });

  it("recusa mês inválido, que virava data NaN", async () => {
    const res = await declarar({ ...base, mesReferencia: "setembro" });
    expect(res.status).toBe(400);
    expect(estado.gravado).toBeNull();
  });

  it("grava valor e mês normalizados", async () => {
    const res = await declarar(base);
    expect(res.status).toBe(200);
    expect(estado.gravado).toMatchObject({ mes_referencia: "2026-09-01", valor_bruto: 18500.5 });
  });
});
