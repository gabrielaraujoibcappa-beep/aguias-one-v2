import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { EstadoCarregando } from "../src/components/ui/EstadoCarregando";

const render = (props: Parameters<typeof EstadoCarregando>[0] = {}) =>
  renderToStaticMarkup(React.createElement(EstadoCarregando, props));

describe("EstadoCarregando (Câmara UX)", () => {
  it("anuncia o que está carregando sem mover o foco", () => {
    const html = render({ texto: "a fila de auditoria" });
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Carregando a fila de auditoria");
  });

  it("esconde o esqueleto do leitor de tela e não inventa porcentagem", () => {
    const html = render({ variante: "tabela" });
    expect(html).toContain('aria-hidden="true"');
    // Espera sem avanço mensurável: nada de barra de progresso com valor inventado
    expect(html).not.toContain("aria-valuenow");
    expect(html).not.toContain("progressbar");
  });

  it("imita a estrutura esperada em cada variante", () => {
    const contarEsqueletos = (html: string) => (html.match(/esqueleto/g) || []).length;
    expect(contarEsqueletos(render({ variante: "tabela", itens: 5 }))).toBeGreaterThan(
      contarEsqueletos(render({ variante: "tabela", itens: 2 }))
    );
    expect(render({ variante: "formulario" })).toContain("card");
  });
});

describe("Telas não ficam em branco durante a espera", () => {
  const raiz = path.join(process.cwd(), "src", "app");

  const paginas = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const alvo = path.join(dir, e.name);
      if (e.isDirectory()) return paginas(alvo);
      return e.name === "page.tsx" ? [alvo] : [];
    });

  it("nenhuma página devolve null enquanto carrega", () => {
    const comTelaBranca = paginas(raiz).filter((p) =>
      fs.readFileSync(p, "utf8").includes("if (!carregado) return null")
    );
    expect(comTelaBranca).toEqual([]);
  });

  it("há tela de erro e de rota inexistente com recuperação", () => {
    const erro = fs.readFileSync(path.join(raiz, "error.tsx"), "utf8");
    expect(erro).toContain('role="alert"');
    expect(erro).toContain("Tentar carregar de novo");
    expect(fs.existsSync(path.join(raiz, "not-found.tsx"))).toBe(true);
  });

  it("o esqueleto respeita a preferência de reduzir movimento", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const bloco = css.slice(css.indexOf(".esqueleto {"));
    expect(bloco).toContain("prefers-reduced-motion: reduce");
    expect(bloco).toContain("animation: none");
  });
});
