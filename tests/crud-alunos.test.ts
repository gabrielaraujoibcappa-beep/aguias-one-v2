import { describe, it, expect } from "vitest";
import { validarDadosAluno, filtrarAlunosPorBusca, AlunoCadastro } from "../src/lib/api/alunos";

describe("CRUD de Alunos (ÁGUIAS ONE v2)", () => {
  it("deve rejeitar aluno sem campos obrigatórios", () => {
    const res = validarDadosAluno({
      nome: "",
      email: "emailinvalido",
      whatsapp: "",
      turmaId: ""
    } as Partial<AlunoCadastro>);

    expect(res.valido).toBe(false);
    expect(res.erros).toContain("nome");
    expect(res.erros).toContain("email");
    expect(res.erros).toContain("whatsapp");
    expect(res.erros).toContain("turmaId");
  });

  it("deve aceitar aluno com dados válidos", () => {
    const res = validarDadosAluno({
      nome: "Dr. Roberto Silva",
      email: "roberto@pericia.com.br",
      whatsapp: "(11) 98765-4321",
      turmaId: "turma-123",
      areaPericial: "Contábil e Financeira"
    });

    expect(res.valido).toBe(true);
    expect(res.erros.length).toBe(0);
  });

  it("deve filtrar alunos por nome, email ou telefone", () => {
    const alunos: AlunoCadastro[] = [
      { id: "1", nome: "Carlos Eduardo", email: "carlos@gmail.com", whatsapp: "11999991111", turmaId: "t1", status: "ativo" },
      { id: "2", nome: "Mariana Souza", email: "mariana@adv.com", whatsapp: "21988882222", turmaId: "t1", status: "ativo" },
      { id: "3", nome: "Ana Paula", email: "anapaula@pericia.com", whatsapp: "31977773333", turmaId: "t2", status: "trancado" },
    ];

    expect(filtrarAlunosPorBusca(alunos, "carlos").length).toBe(1);
    expect(filtrarAlunosPorBusca(alunos, "mariana@adv.com").length).toBe(1);
    expect(filtrarAlunosPorBusca(alunos, "97777").length).toBe(1);
    expect(filtrarAlunosPorBusca(alunos, "inexistente").length).toBe(0);
  });
});
