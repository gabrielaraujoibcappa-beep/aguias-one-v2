import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  estadoInicialProposta,
  reduzirProposta,
} from "../src/lib/ux/proposta-ia";
import { RevisaoPropostaIA } from "../src/components/ui/RevisaoPropostaIA";

describe("Revisão de resultado de IA (Câmara UX)", () => {
  it("começa como proposta, não como conteúdo final", () => {
    const estado = estadoInicialProposta("Rascunho do parecer.");
    expect(estado.fase).toBe("proposta");
    expect(estado.texto).toBe("Rascunho do parecer.");
  });

  it("aceitar, editar localmente, gerar outra e descartar são transições distintas", () => {
    let estado = estadoInicialProposta("Versão A");

    estado = reduzirProposta(estado, { tipo: "iniciarEdicao" });
    expect(estado.fase).toBe("editando");
    estado = reduzirProposta(estado, { tipo: "salvarEdicao", texto: "Versão A corrigida" });
    expect(estado.fase).toBe("proposta");
    expect(estado.texto).toBe("Versão A corrigida");

    estado = reduzirProposta(estado, { tipo: "receber", texto: "Versão B" });
    expect(estado.fase).toBe("proposta");
    expect(estado.texto).toBe("Versão B");

    estado = reduzirProposta(estado, { tipo: "aceitar" });
    expect(estado.fase).toBe("aceita");

    estado = reduzirProposta(estado, { tipo: "desfazer" });
    expect(estado.fase).toBe("proposta");
    expect(estado.texto).toBe("Versão B");

    estado = reduzirProposta(estado, { tipo: "descartar" });
    expect(estado.fase).toBe("descartada");
    estado = reduzirProposta(estado, { tipo: "desfazer" });
    expect(estado.fase).toBe("proposta");
  });

  it("cancelar edição devolve o texto anterior sem regenerar tudo", () => {
    let estado = estadoInicialProposta("Original");
    estado = reduzirProposta(estado, { tipo: "iniciarEdicao" });
    estado = reduzirProposta(estado, { tipo: "cancelarEdicao" });
    expect(estado.fase).toBe("proposta");
    expect(estado.texto).toBe("Original");
  });

  it("aceitar não se confunde com descarte e não apaga o caminho de desfazer", () => {
    let estado = estadoInicialProposta("Proposta");
    estado = reduzirProposta(estado, { tipo: "aceitar" });
    expect(estado.fase).toBe("aceita");
    expect(reduzirProposta(estado, { tipo: "descartar" }).fase).toBe("aceita");
    expect(reduzirProposta(estado, { tipo: "desfazer" }).fase).toBe("proposta");
  });

  it("a UI expõe proposta, ações com verbo e campo rotulado — sem ícone solto", () => {
    const html = renderToStaticMarkup(
      React.createElement(RevisaoPropostaIA, {
        texto: "Resumo da call de quarta.",
        onGerarOutra: () => undefined,
      })
    );

    expect(html).toContain("Gerado por IA — proposta, não conteúdo final");
    expect(html).toContain("Aceitar proposta");
    expect(html).toContain("Editar");
    expect(html).toContain("Gerar outra");
    expect(html).toContain("Descartar sugestão");
    expect(html).toContain("Resumo da call de quarta.");
    expect(html).toContain('role="status"');
    expect(html).not.toMatch(/Aplicar|OK|Confirmar envio/i);
  });
});
