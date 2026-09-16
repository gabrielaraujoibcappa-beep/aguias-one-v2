import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { apenasMentorados, ehMentorado, separarPorPapel, ROTULOS_PAPEL } from "../src/lib/auth/roles";
import { TabelaAlunos } from "../src/components/admin/TabelaAlunos";
import { AlunoCadastro } from "../src/lib/api/alunos";

// Mesma composição encontrada no banco: 1 mentorado e 5 contas da equipe
const USUARIOS: AlunoCadastro[] = [
  { id: "a1", nome: "Ana Carolina", email: "ana@x.com", whatsapp: "(11) 90000-0001", turmaId: "t", status: "ativo", papel: "anjo" },
  { id: "c1", nome: "Coordenação UniBCAPPA (Admin)", email: "adm@x.com", whatsapp: "(11) 90000-0002", turmaId: "t", status: "ativo", papel: "admin" },
  { id: "m1", nome: "Dr. Carlos Teste", email: "carlos@x.com", whatsapp: "(11) 90000-0003", turmaId: "t", status: "ativo", papel: "mentorado" },
  { id: "k1", nome: "kaue tanaka", email: "kaue@x.com", whatsapp: "(11) 90000-0004", turmaId: "t", status: "ativo", papel: "admin" },
  { id: "e1", nome: "Prof. Edilson Aguiais", email: "edilson@x.com", whatsapp: "(11) 90000-0005", turmaId: "t", status: "ativo", papel: "mentor" },
  { id: "f1", nome: "Flávio Lopes", email: "flavio@x.com", whatsapp: "(11) 90000-0006", turmaId: "t", status: "ativo", papel: "concierge" },
];

describe("Papéis nas listas de alunos", () => {
  it("telas de aluno recebem só mentorados", () => {
    expect(apenasMentorados(USUARIOS).map((u) => u.nome)).toEqual(["Dr. Carlos Teste"]);
  });

  it("cadastro local sem papel conta como mentorado; qualquer papel de equipe não", () => {
    expect(ehMentorado(undefined)).toBe(true);
    expect(ehMentorado("mentorado")).toBe(true);
    expect(ehMentorado("admin")).toBe(false);
    expect(ehMentorado("concierge")).toBe(false);
    expect(ehMentorado("anjo")).toBe(false);
    expect(ehMentorado("mentor")).toBe(false);
  });

  it("separa mentorados e equipe para os filtros da Gestão de Alunos", () => {
    const { mentorados, equipe } = separarPorPapel(USUARIOS);
    expect(mentorados).toHaveLength(1);
    expect(equipe).toHaveLength(5);
  });

  it("tem rótulo em português para todos os papéis", () => {
    expect(ROTULOS_PAPEL).toEqual({
      admin: "Admin",
      concierge: "Concierge",
      anjo: "Anjo",
      mentor: "Mentor",
      resgate: "Resgate",
      mentorado: "Mentorado",
    });
  });
});

describe("Gestão de Alunos com papéis", () => {
  const html = renderToStaticMarkup(
    React.createElement(TabelaAlunos, {
      alunos: USUARIOS,
      onEditar: () => {},
      onExcluir: () => {},
      onNovo: () => {},
      onGerenciarAcesso: () => {},
    })
  );

  it("abre mostrando só mentorados, com filtros de papel e contagens", () => {
    expect(html).toContain("Dr. Carlos Teste");
    expect(html).not.toContain("kaue tanaka");
    expect(html).toContain("Mentorados (1)");
    expect(html).toContain("Equipe (5)");
    expect(html).toContain("Todos (6)");
  });

  it("exibe a coluna de papel", () => {
    expect(html).toContain(">Papel<");
    expect(html).toContain(">Mentorado<");
  });
});
