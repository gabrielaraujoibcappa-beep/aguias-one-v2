import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs, calcularProximaAba, TabItem } from "../src/components/ui/Tabs";

describe("Componente Tabs (Diretrizes W3C WAI-ARIA, NN/g e Carbon)", () => {
  const tabsExemplo: TabItem[] = [
    {
      id: "pendentes",
      label: "Aguardando Avaliação",
      badge: 3,
      content: React.createElement("div", null, "Conteúdo de Pendentes"),
    },
    {
      id: "historico",
      label: "Histórico Avaliado",
      badge: 12,
      content: React.createElement("div", null, "Conteúdo do Histórico"),
    },
  ];

  it("deve renderizar estrutura semântica W3C (role tablist, tab, tabpanel)", () => {
    const html = renderToStaticMarkup(
      React.createElement(Tabs, {
        tabs: tabsExemplo,
        defaultTabId: "pendentes",
        ariaLabel: "Esteira de auditoria de entregas",
      })
    );

    // 1. Tablist com aria-label e orientação horizontal
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Esteira de auditoria de entregas"');
    expect(html).toContain('aria-orientation="horizontal"');

    // 2. Abas individuais com role="tab", aria-selected e aria-controls
    expect(html).toContain('id="tab-pendentes"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-controls="panel-pendentes"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="0"');

    expect(html).toContain('id="tab-historico"');
    expect(html).toContain('aria-controls="panel-historico"');
    expect(html).toContain('aria-selected="false"');
    expect(html).toContain('tabindex="-1"');

    // 3. Tabpanel ativo vinculado por aria-labelledby
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('id="panel-pendentes"');
    expect(html).toContain('aria-labelledby="tab-pendentes"');
    expect(html).toContain("Conteúdo de Pendentes");
  });

  it("deve calcular corretamente a navegação por teclado (Roving Tabindex)", () => {
    const ids = ["tab-1", "tab-2", "tab-3"];

    // Seta Direita avança
    expect(calcularProximaAba(ids, "tab-1", "ArrowRight")).toBe("tab-2");
    expect(calcularProximaAba(ids, "tab-2", "ArrowRight")).toBe("tab-3");
    // Seta Direita no final faz wrap-around para o início
    expect(calcularProximaAba(ids, "tab-3", "ArrowRight")).toBe("tab-1");

    // Seta Esquerda recua
    expect(calcularProximaAba(ids, "tab-2", "ArrowLeft")).toBe("tab-1");
    // Seta Esquerda no início faz wrap-around para o final
    expect(calcularProximaAba(ids, "tab-1", "ArrowLeft")).toBe("tab-3");

    // Home vai para a primeira
    expect(calcularProximaAba(ids, "tab-3", "Home")).toBe("tab-1");

    // End vai para a última
    expect(calcularProximaAba(ids, "tab-1", "End")).toBe("tab-3");
  });

  it("deve ignorar abas desabilitadas na navegação por teclado", () => {
    const ids = ["tab-1", "tab-2", "tab-3"];
    const desabilitados = new Set(["tab-2"]);

    // Do 1 deve pular o 2 e ir para o 3
    expect(calcularProximaAba(ids, "tab-1", "ArrowRight", desabilitados)).toBe("tab-3");
    // Do 3 deve pular o 2 e voltar para o 1
    expect(calcularProximaAba(ids, "tab-3", "ArrowLeft", desabilitados)).toBe("tab-1");
  });
});
