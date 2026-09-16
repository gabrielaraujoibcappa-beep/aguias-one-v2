import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LoginPage from "../src/app/login/page";

// Mock do Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Tela de Login (ÁGUIAS ONE v2)", () => {
  it("deve renderizar campos semânticos de email normal, senha e botão de submissão", () => {
    const html = renderToStaticMarkup(React.createElement(LoginPage));

    // 1. Elemento de formulário
    expect(html).toContain("<form");

    // 2. Campo de Email Normal
    expect(html).toContain('type="email"');
    expect(html).toContain('id="email"');
    expect(html).toContain('for="email"');

    // 3. Campo de Senha
    expect(html).toContain('type="password"');
    expect(html).toContain('id="senha"');
    expect(html).toContain('for="senha"');

    // 4. Botão de Submissão com CTA primário
    expect(html).toContain("btn-primary");
    expect(html).toContain("Entrar");

    // 5. Identidade da Marca
    expect(html).toContain("ÁGUIAS ONE");
  });
});
