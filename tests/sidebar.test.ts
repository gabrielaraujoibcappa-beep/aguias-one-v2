import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sidebar } from "../src/components/Sidebar";

// Mock do Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Componente Sidebar (Arquitetura de Navegação Unificada ÁGUIAS ONE v2)", () => {
  it("deve renderizar estrutura semântica acessível com aside, nav e busca Ctrl+K", () => {
    const html = renderToStaticMarkup(React.createElement(Sidebar));

    // 1. Container semântico da barra e navegação
    expect(html).toContain("<aside");
    expect(html).toContain('aria-label="Navegação lateral principal"');

    // 2. Identidade Institucional
    expect(html).toContain("ÁGUIAS ONE");
    expect(html).toContain("IBCAPPA · UniBCAPPA");

    // 3. Atalho de Busca Rápida Ctrl+K
    expect(html).toContain(">Buscar<");
    expect(html).toContain("Ctrl K");

    // 4. Seções estruturadas da Sidebar
    expect(html).toContain("Principal");
    expect(html).toContain("Jornada");
    expect(html).toContain("Meu negócio");

    // 5. Links principais do Mentorado
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/checkin/mod-1"');
    expect(html).toContain('href="/faturamento"');
    expect(html).toContain('href="/canais"');

    // 6. Indicação de rota ativa com aria-current="page"
    expect(html).toContain('aria-current="page"');

    // 7. Botão de alternância de largura acessível
    expect(html).toContain('aria-label="Recolher barra lateral"');

    // 8. Botão hambúrguer acessível para mobile
    expect(html).toContain('aria-label="Abrir menu de navegação"');
  });

  it("deve seguir o padrão de navegação principal acessível (nav rotulado, lista, controles ligados)", () => {
    const html = renderToStaticMarkup(React.createElement(Sidebar));

    // nav com rótulo próprio e links organizados em lista
    expect(html).toContain('<nav aria-label="Navegação principal"');
    expect(html).toContain('<ul class="sidebar-nav-list"');
    expect(html).toContain("<li>");

    // Hambúrguer aponta para o drawer que controla
    expect(html).toContain('aria-controls="sidebar-principal"');
    expect(html).toContain('id="sidebar-principal"');

    // Seções agrupadas e rotuladas para leitores de tela
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-labelledby="sidebar-secao-0"');

    // Links de navegação usam a classe com área de toque mínima
    expect(html).toContain('class="sidebar-link"');

    // Botões de ícone usam a classe de 44px
    expect(html).toContain('class="sidebar-icon-btn"');
  });
});
