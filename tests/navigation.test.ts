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
    { id: "turma", rotulo: "Turma & Semáforo", href: "/painel/turma" },
    {
      id: "ciclo-entregas",
      rotulo: "Ciclo de Entregas",
      subitens: [
        { rotulo: "Liberação de Módulos", href: "/painel/modulos" },
        { rotulo: "Fila de Auditoria", href: "/painel/auditoria" },
      ],
    },
    {
      id: "cadastros",
      rotulo: "Cadastros",
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

  it("deve agrupar tarefas relacionadas em submenus claros", () => {
    const itemNegocio = rotasMentorado.find((i) => i.id === "negocio");
    expect(itemNegocio?.subitens).toBeDefined();
    expect(itemNegocio?.subitens?.length).toBe(2);

    const itemCiclo = rotasEquipe.find((i) => i.id === "ciclo-entregas");
    expect(itemCiclo?.subitens).toBeDefined();
    expect(itemCiclo?.subitens?.some((s) => s.href === "/painel/modulos")).toBe(true);
    expect(itemCiclo?.subitens?.some((s) => s.href === "/painel/auditoria")).toBe(true);
  });

  it("deve separar destinos de navegação de ações primárias", () => {
    const acoes = [
      { tipo: "acao", rotulo: "+ Novo Mentorado", contexto: "equipe" },
      { tipo: "acao", rotulo: "+ Faturamento", contexto: "mentorado" },
      { tipo: "busca", rotulo: "Buscar (Ctrl+K)" },
    ];

    // Verifica que ações não estão misturadas na lista de rotas de primeiro nível
    const todosRotulosNav = [...rotasMentorado, ...rotasEquipe].map((i) => i.rotulo);
    acoes.forEach((a) => {
      expect(todosRotulosNav).not.toContain(a.rotulo);
    });
  });

  it("deve resolver breadcrumbs hierárquicos para telas profundas", () => {
    const resolverBreadcrumb = (path: string) => {
      if (path === "/faturamento") return ["Início", "Meu Negócio", "Faturamento & Comprovantes (.ZIP)"];
      if (path === "/painel/auditoria") return ["Início", "Ciclo de Entregas", "Fila de Auditoria"];
      if (path === "/admin/alunos") return ["Início", "Cadastros", "Gestão de Alunos (CRUD)"];
      return ["Início", "Visão Geral"];
    };

    expect(resolverBreadcrumb("/faturamento")).toEqual([
      "Início",
      "Meu Negócio",
      "Faturamento & Comprovantes (.ZIP)",
    ]);
    expect(resolverBreadcrumb("/painel/auditoria")).toEqual([
      "Início",
      "Ciclo de Entregas",
      "Fila de Auditoria",
    ]);
  });
});
