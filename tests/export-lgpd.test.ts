import { describe, it, expect } from "vitest";
import { podeAcessarMatricula, type Sessao } from "../src/lib/auth/sessao-api";
import { podeExibirExport } from "../src/components/equipe/BotaoExportDossie";

const sessaoMentorado = (matriculaIds: string[]): Sessao => ({
  usuarioId: "u1",
  authId: "a1",
  nome: "Perito",
  email: "p@teste.com",
  papel: "mentorado",
  status: "ativo",
  equipe: false,
  matriculaIds,
  turmaIds: ["t1"],
});

const sessaoEquipe = (papel: Sessao["papel"]): Sessao => ({
  usuarioId: "e1",
  authId: "a2",
  nome: "Equipe",
  email: "e@teste.com",
  papel,
  status: "ativo",
  equipe: true,
  matriculaIds: [],
  turmaIds: [],
});

describe("Export LGPD troca-matricula (v3-A4)", () => {
  it("mentorado só acessa a própria matrícula", () => {
    const s = sessaoMentorado(["m1"]);
    expect(podeAcessarMatricula(s, "m1")).toBe(true);
    expect(podeAcessarMatricula(s, "m2")).toBe(false);
    expect(podeAcessarMatricula(s, null)).toBe(false);
  });

  it("equipe acessa qualquer matrícula", () => {
    for (const papel of ["admin", "concierge", "anjo", "mentor"] as const) {
      expect(podeAcessarMatricula(sessaoEquipe(papel), "qualquer")).toBe(true);
    }
  });

  it("botão segue leitura da equipe (anjo incluído)", () => {
    expect(podeExibirExport("concierge")).toBe(true);
    expect(podeExibirExport("anjo")).toBe(true);
    expect(podeExibirExport("mentorado")).toBe(false);
  });

  it("entrega carrega matriculaId (sem lookup por nome)", async () => {
    const { mapearEntrega } = await import("../src/lib/api/adaptadores");
    const e = mapearEntrega({ id: "x", status: "aprovado", alunoNome: "Comum", matricula_id: "m9" });
    expect(e.matriculaId).toBe("m9");
  });
});
