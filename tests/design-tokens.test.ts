import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Design Tokens (ÁGUIAS ONE Design System)", () => {
  it("deve conter as variáveis CSS oficiais da paleta de destaque, fundos, texto e radii", () => {
    const cssPath = path.resolve(__dirname, "../src/styles/tokens.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, "utf-8");
    // Cores de Ação e Destaque
    expect(css).toContain("--cor-action-vibrant: #0052ff");
    expect(css).toContain("--cor-action-glow: #00c2ff");
    expect(css).toContain("--gradiente-cta:");
    // Cores de Fundo e Base
    expect(css).toContain("--cor-canvas: #ffffff");
    expect(css).toContain("--cor-bg-page: #f8f9fa");
    expect(css).toContain("--cor-dark-deep: #0a0a0b");
    // Cores de Texto e Tipografia
    expect(css).toContain("--cor-primary: #111827");
    expect(css).toContain("--cor-text-muted: #4b5563");
    // Arredondamentos
    expect(css).toContain("--radius-pill: 32px");
  });
});
