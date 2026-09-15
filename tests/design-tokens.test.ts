import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Design Tokens (Cohere Enterprise 2026)", () => {
  it("deve conter as variáveis CSS oficiais do DESIGN.md", () => {
    const cssPath = path.resolve(__dirname, "../src/styles/tokens.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain("--cor-primary: #17171c");
    expect(css).toContain("--cor-deep-green: #003c33");
    expect(css).toContain("--cor-dark-navy: #071829");
    expect(css).toContain("--cor-canvas: #ffffff");
    expect(css).toContain("--radius-pill: 32px");
  });
});
