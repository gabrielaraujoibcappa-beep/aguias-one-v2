import { describe, it, expect } from "vitest";
import { montarContextoVisaoAluno, FonteDadosVisao } from "../src/lib/api/visao-aluno";

const fonte: FonteDadosVisao = {
  alunos: [
    {
      id: "aluno-1",
      nome: "Maria Perita",
      email: "maria@exemplo.com.br",
      whatsapp: "11999990000",
      turmaId: "t1",
      turmaNome: "Turma 2026.1",
      status: "ativo",
      matriculaId: "mat-1",
    },
    {
      id: "aluno-2",
      nome: "João Solo",
      email: "joao@exemplo.com.br",
      whatsapp: "11999990001",
      turmaId: "t1",
      status: "ativo",
      matriculaId: null,
    },
  ],
  turmas: [{ id: "t1", codigo: "T1", nome: "Turma 2026.1", dataInicio: "2026-01-01", horarioEncontro: "Quartas, 18:15", status: "em_andamento" } as any],
  modulos: [
    { id: "m1", numero: 1, titulo: "Pastas", status: "aprovado" },
    { id: "m2", numero: 2, titulo: "Nomenclatura", status: "liberado" },
  ] as any,
  faturamentos: [
    { id: "f1", alunoId: "aluno-1", matriculaId: "mat-1", mesReferencia: "2026-08", valorBruto: 10000 },
    { id: "f2", alunoId: "aluno-2", matriculaId: "mat-2", mesReferencia: "2026-08", valorBruto: 999999 },
  ] as any,
  metasFaturamentoAlunos: { "aluno-1": 120000 },
  entregas: [{ id: "e1", alunoNome: "Maria Perita", matriculaId: "mat-1", status: "aprovado" }] as any,
};

describe("montarContextoVisaoAluno", () => {
  it("monta o mesmo contexto do dashboard para o aluno alvo", () => {
    const ctx = montarContextoVisaoAluno(fonte, "aluno-1");
    expect(ctx).not.toBeNull();
    expect(ctx!.turmaNome).toBe("Turma 2026.1");
    expect(ctx!.horarioEncontro).toBe("Quartas, 18:15");
    expect(ctx!.moduloAtualTitulo).toBe("Módulo 2 — Nomenclatura");
    expect(ctx!.contextoAtalhos.checkinPendente).toBe(true);
    expect(ctx!.contextoAtalhos.moduloLiberadoId).toBe("m2");
    // Somente dados do aluno alvo (nada do aluno-2 vaza)
    expect(ctx!.faturamentosDoAluno.map((f) => f.id)).toEqual(["f1"]);
    expect(ctx!.metaMensal).toBe(10000);
    expect(ctx!.entregasDoAluno.map((e) => e.id)).toEqual(["e1"]);
    expect(ctx!.matriculaId).toBe("mat-1");
  });

  it("retorna null para aluno inexistente", () => {
    expect(montarContextoVisaoAluno(fonte, "fantasma")).toBeNull();
  });

  it("sem módulo liberado, não inventa contexto", () => {
    const ctx = montarContextoVisaoAluno({ ...fonte, modulos: [] }, "aluno-1");
    expect(ctx!.moduloAtualTitulo).toBe("Nenhum módulo liberado ainda");
    expect(ctx!.contextoAtalhos.checkinPendente).toBe(false);
    expect(ctx!.contextoAtalhos.moduloLiberadoId).toBe("atual");
  });

  it("sem matrícula, matriculaId é null (canais e plano ficam ocultos)", () => {
    const ctx = montarContextoVisaoAluno(fonte, "aluno-2");
    expect(ctx!.matriculaId).toBeNull();
    expect(ctx!.faturamentosDoAluno.map((f) => f.id)).toEqual(["f2"]);
  });
});
