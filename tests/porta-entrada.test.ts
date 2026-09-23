import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { PortaEntrada } from "../src/components/PortaEntrada";
import { ROTAS_SEM_SHELL } from "../src/components/AppShell";

describe("Porta de entrada do sistema (não é página de venda)", () => {
  const html = renderToStaticMarkup(React.createElement(PortaEntrada));

  it("identifica o sistema e oferece acesso ao login", () => {
    expect(html).toContain("Sua jornada pericial, <span>semana a semana.</span>");
    expect(html).toContain("Entre com o acesso que o Concierge já liberou.");
    expect(html).toContain('href="/login"');
    expect(html).toContain("Entrar no sistema");
    expect(html).toContain("logo-aguias-one.png");
  });

  it("orienta só o mentorado — mapa da jornada, sem painel da equipe", () => {
    expect(html).toContain("O que você encontra");
    expect(html).toContain("Visão geral");
    expect(html).toContain("Placar de entrada");
    expect(html).toContain("Check-in modular");
    expect(html).toContain("Faturamento");
    expect(html).toContain("Canais");
    expect(html).toContain("Materiais");
    expect(html).toContain("Como entrar");
    expect(html).toContain("Encontro às quartas");
    expect(html).not.toMatch(/Equipe|painel da turma|auditoria|cadastros/i);
  });

  it("não expõe WhatsApp nem número de contato na porta pública", () => {
    expect(html).not.toContain("wa.me");
    expect(html).not.toMatch(/Fale com o Concierge|Falar com o Concierge/i);
    expect(html).toContain("Receber link no e-mail cadastrado");
    expect(html).toContain("Não há canal público de WhatsApp");
  });

  it("declara acesso restrito e não vende o produto", () => {
    expect(html).toContain("Acesso restrito a quem já está na mentoria");
    expect(html).not.toMatch(/comprar|inscreva|garanta|depoimento|investimento|vaga|oferta|preço/i);
  });

  it("expõe skip link e títulos semânticos", () => {
    expect(html).toContain('href="#porta-titulo"');
    expect(html).toContain('id="porta-titulo"');
    expect(html).toContain("<h1");
    expect(html).toContain("<h2");
  });

  it("fica fora do shell autenticado", () => {
    expect(ROTAS_SEM_SHELL).toContain("/");
    expect(ROTAS_SEM_SHELL).toContain("/login");
  });

  it("a home deixa de mandar visitante direto ao login", () => {
    const fonte = fs.readFileSync(path.resolve(__dirname, "../src/app/page.tsx"), "utf-8");
    expect(fonte).toContain("PortaEntrada");
    expect(fonte).not.toMatch(/if\s*\(!perfil\)\s*redirect\("\/login"\)/);
  });
});
