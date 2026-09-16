import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IndicadorProgresso } from "../src/components/ui/IndicadorProgresso";

describe("Indicadores de Progresso (Câmara UX / WCAG)", () => {
  it("deve renderizar modo determinado com atributos W3C ARIA e porcentagem real", () => {
    const html = renderToStaticMarkup(
      React.createElement(IndicadorProgresso, {
        modo: "determinado",
        valor: 4,
        maximo: 10,
        rotulo: "Módulos Liberados",
        descricaoVisual: "4 de 10 concluídos",
        mostrarPorcentagem: true,
      })
    );

    // 1. Semântica W3C progressbar
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Módulos Liberados"');
    expect(html).toContain('aria-valuenow="4"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuetext="40% concluído (4 de 10 concluídos)"');

    // 2. Elementos visuais
    expect(html).toContain("Módulos Liberados");
    expect(html).toContain("40%");
    expect(html).toContain("4 de 10 concluídos");
  });

  it("deve renderizar modo indeterminado sem inventar porcentagens falsas (diretriz Câmara UX)", () => {
    const html = renderToStaticMarkup(
      React.createElement(IndicadorProgresso, {
        modo: "indeterminado",
        rotulo: "Sincronizando com Supabase",
        textoAcessivel: "Sincronizando faturamento, aguarde...",
      })
    );

    // 1. Semântica W3C progressbar sem aria-valuenow
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("aria-valuenow");
    expect(html).toContain('aria-valuetext="Sincronizando faturamento, aguarde..."');

    // 2. Não deve exibir nenhum percentual visível para a pessoa usuária (sem inventar precisão)
    expect(html).not.toMatch(/>\s*\d+%\s*</);
    expect(html).toContain("Sincronizando com Supabase");
  });

  it("deve limitar a barra em 100% no modo determinado quando o valor superar o máximo", () => {
    const html = renderToStaticMarkup(
      React.createElement(IndicadorProgresso, {
        modo: "determinado",
        valor: 150,
        maximo: 100,
        rotulo: "Meta Superada",
        mostrarPorcentagem: true,
      })
    );

    expect(html).toContain('aria-valuenow="150"');
    expect(html).toContain("100%");
  });
});
