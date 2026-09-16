import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumoFiltrosAtivos, FiltroAtivoItem } from "../src/components/ui/ResumoFiltrosAtivos";

describe("Componente ResumoFiltrosAtivos (Câmara UX, Baymard, Carbon e PatternFly)", () => {
  const filtrosExemplo: FiltroAtivoItem[] = [
    {
      id: "semaforo",
      categoria: "Semáforo",
      valorRotulo: "Em Risco",
      onRemover: () => {},
      removivel: true,
    },
    {
      id: "periodo",
      categoria: "Período",
      valorRotulo: "Últimos 30 dias",
      onRemover: () => {},
      removivel: true,
    },
  ];

  it("deve renderizar os chips de filtros ativos com categoria e valor explícitos", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResumoFiltrosAtivos, {
        filtros: filtrosExemplo,
        totalResultados: 2,
        totalGeral: 4,
        entidadeNome: "peritos",
        onLimparTudo: () => {},
      })
    );

    // 1. Container de filtros com role de região acessível
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Filtros aplicados"');

    // 2. Chips com categoria e valor
    expect(html).toContain("Semáforo:");
    expect(html).toContain("Em Risco");
    expect(html).toContain("Período:");
    expect(html).toContain("Últimos 30 dias");

    // 3. Botão individual com nome acessível
    expect(html).toContain('aria-label="Remover filtro Semáforo: Em Risco"');
    expect(html).toContain('aria-label="Remover filtro Período: Últimos 30 dias"');

    // 4. Botão de limpar tudo
    expect(html).toContain("Limpar filtros");

    // 5. Contagem com região de status anunciável
    expect(html).toContain('role="status"');
    expect(html).toContain("Exibindo 2 de 4 peritos");
  });

  it("não deve renderizar nada se a lista de filtros estiver vazia", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResumoFiltrosAtivos, {
        filtros: [],
        totalResultados: 4,
        totalGeral: 4,
      })
    );

    expect(html).toBe("");
  });
});
