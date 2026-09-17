import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import { RevisaoPlacar } from "../src/components/diagnostico/aluno/RevisaoPlacar";
import { formatarValorCampo } from "../src/lib/diagnostico/cliente";
import { BLOCOS } from "../src/lib/diagnostico/campos";

const PAGINA = fs.readFileSync("src/app/(aluno)/onboarding/diagnostico/page.tsx", "utf8");

describe("Revisão antes do envio (Câmara UX)", () => {
  const html = renderToStaticMarkup(
    React.createElement(RevisaoPlacar, { payload: { atende_hoje: true }, onEditarBloco: () => {} })
  );

  it("lista os blocos respondidos com título próprio", () => {
    expect(html).toContain(BLOCOS[0].titulo);
    expect(html).toContain("<dl");
  });

  it("oferece correção por bloco, com rótulo compreensível fora de contexto", () => {
    expect(html).toContain("Editar");
    expect(html).toContain(`as respostas de ${BLOCOS[0].titulo}`);
  });

  it("mostra o que ainda não foi respondido em vez de omitir", () => {
    expect(html).toContain("—");
  });
});

describe("Fluxo de etapas do placar", () => {
  it("a etapa final é revisar, e o envio so acontece na revisão", () => {
    expect(PAGINA).toContain("Revisar e enviar");
    expect(PAGINA).toContain("Enviar placar");
    expect(PAGINA).toContain("const passoRevisao = total + 1");
  });

  it("informa a posição no fluxo com o total real, incluindo a revisão", () => {
    expect(PAGINA).toContain("{passo} de {passoRevisao}");
    expect(PAGINA).toContain("aria-valuemax={passoRevisao}");
  });

  it("salva o rascunho ao avançar, para voltar sem perder dados", () => {
    expect(PAGINA).toContain("await salvarRascunho();");
    expect(PAGINA).toContain("const voltar = ");
  });

  it("erro de validação leva de volta ao bloco do campo", () => {
    expect(PAGINA).toContain("blocoDoCampo(e.erro.campo)");
  });
});

describe("formatarValorCampo", () => {
  it("traduz cada tipo de resposta para leitura", () => {
    expect(formatarValorCampo("x", "bool", true)).toBe("Sim");
    expect(formatarValorCampo("x", "bool", false)).toBe("Não");
    expect(formatarValorCampo("x", "centavos", 150000)).toContain("1.500");
    expect(formatarValorCampo("x", "texto", "")).toBe("—");
    expect(formatarValorCampo("x", "multi", [])).toBe("—");
  });
});
