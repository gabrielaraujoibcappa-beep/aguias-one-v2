import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FiltroPeriodo } from "../src/components/ui/FiltroPeriodo";
import { PeriodoFiltroState } from "../src/lib/periodo/calculo-periodo";

describe("Componente FiltroPeriodo (Diretrizes UX, WAI-ARIA e Heurísticas)", () => {
  const estadoExemplo: PeriodoFiltroState = {
    tipo: "relativo",
    atalho: "ultimos_30d",
    dataInicio: "2026-08-17",
    dataFim: "2026-09-16",
    granularidade: "semana",
    fusoHorario: "America/Sao_Paulo (UTC-3)",
    ultimaAtualizacao: new Date("2026-09-16T08:00:00Z"),
    escopo: "Global (Painel da Turma 2026.1)",
  };

  it("deve renderizar o período ativo visível em texto, escopo e fuso horário", () => {
    const html = renderToStaticMarkup(
      React.createElement(FiltroPeriodo, {
        valor: estadoExemplo,
        onChange: () => {},
        onAtualizarDados: () => {},
      })
    );

    // 1. O período ativo NÃO é apenas um ícone silencioso: texto claro e legível
    expect(html).toContain("Últimos 30 dias");
    expect(html).toContain("17/08/2026");
    expect(html).toContain("16/09/2026");

    // 2. Escopo explícito
    expect(html).toContain("Escopo: Global (Painel da Turma 2026.1)");

    // 3. Fuso e última atualização
    expect(html).toContain("America/Sao_Paulo (UTC-3)");

    // 4. Granularidade separada
    expect(html).toContain("Granularidade:");
    expect(html).toContain("Semana");

    // 5. Botão trigger com semântica WAI-ARIA
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("deve exibir indicador de período fixo quando customizado", () => {
    const estadoFixo: PeriodoFiltroState = {
      tipo: "customizado",
      dataInicio: "2026-08-01",
      dataFim: "2026-08-31",
      granularidade: "mes",
      fusoHorario: "America/Sao_Paulo (UTC-3)",
      ultimaAtualizacao: new Date("2026-09-16T08:00:00Z"),
      escopo: "Global (Painel da Turma)",
    };

    const html = renderToStaticMarkup(
      React.createElement(FiltroPeriodo, {
        valor: estadoFixo,
        onChange: () => {},
      })
    );

    expect(html).toContain("Personalizado");
    expect(html).toContain("01/08/2026");
    expect(html).toContain("31/08/2026");
    expect(html).toContain("Fixo");
  });
});
