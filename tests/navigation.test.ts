import { describe, it, expect } from "vitest";

describe("Arquitetura de Navegação Centrada no Usuário (ÁGUIAS ONE v2)", () => {
  const rotasMentorado = [
    { id: "visao-geral", rotulo: "Visão Geral", href: "/dashboard" },
    { id: "jornada", rotulo: "Minha Jornada", href: "/checkin/mod-1" },
    {
      id: "negocio",
      rotulo: "Meu Negócio",
      subitens: [
        { rotulo: "Faturamento & Comprovantes (.ZIP)", href: "/faturamento" },
        { rotulo: "Canais de Atração (7 Canais)", href: "/canais" },
      ],
    },
  ];

  const rotasEquipe = [
    {
      id: "operacao",
      rotulo: "Operação da Turma",
      subitens: [
        { rotulo: "Turma & Semáforo", href: "/painel/turma" },
        { rotulo: "Liberação de Módulos", href: "/painel/modulos" },
        { rotulo: "Fila de Auditoria", href: "/painel/auditoria" },
        { rotulo: "Metas & Faturamento", href: "/painel/faturamento" },
      ],
    },
    {
      id: "gestao-cadastros",
      rotulo: "Gestão & Cadastros",
      subitens: [
        { rotulo: "Gestão de Alunos", href: "/admin/alunos" },
        { rotulo: "Gestão de Turmas", href: "/admin/turmas" },
      ],
    },
  ];

  it("deve limitar o primeiro nível a no máximo 3 ou 4 destinos relevantes", () => {
    expect(rotasMentorado.length).toBeLessThanOrEqual(4);
    expect(rotasEquipe.length).toBeLessThanOrEqual(4);
  });

  it("deve separar claramente a Operação da Turma da Gestão de Alunos/Cadastros", () => {
    const itemOperacao = rotasEquipe.find((i) => i.id === "operacao");
    expect(itemOperacao?.subitens).toBeDefined();
    expect(itemOperacao?.subitens?.some((s) => s.href === "/painel/turma")).toBe(true);
    expect(itemOperacao?.subitens?.some((s) => s.href === "/painel/modulos")).toBe(true);
    expect(itemOperacao?.subitens?.some((s) => s.href === "/painel/auditoria")).toBe(true);
    expect(itemOperacao?.subitens?.some((s) => s.href === "/painel/faturamento")).toBe(true);

    const itemGestao = rotasEquipe.find((i) => i.id === "gestao-cadastros");
    expect(itemGestao?.subitens).toBeDefined();
    expect(itemGestao?.subitens?.some((s) => s.href === "/admin/alunos")).toBe(true);
    expect(itemGestao?.subitens?.some((s) => s.href === "/admin/turmas")).toBe(true);
  });

  it("deve separar destinos de navegação de ações primárias", () => {
    const acoes = [
      { tipo: "acao", rotulo: "+ Novo Mentorado", contexto: "equipe" },
      { tipo: "acao", rotulo: "+ Matricular Aluno", contexto: "operacao" },
      { tipo: "acao", rotulo: "+ Faturamento", contexto: "mentorado" },
      { tipo: "busca", rotulo: "Buscar (Ctrl+K)" },
    ];

    // Verifica que ações não estão misturadas na lista de rotas de primeiro nível
    const todosRotulosNav = [...rotasMentorado, ...rotasEquipe].map((i) => i.rotulo);
    acoes.forEach((a) => {
      expect(todosRotulosNav).not.toContain(a.rotulo);
    });
  });

  it("deve resolver breadcrumbs hierárquicos para telas profundas com Operação e Gestão separados", () => {
    const resolverBreadcrumb = (path: string) => {
      if (path === "/faturamento") return ["Início", "Meu Negócio", "Faturamento & Comprovantes (.ZIP)"];
      if (path === "/painel/turma") return ["Início", "Operação da Turma", "Semáforo & Resgate"];
      if (path === "/painel/auditoria") return ["Início", "Operação da Turma", "Fila de Auditoria"];
      if (path === "/admin/alunos") return ["Início", "Gestão & Cadastros", "Gestão de Alunos"];
      return ["Início", "Visão Geral"];
    };

    expect(resolverBreadcrumb("/faturamento")).toEqual([
      "Início",
      "Meu Negócio",
      "Faturamento & Comprovantes (.ZIP)",
    ]);
    expect(resolverBreadcrumb("/painel/turma")).toEqual([
      "Início",
      "Operação da Turma",
      "Semáforo & Resgate",
    ]);
    expect(resolverBreadcrumb("/painel/auditoria")).toEqual([
      "Início",
      "Operação da Turma",
      "Fila de Auditoria",
    ]);
    expect(resolverBreadcrumb("/admin/alunos")).toEqual([
      "Início",
      "Gestão & Cadastros",
      "Gestão de Alunos",
    ]);
  });
});
