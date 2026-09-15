import { describe, it, expect } from "vitest";
import { validarComprovanteFaturamento, formatarMoedaReal, DeclaracaoFaturamento } from "../src/lib/api/faturamento";

describe("Módulo de Faturamento com Suporte a ZIP (ÁGUIAS ONE v2)", () => {
  it("deve aceitar arquivos zip, pdf, png e jpg", () => {
    expect(validarComprovanteFaturamento("extratos_setembro.zip").valido).toBe(true);
    expect(validarComprovanteFaturamento("comprovante.pdf").valido).toBe(true);
    expect(validarComprovanteFaturamento("recibo.png").valido).toBe(true);
    expect(validarComprovanteFaturamento("foto_extrato.jpg").valido).toBe(true);
  });

  it("deve rejeitar extensões não suportadas ou perigosas", () => {
    expect(validarComprovanteFaturamento("script.exe").valido).toBe(false);
    expect(validarComprovanteFaturamento("documento.docx").valido).toBe(false);
  });

  it("deve formatar valor monetário em Reais corretamente", () => {
    expect(formatarMoedaReal(15000)).toBe("R$ 15.000,00");
    expect(formatarMoedaReal(8450.5)).toBe("R$ 8.450,50");
  });
});
