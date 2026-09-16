import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/Button";
import { ButtonGroup } from "../src/components/ui/ButtonGroup";

describe("Hierarquia de Botões (Câmara UX / Gov.br Design System)", () => {
  it("deve renderizar botão primário com classe btn-primary e tipo nativo", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          variante: "primario",
          type: "submit",
        },
        "Salvar declaração"
      )
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain("btn-primary");
    expect(html).toContain("Salvar declaração");
  });

  it("deve renderizar botão secundário com classe btn-secondary para alternativas", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          variante: "secundario",
        },
        "Cancelar"
      )
    );

    expect(html).toContain("btn-secondary");
    expect(html).toContain("Cancelar");
  });

  it("deve renderizar variantes terciário e perigo", () => {
    const htmlTerciario = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          variante: "terciario",
        },
        "Ver detalhes"
      )
    );
    expect(htmlTerciario).toContain("btn-tertiary");

    const htmlPerigo = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          variante: "perigo",
        },
        "Excluir arquivo"
      )
    );
    expect(htmlPerigo).toContain("btn-danger");
  });

  it("deve aplicar modificadores de escala (sm, md, lg) e largura total", () => {
    const htmlSm = renderToStaticMarkup(
      React.createElement(Button, { tamanho: "sm" }, "Pequeno")
    );
    expect(htmlSm).toContain("btn-sm");

    const htmlLgFull = renderToStaticMarkup(
      React.createElement(Button, { tamanho: "lg", larguraTotal: true }, "Grande")
    );
    expect(htmlLgFull).toContain("btn-lg");
    expect(htmlLgFull).toContain("btn-full");
  });

  it("deve configurar atributos de acessibilidade no estado de carregamento", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          carregando: true,
          textoCarregando: "Processando envio...",
        },
        "Enviar"
      )
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("disabled");
    expect(html).toContain("btn-spinner");
    expect(html).toContain("Processando envio...");
  });

  it("deve renderizar ícones decorativos com aria-hidden='true'", () => {
    const icone = React.createElement("span", { id: "teste-icone" }, "✦");

    const html = renderToStaticMarkup(
      React.createElement(
        Button,
        {
          iconeInicio: icone,
        },
        "Novo Aluno"
      )
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("teste-icone");
    expect(html).toContain("Novo Aluno");
  });
});

describe("ButtonGroup (Câmara UX / Gov.br Design System)", () => {
  it("deve agrupar ação primária e secundária com ordem lógica e alinhamento à direita", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        ButtonGroup,
        {
          alinhamento: "direita",
          responsivo: true,
          ariaLabel: "Ações da declaração",
        },
        React.createElement(Button, { variante: "secundario" }, "Cancelar"),
        React.createElement(Button, { variante: "primario" }, "Concluir check-in")
      )
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Ações da declaração"');
    expect(html).toContain("btn-group-right");
    expect(html).toContain("btn-group-responsive");

    // Ambos os botões devem estar presentes
    expect(html).toContain("Cancelar");
    expect(html).toContain("btn-secondary");
    expect(html).toContain("Concluir check-in");
    expect(html).toContain("btn-primary");
  });

  it("deve suportar alinhamento justificado e centralizado", () => {
    const htmlJustificado = renderToStaticMarkup(
      React.createElement(
        ButtonGroup,
        { alinhamento: "justificado" },
        React.createElement(Button, { variante: "secundario" }, "Voltar"),
        React.createElement(Button, { variante: "primario" }, "Avançar")
      )
    );
    expect(htmlJustificado).toContain("btn-group-justified");

    const htmlCentro = renderToStaticMarkup(
      React.createElement(
        ButtonGroup,
        { alinhamento: "centro" },
        React.createElement(Button, { variante: "primario" }, "Começar")
      )
    );
    expect(htmlCentro).toContain("btn-group-center");
  });
});
